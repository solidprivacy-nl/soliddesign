(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) {
    document.body.textContent = 'Operator configuratie ontbreekt.';
    return;
  }

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const CONTACT_STATUSES = [
    ['qualified', 'Gekwalificeerd'],
    ['ready_to_mail', 'Klaar voor brief'],
    ['mailed', 'Brief verstuurd'],
    ['follow_up', 'Opvolgen'],
    ['contacted', 'Contact gehad'],
    ['meeting', 'Afspraak'],
    ['proposal', 'Voorstel'],
    ['won', 'Gewonnen'],
    ['lost', 'Verloren'],
    ['no_response', 'Geen reactie']
  ];

  const state = { prospects: [], selectedId: null, reportUrls: new Set() };

  const el = (id) => document.getElementById(id);
  const loginView = el('loginView');
  const unauthorizedView = el('unauthorizedView');
  const appView = el('appView');
  const detailPanel = el('detailPanel');

  function show(view) {
    [loginView, unauthorizedView, appView].forEach((node) => node.classList.add('hidden'));
    view.classList.remove('hidden');
  }

  function setAuthMessage(text, isError = false) {
    const node = el('authMessage');
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(isError));
  }

  function formatDate(value) {
    if (!value) return 'Nog geen contactmoment geregistreerd';
    return `Laatste contact: ${new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))}`;
  }

  function toLocalInput(value) {
    if (!value) return '';
    const d = new Date(value);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  function fromLocalInput(value) {
    return value ? new Date(value).toISOString() : null;
  }

  function scoreTotal(qualification) {
    if (!qualification) return null;
    if (Number.isFinite(qualification.total_score)) return qualification.total_score;
    const factors = qualification.factors || [];
    return factors.reduce((sum, factor) => sum + Number(factor.score || 0), 0) || null;
  }

  function latestByProspect(rows) {
    const map = new Map();
    for (const row of rows || []) {
      if (!map.has(row.prospect_id)) map.set(row.prospect_id, row);
    }
    return map;
  }

  async function isAuthorized() {
    const { data, error } = await db.from('operator_allowlist').select('email').limit(1);
    if (error) throw error;
    return Array.isArray(data) && data.length === 1;
  }

  async function bootstrap() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
      show(loginView);
      return;
    }
    el('userEmail').textContent = session.user.email || '';
    let allowed = false;
    try {
      allowed = await isAuthorized();
    } catch (error) {
      console.error(error);
    }
    if (!allowed) {
      show(unauthorizedView);
      return;
    }
    show(appView);
    await loadData();
  }

  async function loadData() {
    const { data: prospects, error: pError } = await db
      .from('prospects')
      .select('id,external_id,name,category,city,address,website_url,phone,state,qualification,contact_status,contact_note,next_action_at,last_contact_at,updated_at')
      .order('updated_at', { ascending: false });
    if (pError) return renderFatal(pError.message);

    const ids = prospects.map((p) => p.id);
    let audits = [], demos = [];
    if (ids.length) {
      const [auditResult, demoResult] = await Promise.all([
        db.from('audits').select('id,prospect_id,score,grade,findings,technical_report_html,created_at').in('prospect_id', ids).order('created_at', { ascending: false }),
        db.from('demos').select('id,prospect_id,preview_url,status,created_at').in('prospect_id', ids).order('created_at', { ascending: false })
      ]);
      if (auditResult.error) return renderFatal(auditResult.error.message);
      if (demoResult.error) return renderFatal(demoResult.error.message);
      audits = auditResult.data || [];
      demos = demoResult.data || [];
    }

    const auditMap = latestByProspect(audits);
    const demoMap = latestByProspect(demos);
    state.prospects = prospects.map((p) => ({ ...p, audit: auditMap.get(p.id) || null, demo: demoMap.get(p.id) || null }));
    renderStatusFilter();
    renderList();
    if (state.selectedId && state.prospects.some((p) => p.id === state.selectedId)) renderDetail(state.selectedId);
  }

  function renderFatal(message) {
    detailPanel.className = 'detail-panel empty-state';
    detailPanel.innerHTML = `<div><h2>Kon data niet laden</h2><p class="error-text"></p></div>`;
    detailPanel.querySelector('.error-text').textContent = message;
  }

  function renderStatusFilter() {
    const select = el('statusFilter');
    const current = select.value;
    select.innerHTML = '<option value="">Alle statussen</option>' + CONTACT_STATUSES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    select.value = current;
  }

  function filteredProspects() {
    const q = el('searchInput').value.trim().toLowerCase();
    const status = el('statusFilter').value;
    return state.prospects.filter((p) => {
      const matchesText = !q || `${p.name} ${p.city || ''}`.toLowerCase().includes(q);
      const matchesStatus = !status || (p.contact_status || 'qualified') === status;
      return matchesText && matchesStatus;
    });
  }

  function statusLabel(value) {
    return CONTACT_STATUSES.find(([v]) => v === value)?.[1] || value || 'Gekwalificeerd';
  }

  function renderList() {
    const rows = filteredProspects();
    el('countText').textContent = `${rows.length} van ${state.prospects.length}`;
    const list = el('prospectList');
    if (!rows.length) {
      list.innerHTML = '<div class="list-empty">Geen prospects gevonden.</div>';
      return;
    }
    list.innerHTML = '';
    for (const p of rows) {
      const button = document.createElement('button');
      button.className = `prospect-row${p.id === state.selectedId ? ' active' : ''}`;
      button.type = 'button';
      const audit = p.audit?.score == null ? '—' : `${p.audit.score}/100`;
      const qual = scoreTotal(p.qualification);
      button.innerHTML = `
        <div class="row-main"><strong></strong><span></span></div>
        <div class="row-meta"><span class="pill"></span><span>Audit ${audit}</span><span>${qual ?? '—'}/25</span></div>`;
      button.querySelector('strong').textContent = p.name;
      button.querySelector('.row-main span').textContent = p.city || '';
      button.querySelector('.pill').textContent = statusLabel(p.contact_status || 'qualified');
      button.addEventListener('click', () => {
        state.selectedId = p.id;
        renderList();
        renderDetail(p.id);
      });
      list.appendChild(button);
    }
  }

  function setField(root, name, value) {
    const node = root.querySelector(`[data-field="${name}"]`);
    if (node) node.textContent = value ?? '';
  }

  function renderDetail(id) {
    const p = state.prospects.find((item) => item.id === id);
    if (!p) return;
    const fragment = el('detailTemplate').content.cloneNode(true);
    const root = fragment.querySelector('.detail-content');
    setField(root, 'category', p.category || 'Prospect');
    setField(root, 'name', p.name);
    setField(root, 'location', [p.address, p.city].filter(Boolean).join(' · '));
    setField(root, 'auditScore', p.audit?.score == null ? '—' : `${p.audit.score}/100`);
    setField(root, 'auditGrade', p.audit?.grade ? `Grade ${p.audit.grade}` : '');
    setField(root, 'qualification', scoreTotal(p.qualification) ?? '—');
    setField(root, 'websiteUrl', p.website_url || '—');
    setField(root, 'phone', p.phone || '—');
    setField(root, 'auditSummary', p.audit ? `${p.audit.score ?? '—'}/100 · ${p.audit.grade || '—'}` : 'Geen audit');
    setField(root, 'demoStatus', p.demo?.status || 'Geen mock-up');
    setField(root, 'lastContact', formatDate(p.last_contact_at));

    const website = root.querySelector('[data-link="website"]');
    website.href = p.website_url || '#';
    const preview = root.querySelector('[data-link="preview"]');
    if (p.demo?.preview_url) preview.href = p.demo.preview_url;
    else { preview.removeAttribute('href'); preview.classList.add('disabled'); }

    const reportBtn = root.querySelector('[data-action="report"]');
    reportBtn.disabled = !p.audit;
    reportBtn.title = p.audit ? 'Open technisch rapport' : 'Geen technisch rapport beschikbaar';
    reportBtn.addEventListener('click', () => openReport(p));

    const status = root.querySelector('[data-input="status"]');
    status.innerHTML = CONTACT_STATUSES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    status.value = p.contact_status || 'qualified';
    root.querySelector('[data-input="note"]').value = p.contact_note || '';
    root.querySelector('[data-input="nextAction"]').value = toLocalInput(p.next_action_at);

    const factors = root.querySelector('[data-field="factors"]');
    const rawFactors = p.qualification?.factors || [];
    factors.innerHTML = '';
    for (const factor of rawFactors) {
      const row = document.createElement('div');
      row.className = 'factor-row';
      const label = String(factor.name || '').replaceAll('_', ' ');
      row.innerHTML = '<span></span><strong></strong>';
      row.querySelector('span').textContent = label;
      row.querySelector('strong').textContent = `${factor.score}/5`;
      factors.appendChild(row);
    }
    if (!rawFactors.length) factors.innerHTML = '<div class="subtle">Geen factoruitsplitsing beschikbaar.</div>';

    root.querySelector('[data-action="save"]').addEventListener('click', () => saveProspect(p.id, root, false));
    root.querySelector('[data-action="markContact"]').addEventListener('click', () => saveProspect(p.id, root, true));

    detailPanel.className = 'detail-panel';
    detailPanel.replaceChildren(fragment);
  }

  function buildFallbackReport(p) {
    const findings = p.audit?.findings || [];
    const factors = p.qualification?.factors || [];
    const findingHtml = findings.map((f, i) => `<section><h2>${i + 1}. ${escapeHtml(f.title || f.key || 'Bevinding')}</h2><p><strong>Severity:</strong> ${escapeHtml(f.severity || '—')}</p><h3>Technisch bewijs</h3>${(f.evidence || []).map(e => `<p>${escapeHtml(e)}</p>`).join('')}<h3>Business impact</h3><p>${escapeHtml(f.business_impact || '—')}</p><h3>Aanbeveling</h3><p>${escapeHtml(f.recommendation || '—')}</p></section>`).join('');
    const factorHtml = factors.map(f => `<tr><td>${escapeHtml(String(f.name || '').replaceAll('_',' '))}</td><td><strong>${Number(f.score || 0)}/5</strong></td></tr>`).join('');
    return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Technisch rapport — ${escapeHtml(p.name)}</title><style>body{font:16px/1.55 system-ui,sans-serif;color:#1d2822;max-width:900px;margin:40px auto;padding:0 24px}h1{font:700 42px/1.05 Georgia,serif}h2{margin-top:34px}h3{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:#5d6962}section{border-top:1px solid #ddd;padding-top:12px;margin-top:24px}table{width:100%;border-collapse:collapse}td{padding:10px;border-bottom:1px solid #eee}.meta{color:#68736d}.warn{background:#f5f1e9;padding:14px;border-radius:8px}</style></head><body><p class="meta">SolidDesign intern technisch dossier</p><h1>${escapeHtml(p.name)}</h1><p><strong>Website audit:</strong> ${p.audit?.score ?? '—'}/100 · Grade ${escapeHtml(p.audit?.grade || '—')}<br><strong>Kwalificatie:</strong> ${scoreTotal(p.qualification) ?? '—'}/25</p><p class="warn">Dit dossier toont de human-reviewed bevindingen die geschikt zijn als basis voor een prospectgesprek. Raw donor-evidence wordt apart bewaard.</p>${findingHtml}<h2>Kwalificatiecriteria</h2><table>${factorHtml}</table></body></html>`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function openReport(p) {
    const html = p.audit?.technical_report_html || buildFallbackReport(p);
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    state.reportUrls.add(url);
    window.open(url, '_blank', 'noopener');
    window.setTimeout(() => { URL.revokeObjectURL(url); state.reportUrls.delete(url); }, 60000);
  }

  async function saveProspect(id, root, markContact) {
    const message = root.querySelector('[data-field="saveMessage"]');
    const payload = {
      contact_status: root.querySelector('[data-input="status"]').value,
      contact_note: root.querySelector('[data-input="note"]').value.trim() || null,
      next_action_at: fromLocalInput(root.querySelector('[data-input="nextAction"]').value),
      updated_at: new Date().toISOString()
    };
    if (markContact) payload.last_contact_at = new Date().toISOString();
    message.textContent = 'Opslaan…';
    message.classList.remove('error');
    const { data, error } = await db.from('prospects').update(payload).eq('id', id).select('id,contact_status,contact_note,next_action_at,last_contact_at,updated_at').single();
    if (error) {
      message.textContent = error.message;
      message.classList.add('error');
      return;
    }
    const index = state.prospects.findIndex((p) => p.id === id);
    state.prospects[index] = { ...state.prospects[index], ...data };
    message.textContent = markContact ? 'Contactmoment en status opgeslagen.' : 'Opgeslagen.';
    setField(root, 'lastContact', formatDate(data.last_contact_at));
    renderList();
  }

  el('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    setAuthMessage('Inloggen…');
    const email = el('email').value.trim();
    const password = el('password').value;
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) return setAuthMessage(error.message, true);
    setAuthMessage('');
    await bootstrap();
  });

  el('signupBtn').addEventListener('click', async () => {
    const email = el('email').value.trim();
    const password = el('password').value;
    if (!email || password.length < 8) return setAuthMessage('Vul e-mail en een wachtwoord van minimaal 8 tekens in.', true);
    setAuthMessage('Account aanmaken…');
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` }
    });
    if (error) return setAuthMessage(error.message, true);
    if (data.session) {
      setAuthMessage('Account aangemaakt. Toegang wordt gecontroleerd…');
      await bootstrap();
    } else {
      setAuthMessage('Account aangemaakt. Controleer je e-mail om het account te bevestigen en log daarna in.');
    }
  });

  async function signOut() {
    await db.auth.signOut();
    state.prospects = [];
    state.selectedId = null;
    show(loginView);
  }

  el('signoutBtn').addEventListener('click', signOut);
  el('unauthorizedSignout').addEventListener('click', signOut);
  el('refreshBtn').addEventListener('click', loadData);
  el('searchInput').addEventListener('input', renderList);
  el('statusFilter').addEventListener('change', renderList);
  db.auth.onAuthStateChange((_event, session) => { if (!session) show(loginView); });

  bootstrap().catch((error) => {
    console.error(error);
    setAuthMessage('Operator kon niet starten.', true);
    show(loginView);
  });
})();
