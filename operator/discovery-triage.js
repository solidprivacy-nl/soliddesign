(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const inFlight = new Set();
  const GROUPS = Object.freeze([
    { key: 'recommended', label: 'AANBEVOLEN', hint: 'Sterke kandidaten om als eerste te beoordelen.' },
    { key: 'review', label: 'BEOORDELEN', hint: 'Mogelijke kandidaten of nog niet volledig beoordeeld.' },
    { key: 'low', label: 'LAGE PRIORITEIT', hint: 'Weinig zichtbare verbeterkans of minder eenvoudig overtuigend te verbeteren.' },
    { key: 'disqualified', label: 'AFGEWEZEN', hint: 'Kandidaten die niet door de basiscontrole kwamen.' }
  ]);

  let decorateTimer = null;
  let candidateObserver = null;

  function normalizeUrl(value) {
    try {
      const url = new URL(value);
      url.hash = '';
      return url.toString();
    } catch {
      return String(value || '').trim();
    }
  }

  function verdictLabel(value) {
    return ({ STRONG: 'STERK', POSSIBLE: 'MOGELIJK', WEAK: 'LAGE PRIORITEIT', UNASSESSED: 'NIET BEOORDEELD' })[value] || 'NIET BEOORDEELD';
  }

  function stateLabel(value) {
    return ({ DISCOVERED: 'Gevonden', DISQUALIFIED: 'Afgewezen' })[value] || value || '—';
  }

  function hasScore(value) {
    return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  }

  function groupKey(row) {
    if (row.state === 'DISQUALIFIED') return 'disqualified';
    const verdict = row.qualification?.triage?.verdict;
    if (verdict === 'STRONG') return 'recommended';
    if (verdict === 'WEAK') return 'low';
    return 'review';
  }

  function scoreValue(row, key) {
    const value = row.qualification?.triage?.[key]?.score;
    return hasScore(value) ? Number(value) : -1;
  }

  function scoreClass(value) {
    if (!hasScore(value)) return 'unknown';
    const score = Number(value);
    if (score >= 4) return 'good';
    if (score >= 2) return 'medium';
    return 'weak';
  }

  function gateState(triage) {
    const values = Object.values(triage?.hard_gates || {});
    if (values.some((value) => value === false)) return { label: 'Basischeck mislukt', symbol: '✕', css: 'fail' };
    if (values.length && values.every(Boolean)) return { label: 'Basischeck OK', symbol: '✓', css: 'pass' };
    return { label: 'Basischeck —', symbol: '·', css: 'unknown' };
  }

  function hardGateLabel(key) {
    return ({
      website_reachable: 'Website bereikbaar',
      html_response: 'Bruikbare webpagina ontvangen'
    })[key] || String(key || '').replaceAll('_', ' ');
  }

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om gevonden bedrijven te beoordelen.');
    return session;
  }

  async function rpc(name, args = {}) {
    const { data, error } = await db.rpc(name, args);
    if (error) throw error;
    return data;
  }

  async function loadCandidates() {
    return await rpc('operator_list_discovery_candidates') || [];
  }

  async function siteCheck(url, accessToken) {
    const response = await fetch('/api/site-check', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Websitecontrole mislukt (${response.status}).`);
    return payload;
  }

  function qualificationWithTriage(existing, triage, check) {
    return {
      ...(existing && typeof existing === 'object' ? existing : {}),
      stage: 'triage',
      eligible: null,
      evidence_required: true,
      triage: {
        ...triage,
        site_status: check.status ?? null,
        final_url: check.final_url || null
      },
      note: 'Discovery triage beoordeelt alleen goedkope website-/delivery-signalen. Volledige 0–25 qualification blijft evidence-gated.'
    };
  }

  async function triageCandidate(row, accessToken) {
    if (!row?.id || !row.website_url || inFlight.has(row.id)) return;
    inFlight.add(row.id);
    try {
      let check;
      let triage;
      try {
        check = await siteCheck(row.website_url, accessToken);
        triage = check.triage || {
          version: 'discovery-triage-v1',
          verdict: 'UNASSESSED',
          checked_at: new Date().toISOString(),
          evidence: ['Website-preflight gaf geen triage-resultaat.']
        };
      } catch (error) {
        check = { status: null, final_url: row.website_url, reachable: null };
        triage = {
          version: 'discovery-triage-v1',
          verdict: 'UNASSESSED',
          checked_at: new Date().toISOString(),
          hard_gates: {},
          conversion_opportunity: { score: null, evidence: [] },
          execution_fit: { score: null, evidence: [] },
          unknown_factors: ['customer_economics', 'existing_demand', 'competitive_context'],
          evidence: [`Automatische beoordeling niet beschikbaar: ${error.message || error}`]
        };
      }

      const nextState = check.reachable === false ? 'DISQUALIFIED' : row.state;
      await rpc('operator_set_discovery_triage', {
        p_id: row.id,
        p_qualification: qualificationWithTriage(row.qualification, triage, check),
        p_state: nextState
      });
    } finally {
      inFlight.delete(row.id);
    }
  }

  async function triageMissing(rows) {
    const missing = rows.filter((row) => row.state === 'DISCOVERED' && !row.qualification?.triage && !inFlight.has(row.id));
    if (!missing.length) return false;
    const session = await sessionOrThrow();
    let cursor = 0;
    const workers = Array.from({ length: Math.min(4, missing.length) }, async () => {
      while (cursor < missing.length) {
        const row = missing[cursor++];
        await triageCandidate(row, session.access_token);
      }
    });
    await Promise.all(workers);
    return true;
  }

  function rowByWebsite(container) {
    const map = new Map();
    container.querySelectorAll('.candidate-row').forEach((node) => {
      const href = node.querySelector('a[href]')?.href;
      if (href) map.set(normalizeUrl(href), node);
    });
    return map;
  }

  function scoreChip(label, score) {
    const chip = document.createElement('span');
    chip.className = `triage-score ${scoreClass(score)}`;
    chip.innerHTML = `<span>${label}</span><strong>${hasScore(score) ? `${Number(score)}/5` : '—'}</strong>`;
    return chip;
  }

  function evidenceBlock(title, score, evidence) {
    const section = document.createElement('section');
    section.className = 'triage-assessment-section';
    const heading = document.createElement('div');
    heading.className = 'triage-assessment-heading';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const value = document.createElement('b');
    value.textContent = hasScore(score) ? `${Number(score)}/5` : '—';
    heading.append(strong, value);
    section.appendChild(heading);

    const items = Array.isArray(evidence) ? evidence.filter(Boolean) : [];
    if (items.length) {
      const list = document.createElement('ul');
      for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      }
      section.appendChild(list);
    } else {
      const empty = document.createElement('p');
      empty.textContent = 'Geen extra toelichting beschikbaar.';
      section.appendChild(empty);
    }
    return section;
  }

  function renderAssessment(node, triage) {
    let panel = node.querySelector('.triage-assessment');
    if (!triage) {
      panel?.remove();
      return null;
    }

    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'triage-assessment hidden';
      node.appendChild(panel);
    }
    panel.replaceChildren();

    const intro = document.createElement('div');
    intro.className = 'triage-assessment-intro';
    const title = document.createElement('strong');
    title.textContent = 'Snelle websitebeoordeling';
    const note = document.createElement('span');
    note.textContent = 'Selectiecheck voor Discovery. Het volledige technisch rapport volgt pas nadat het bedrijf aan Prospects is toegevoegd.';
    intro.append(title, note);
    panel.appendChild(intro);

    panel.appendChild(evidenceBlock('Verbeterkans', triage.conversion_opportunity?.score, triage.conversion_opportunity?.evidence));
    panel.appendChild(evidenceBlock('Uitvoerbaarheid', triage.execution_fit?.score, triage.execution_fit?.evidence));

    const gates = document.createElement('section');
    gates.className = 'triage-assessment-section';
    const gateHeading = document.createElement('div');
    gateHeading.className = 'triage-assessment-heading';
    const gateTitle = document.createElement('strong');
    gateTitle.textContent = 'Basischeck';
    gateHeading.appendChild(gateTitle);
    gates.appendChild(gateHeading);
    const gateList = document.createElement('ul');
    const entries = Object.entries(triage.hard_gates || {});
    if (entries.length) {
      for (const [key, value] of entries) {
        const li = document.createElement('li');
        const symbol = value === true ? '✓' : value === false ? '✕' : '·';
        li.textContent = `${symbol} ${hardGateLabel(key)}`;
        gateList.appendChild(li);
      }
    } else {
      const li = document.createElement('li');
      li.textContent = '· Geen basischeck beschikbaar.';
      gateList.appendChild(li);
    }
    gates.appendChild(gateList);
    panel.appendChild(gates);

    const generalEvidence = Array.isArray(triage.evidence) ? triage.evidence.filter(Boolean) : [];
    if (generalEvidence.length) {
      const context = document.createElement('section');
      context.className = 'triage-assessment-section';
      const contextHeading = document.createElement('div');
      contextHeading.className = 'triage-assessment-heading';
      const contextTitle = document.createElement('strong');
      contextTitle.textContent = 'Controle';
      contextHeading.appendChild(contextTitle);
      context.appendChild(contextHeading);
      const list = document.createElement('ul');
      for (const item of generalEvidence) {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      }
      context.appendChild(list);
      panel.appendChild(context);
    }

    return panel;
  }

  function arrangeActions(node, row) {
    const actions = node.querySelector('.compact-actions');
    if (!actions || actions.dataset.arranged === 'true') return;
    actions.dataset.arranged = 'true';

    const website = actions.querySelector('a[href]');
    const stateButton = actions.querySelector('[data-action="reject"], [data-action="reopen"]');
    const deleteButton = actions.querySelector('[data-action="delete"]');
    if (website) website.classList.add('candidate-website');

    let primary = null;
    if (row.state === 'DISCOVERED') {
      primary = document.createElement('button');
      primary.type = 'button';
      primary.className = 'primary promote-prospect';
      primary.dataset.triageAction = 'promote';
      primary.textContent = 'Voeg toe aan Prospects';
      primary.addEventListener('click', async () => {
        primary.disabled = true;
        try {
          const changed = await rpc('operator_promote_discovery_candidate', { p_id: row.id });
          if (!changed) throw new Error('Bedrijf kon niet aan Prospects worden toegevoegd.');
          document.getElementById('refreshDiscoveryBtn')?.click();
          document.getElementById('refreshBtn')?.click();
        } catch (error) {
          window.alert(error.message || String(error));
          primary.disabled = false;
        }
      });
      if (stateButton) stateButton.textContent = 'Afwijzen';
    } else if (stateButton) {
      primary = stateButton;
      primary.className = 'secondary candidate-reopen';
      primary.textContent = 'Opnieuw beoordelen';
    }

    let assessmentButton = null;
    const assessment = node.querySelector('.triage-assessment');
    if (assessment) {
      assessmentButton = document.createElement('button');
      assessmentButton.type = 'button';
      assessmentButton.className = 'secondary candidate-assessment-toggle';
      assessmentButton.textContent = 'Bekijk beoordeling';
      assessmentButton.setAttribute('aria-expanded', 'false');
      assessmentButton.addEventListener('click', () => {
        const opening = assessment.classList.contains('hidden');
        assessment.classList.toggle('hidden', !opening);
        assessmentButton.setAttribute('aria-expanded', String(opening));
        assessmentButton.textContent = opening ? 'Sluit beoordeling' : 'Bekijk beoordeling';
      });
    }

    const menu = document.createElement('details');
    menu.className = 'candidate-more';
    const summary = document.createElement('summary');
    summary.setAttribute('aria-label', 'Meer acties');
    summary.title = 'Meer acties';
    summary.textContent = '•••';
    const panel = document.createElement('div');
    panel.className = 'candidate-more-panel';

    if (row.state === 'DISCOVERED' && stateButton) panel.appendChild(stateButton);
    if (deleteButton) panel.appendChild(deleteButton);
    menu.append(summary, panel);

    actions.replaceChildren();
    if (primary) actions.appendChild(primary);
    if (assessmentButton) actions.appendChild(assessmentButton);
    if (website) actions.appendChild(website);
    if (panel.children.length) actions.appendChild(menu);
  }

  function decorateRow(node, row) {
    const triage = row.qualification?.triage;
    const main = node.querySelector('.candidate-main');
    const meta = main?.querySelector('small');
    if (!main || !meta) return;

    node.classList.add('triage-candidate');
    node.dataset.group = groupKey(row);
    meta.className = 'candidate-source';
    meta.textContent = `${stateLabel(row.state)} · ${row.discovery_source || '—'}`;

    let decision = main.querySelector('.triage-decision');
    if (!decision) {
      decision = document.createElement('div');
      decision.className = 'triage-decision';
      meta.before(decision);
    }
    decision.replaceChildren();

    if (!triage) {
      const verdict = document.createElement('span');
      verdict.className = 'triage-verdict unassessed';
      verdict.textContent = 'BEOORDELING LOOPT';
      decision.appendChild(verdict);
      renderAssessment(node, null);
      arrangeActions(node, row);
      return;
    }

    const verdict = document.createElement('span');
    const verdictCss = row.state === 'DISQUALIFIED' ? 'disqualified' : String(triage.verdict || 'UNASSESSED').toLowerCase();
    verdict.className = `triage-verdict ${verdictCss}`;
    verdict.textContent = row.state === 'DISQUALIFIED' ? 'AFGEWEZEN' : verdictLabel(triage.verdict);

    const opportunity = triage.conversion_opportunity?.score;
    const fit = triage.execution_fit?.score;
    const gates = gateState(triage);
    const gateChip = document.createElement('span');
    gateChip.className = `triage-gates ${gates.css}`;
    gateChip.textContent = `${gates.symbol} ${gates.label}`;

    decision.append(verdict, scoreChip('Verbeterkans', opportunity), scoreChip('Uitvoerbaarheid', fit), gateChip);

    let context = main.querySelector('.triage-context');
    if (triage.verdict === 'UNASSESSED') {
      if (!context) {
        context = document.createElement('small');
        context.className = 'triage-context';
        main.appendChild(context);
      }
      context.textContent = triage.evidence?.[0] || 'Automatische beoordeling niet beschikbaar.';
    } else {
      context?.remove();
    }

    renderAssessment(node, triage);
    arrangeActions(node, row);
  }

  function renderGroups(container, rows) {
    const nodes = rowByWebsite(container);
    if (!nodes.size) return;

    const grouped = new Map(GROUPS.map((group) => [group.key, []]));
    for (const row of rows) {
      const node = nodes.get(normalizeUrl(row.website_url));
      if (!node) continue;
      grouped.get(groupKey(row))?.push({ row, node });
    }

    const fragment = document.createDocumentFragment();
    for (const group of GROUPS) {
      const items = grouped.get(group.key) || [];
      if (!items.length) continue;

      items.sort((a, b) => {
        const opportunityDelta = scoreValue(b.row, 'conversion_opportunity') - scoreValue(a.row, 'conversion_opportunity');
        if (opportunityDelta) return opportunityDelta;
        const fitDelta = scoreValue(b.row, 'execution_fit') - scoreValue(a.row, 'execution_fit');
        if (fitDelta) return fitDelta;
        return String(a.row.name || '').localeCompare(String(b.row.name || ''), 'nl');
      });

      const section = document.createElement('section');
      section.className = `triage-group ${group.key}`;
      const heading = document.createElement('div');
      heading.className = 'triage-group-heading';
      heading.innerHTML = `<div><strong>${group.label}</strong><span>${group.hint}</span></div><b>${items.length}</b>`;
      const list = document.createElement('div');
      list.className = 'triage-group-list';
      for (const item of items) list.appendChild(item.node);
      section.append(heading, list);
      fragment.appendChild(section);
    }

    candidateObserver?.disconnect();
    container.replaceChildren(fragment);
    candidateObserver?.observe(container, { childList: true, subtree: true });
  }

  async function decorateAndTriage() {
    const container = document.getElementById('discoveryCandidates');
    if (!container || container.closest('.hidden')) return;

    let rows;
    try {
      rows = await loadCandidates();
    } catch {
      return;
    }

    const map = rowByWebsite(container);
    for (const row of rows) {
      const node = map.get(normalizeUrl(row.website_url));
      if (node) decorateRow(node, row);
    }
    renderGroups(container, rows);

    try {
      const changed = await triageMissing(rows);
      if (changed) document.getElementById('refreshDiscoveryBtn')?.click();
    } catch (error) {
      console.error('Discovery triage failed', error);
    }
  }

  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => decorateAndTriage().catch(console.error), 80);
  }

  const container = document.getElementById('discoveryCandidates');
  if (container) {
    candidateObserver = new MutationObserver(scheduleDecorate);
    candidateObserver.observe(container, { childList: true, subtree: true });
  }
  document.getElementById('discoveryNav')?.addEventListener('click', scheduleDecorate);
  document.getElementById('refreshDiscoveryBtn')?.addEventListener('click', scheduleDecorate);
  scheduleDecorate();
})();
