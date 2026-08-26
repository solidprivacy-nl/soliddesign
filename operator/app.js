(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) {
    document.body.textContent = 'Operator configuratie ontbreekt.';
    return;
  }

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const MOCKUP_BUCKET = 'mockup-sites';
  const MAX_BUNDLE_FILES = 250;
  const MAX_BUNDLE_BYTES = 40 * 1024 * 1024;
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = new Set([
    'html', 'htm', 'css', 'js', 'mjs', 'json', 'txt', 'xml',
    'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'ico',
    'woff', 'woff2', 'ttf', 'otf', 'pdf', 'mp4', 'webm'
  ]);
  const MIME_TYPES = {
    html: 'text/html;charset=utf-8', htm: 'text/html;charset=utf-8',
    css: 'text/css;charset=utf-8', js: 'application/javascript;charset=utf-8',
    mjs: 'application/javascript;charset=utf-8', json: 'application/json;charset=utf-8',
    txt: 'text/plain;charset=utf-8', xml: 'application/xml;charset=utf-8',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    gif: 'image/gif', svg: 'image/svg+xml', ico: 'image/x-icon',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
    pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm'
  };
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

  const state = { prospects: [], demos: [], selectedId: null, reportUrls: new Set() };

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

  function setMockupMessage(root, text, isError = false) {
    const node = root.querySelector('[data-field="mockupMessage"]');
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(isError));
  }

  function formatDate(value) {
    if (!value) return 'Nog geen contactmoment geregistreerd';
    return `Laatste contact: ${new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))}`;
  }

  function formatVersionDate(value) {
    return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
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

  function qualificationFactors(qualification) {
    const factors = qualification?.factors;
    if (Array.isArray(factors)) return factors;
    if (!factors || typeof factors !== 'object') return [];
    return Object.entries(factors)
      .filter(([, factor]) => factor && typeof factor === 'object' && Number.isFinite(Number(factor.score)))
      .map(([name, factor]) => ({ name, ...factor }));
  }

  function scoreTotal(qualification) {
    if (!qualification) return null;
    if (Number.isFinite(qualification.total_score)) return qualification.total_score;
    const total = qualificationFactors(qualification).reduce((sum, factor) => sum + Number(factor.score || 0), 0);
    return total || null;
  }

  function latestByProspect(rows) {
    const map = new Map();
    for (const row of rows || []) {
      if (!map.has(row.prospect_id)) map.set(row.prospect_id, row);
    }
    return map;
  }

  function demosForProspect(prospectId) {
    return state.demos
      .filter((demo) => demo.prospect_id === prospectId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  function preferredDemo(rows) {
    return rows.find((demo) => demo.status === 'LIVE') || rows.at(-1) || null;
  }

  function publicStorageUrl(path) {
    return db.storage.from(MOCKUP_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function stableLiveUrl(prospectId) {
    return publicStorageUrl(`live/${prospectId}/index.html`);
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
        db.from('demos').select('id,prospect_id,site_config,preview_url,status,artifact_path,version_note,created_at,updated_at').in('prospect_id', ids).order('created_at', { ascending: false })
      ]);
      if (auditResult.error) return renderFatal(auditResult.error.message);
      if (demoResult.error) return renderFatal(demoResult.error.message);
      audits = auditResult.data || [];
      demos = demoResult.data || [];
    }

    state.demos = demos;
    const auditMap = latestByProspect(audits);
    state.prospects = prospects.map((p) => {
      const prospectDemos = demosForProspectFromRows(p.id, demos);
      return { ...p, audit: auditMap.get(p.id) || null, demo: preferredDemo(prospectDemos) };
    });
    renderStatusFilter();
    renderList();
    if (state.selectedId && state.prospects.some((p) => p.id === state.selectedId)) renderDetail(state.selectedId);
  }

  function demosForProspectFromRows(prospectId, rows) {
    return rows
      .filter((demo) => demo.prospect_id === prospectId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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

    renderMockupWorkspace(p, root);

    const status = root.querySelector('[data-input="status"]');
    status.innerHTML = CONTACT_STATUSES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    status.value = p.contact_status || 'qualified';
    root.querySelector('[data-input="note"]').value = p.contact_note || '';
    root.querySelector('[data-input="nextAction"]').value = toLocalInput(p.next_action_at);

    const factors = root.querySelector('[data-field="factors"]');
    const rawFactors = qualificationFactors(p.qualification);
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

  function renderMockupWorkspace(p, root) {
    const versions = demosForProspect(p.id);
    const live = versions.find((demo) => demo.status === 'LIVE') || null;
    const liveBox = root.querySelector('[data-field="liveMockup"]');
    liveBox.replaceChildren();

    const liveTitle = document.createElement('strong');
    liveTitle.textContent = live ? 'Huidige live versie' : 'Nog geen live versie';
    liveBox.appendChild(liveTitle);

    if (live) {
      const liveIndex = versions.findIndex((demo) => demo.id === live.id) + 1;
      const summary = document.createElement('div');
      summary.className = 'version-meta';
      summary.textContent = `v${liveIndex} · ${formatVersionDate(live.created_at)}`;
      liveBox.appendChild(summary);

      const useStableUrl = Boolean(live.site_config?._operator?.stable_live);
      const url = useStableUrl ? stableLiveUrl(p.id) : live.preview_url;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = useStableUrl ? `Publieke URL: ${url}` : `Preview: ${url}`;
        liveBox.appendChild(link);
      }
    } else {
      const text = document.createElement('div');
      text.className = 'subtle';
      text.textContent = 'Upload een versie en zet die daarna bewust live.';
      liveBox.appendChild(text);
    }

    setField(root, 'versionCount', `${versions.length} versie${versions.length === 1 ? '' : 's'}`);
    const versionList = root.querySelector('[data-field="versionList"]');
    versionList.replaceChildren();
    if (!versions.length) {
      const empty = document.createElement('div');
      empty.className = 'subtle';
      empty.textContent = 'Nog geen mock-upversies.';
      versionList.appendChild(empty);
    } else {
      [...versions].reverse().forEach((demo) => {
        const versionNumber = versions.findIndex((item) => item.id === demo.id) + 1;
        versionList.appendChild(buildVersionRow(p, demo, versionNumber, root));
      });
    }

    root.querySelector('[data-action="uploadMockup"]').addEventListener('click', () => uploadMockupBundle(p, root));
    root.querySelector('[data-action="addExternalPreview"]').addEventListener('click', () => addExternalPreview(p, root));
  }

  function buildVersionRow(p, demo, versionNumber, root) {
    const row = document.createElement('div');
    row.className = 'version-row';

    const main = document.createElement('div');
    main.className = 'version-main';
    const title = document.createElement('div');
    title.className = 'version-title';
    const strong = document.createElement('strong');
    strong.textContent = `v${versionNumber}`;
    const status = document.createElement('span');
    const statusName = String(demo.status || 'DRAFT').toUpperCase();
    status.className = `version-status ${statusName.toLowerCase()}`;
    status.textContent = statusName;
    title.append(strong, status);
    main.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'version-meta';
    const source = demo.artifact_path ? 'bundle' : 'externe preview';
    meta.textContent = `${formatVersionDate(demo.created_at)} · ${source}`;
    main.appendChild(meta);
    if (demo.version_note) {
      const note = document.createElement('div');
      note.className = 'version-note';
      note.textContent = demo.version_note;
      main.appendChild(note);
    }

    const actions = document.createElement('div');
    actions.className = 'version-actions';
    if (demo.preview_url) {
      const open = document.createElement('a');
      open.href = demo.preview_url;
      open.target = '_blank';
      open.rel = 'noopener';
      open.textContent = 'Open';
      actions.appendChild(open);
    }
    if (demo.status !== 'LIVE') {
      const promote = document.createElement('button');
      promote.type = 'button';
      promote.className = 'secondary';
      promote.textContent = 'Maak live';
      promote.addEventListener('click', () => promoteDemo(p, demo, root, promote));
      actions.appendChild(promote);
    }
    row.append(main, actions);
    return row;
  }

  function extensionFor(path) {
    const filename = path.split('/').at(-1) || '';
    const dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : '';
  }

  function cleanBundlePath(rawPath) {
    const path = rawPath.replaceAll('\\', '/');
    if (!path || path.startsWith('/') || path.includes('\0')) throw new Error(`Ongeldig bestandspad: ${rawPath}`);
    const parts = path.split('/');
    if (parts.some((part) => !part || part === '.' || part === '..')) throw new Error(`Ongeldig bestandspad: ${rawPath}`);
    return path;
  }

  function stripSingleWrapper(entries) {
    if (entries.some((entry) => entry.path.toLowerCase() === 'index.html')) return entries;
    const roots = new Set(entries.map((entry) => entry.path.split('/')[0]));
    if (roots.size !== 1) return entries;
    const root = [...roots][0];
    const prefix = `${root}/`;
    if (!entries.some((entry) => entry.path.toLowerCase() === `${prefix}index.html`.toLowerCase())) return entries;
    return entries.map((entry) => ({ ...entry, path: entry.path.slice(prefix.length) }));
  }

  function validateBundleEntries(entries) {
    if (!entries.length) throw new Error('Het pakket bevat geen bestanden.');
    if (entries.length > MAX_BUNDLE_FILES) throw new Error(`Het pakket bevat meer dan ${MAX_BUNDLE_FILES} bestanden.`);
    let totalBytes = 0;
    for (const entry of entries) {
      entry.path = cleanBundlePath(entry.path);
      const extension = extensionFor(entry.path);
      if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error(`Bestandstype niet toegestaan: ${entry.path}`);
      if (entry.bytes.byteLength > MAX_FILE_BYTES) throw new Error(`Bestand is groter dan 10 MB: ${entry.path}`);
      totalBytes += entry.bytes.byteLength;
    }
    if (totalBytes > MAX_BUNDLE_BYTES) throw new Error('Het uitgepakte pakket is groter dan 40 MB.');
    if (!entries.some((entry) => entry.path.toLowerCase() === 'index.html')) throw new Error('index.html ontbreekt in de root van het pakket.');
    const indexEntry = entries.find((entry) => entry.path.toLowerCase() === 'index.html');
    const indexText = new TextDecoder().decode(indexEntry.bytes);
    if (/file:\/\//i.test(indexText)) throw new Error('index.html bevat een lokale file:// verwijzing. Gebruik relatieve paden.');
    const externalReferences = (indexText.match(/https?:\/\//gi) || []).length;
    return { entries, externalReferences, totalBytes };
  }

  async function prepareBundle(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.html') || file.type === 'text/html') {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return validateBundleEntries([{ path: 'index.html', bytes }]);
    }
    if (!name.endsWith('.zip')) throw new Error('Kies een .html- of .zip-bestand.');
    if (!window.fflate?.unzipSync) throw new Error('ZIP-ondersteuning kon niet worden geladen. Vernieuw de pagina en probeer opnieuw.');
    if (file.size > 25 * 1024 * 1024) throw new Error('Het ZIP-bestand is groter dan 25 MB.');
    const unpacked = window.fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));
    let entries = Object.entries(unpacked)
      .filter(([path]) => !path.endsWith('/') && !path.startsWith('__MACOSX/'))
      .map(([path, bytes]) => ({ path: cleanBundlePath(path), bytes }));
    entries = stripSingleWrapper(entries);
    return validateBundleEntries(entries);
  }

  async function uploadMockupBundle(p, root) {
    const input = root.querySelector('[data-input="mockupFile"]');
    const noteInput = root.querySelector('[data-input="mockupNote"]');
    const button = root.querySelector('[data-action="uploadMockup"]');
    const file = input.files?.[0];
    if (!file) return setMockupMessage(root, 'Kies eerst een HTML- of ZIP-bestand.', true);

    button.disabled = true;
    setMockupMessage(root, 'Pakket controleren…');
    let bundle;
    try {
      bundle = await prepareBundle(file);
    } catch (error) {
      button.disabled = false;
      return setMockupMessage(root, error.message || String(error), true);
    }

    const demoId = crypto.randomUUID();
    const artifactPath = `versions/${p.id}/${demoId}`;
    const uploadedPaths = [];
    try {
      for (let i = 0; i < bundle.entries.length; i += 1) {
        const entry = bundle.entries[i];
        setMockupMessage(root, `Uploaden ${i + 1}/${bundle.entries.length}…`);
        const extension = extensionFor(entry.path);
        const storagePath = `${artifactPath}/${entry.path}`;
        const blob = new Blob([entry.bytes], { type: MIME_TYPES[extension] || 'application/octet-stream' });
        const { error } = await db.storage.from(MOCKUP_BUCKET).upload(storagePath, blob, {
          contentType: MIME_TYPES[extension] || 'application/octet-stream',
          cacheControl: '31536000',
          upsert: false
        });
        if (error) throw error;
        uploadedPaths.push(storagePath);
      }

      const previewUrl = publicStorageUrl(`${artifactPath}/index.html`);
      const note = noteInput.value.trim() || null;
      const { error: insertError } = await db.from('demos').insert({
        id: demoId,
        prospect_id: p.id,
        site_config: { source: 'operator_bundle', file_count: bundle.entries.length },
        preview_url: previewUrl,
        status: 'DRAFT',
        artifact_path: artifactPath,
        version_note: note
      });
      if (insertError) throw insertError;

      const externalMessage = bundle.externalReferences
        ? ` ${bundle.externalReferences} externe URL-verwijzing${bundle.externalReferences === 1 ? '' : 'en'} gevonden; controleer die vóór LIVE.`
        : '';
      setMockupMessage(root, `Nieuwe DRAFT-versie aangemaakt.${externalMessage}`);
      await loadData();
    } catch (error) {
      if (uploadedPaths.length) await db.storage.from(MOCKUP_BUCKET).remove(uploadedPaths);
      button.disabled = false;
      setMockupMessage(root, error.message || String(error), true);
    }
  }

  async function addExternalPreview(p, root) {
    const urlInput = root.querySelector('[data-input="externalPreview"]');
    const noteInput = root.querySelector('[data-input="mockupNote"]');
    const button = root.querySelector('[data-action="addExternalPreview"]');
    let url;
    try {
      url = new URL(urlInput.value.trim());
      if (url.protocol !== 'https:') throw new Error('Gebruik een https:// URL.');
    } catch (error) {
      return setMockupMessage(root, error.message || 'Voer een geldige https:// URL in.', true);
    }

    button.disabled = true;
    setMockupMessage(root, 'Externe preview toevoegen…');
    const { error } = await db.from('demos').insert({
      prospect_id: p.id,
      site_config: { source: 'external_url' },
      preview_url: url.toString(),
      status: 'DRAFT',
      version_note: noteInput.value.trim() || null
    });
    if (error) {
      button.disabled = false;
      return setMockupMessage(root, error.message, true);
    }
    await loadData();
  }

  function redirectHtml(targetUrl) {
    const jsTarget = JSON.stringify(targetUrl).replaceAll('<', '\\u003c');
    return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><title>SolidDesign concept</title></head><body><p>Concept laden…</p><script>location.replace(${jsTarget});<\/script><noscript><a href="${escapeHtml(targetUrl)}">Open concept</a></noscript></body></html>`;
  }

  async function promoteDemo(p, demo, root, button) {
    if (!demo.preview_url) return setMockupMessage(root, 'Deze versie heeft geen preview URL.', true);
    button.disabled = true;
    setMockupMessage(root, 'Versie live zetten…');
    try {
      const livePath = `live/${p.id}/index.html`;
      const html = redirectHtml(demo.preview_url);
      const { error: uploadError } = await db.storage.from(MOCKUP_BUCKET).upload(
        livePath,
        new Blob([html], { type: 'text/html;charset=utf-8' }),
        { contentType: 'text/html;charset=utf-8', cacheControl: '60', upsert: true }
      );
      if (uploadError) throw uploadError;

      const now = new Date().toISOString();
      const siteConfig = {
        ...(demo.site_config || {}),
        _operator: { ...(demo.site_config?._operator || {}), stable_live: true }
      };
      const { error: liveError } = await db.from('demos')
        .update({ status: 'LIVE', site_config: siteConfig, updated_at: now })
        .eq('id', demo.id);
      if (liveError) throw liveError;

      const { error: archiveError } = await db.from('demos')
        .update({ status: 'ARCHIVED', updated_at: now })
        .eq('prospect_id', p.id)
        .eq('status', 'LIVE')
        .neq('id', demo.id);
      if (archiveError) throw archiveError;

      await loadData();
    } catch (error) {
      button.disabled = false;
      setMockupMessage(root, error.message || String(error), true);
    }
  }

  function buildFallbackReport(p) {
    const findings = p.audit?.findings || [];
    const factors = qualificationFactors(p.qualification);
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
    state.demos = [];
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
