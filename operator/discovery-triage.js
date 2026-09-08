(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const inFlight = new Set();
  const GROUPS = Object.freeze([
    { key: 'recommended', label: 'KANSRIJK', hint: 'Beste kandidaten om eerst te bekijken.', collapsed: false },
    { key: 'review', label: 'NOG BEOORDELEN', hint: 'Meer verificatie of menselijke beoordeling nodig.', collapsed: false },
    { key: 'low', label: 'LAGE PRIORITEIT', hint: 'Minder sterke redesignkans.', collapsed: true },
    { key: 'disqualified', label: 'AFGEWEZEN', hint: 'Niet door de basiscontrole gekomen.', collapsed: true }
  ]);
  const PRIORITY = Object.freeze({ VERY_HIGH: 4, HIGH: 3, MEDIUM: 2, LOW: 1 });

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

  function hasScore(value) {
    return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  }

  function hardGateFailed(row) {
    return Object.values(row.qualification?.triage?.hard_gates || {}).some((value) => value === false);
  }

  function groupKey(row) {
    if (row.state === 'DISQUALIFIED' || hardGateFailed(row)) return 'disqualified';
    const research = row.qualification?.research;
    if (research?.decision === 'DEEP_AUDIT') return 'recommended';
    if (research?.decision === 'VERIFY_FIRST') return 'review';
    if (research?.decision === 'LOWER_PRIORITY' || research?.decision === 'REJECT') return 'low';
    const verdict = row.qualification?.triage?.verdict;
    if (verdict === 'STRONG') return 'recommended';
    if (verdict === 'WEAK') return 'low';
    return 'review';
  }

  function researchPriority(row) {
    return PRIORITY[String(row.qualification?.research?.priority || '').toUpperCase()] || 0;
  }

  function researchRank(row) {
    const value = Number(row.qualification?.research?.rank);
    return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
  }

  function scoreValue(row, key) {
    const value = row.qualification?.triage?.[key]?.score;
    return hasScore(value) ? Number(value) : -1;
  }

  function compareRows(a, b) {
    const researchDelta = researchPriority(b) - researchPriority(a);
    if (researchDelta) return researchDelta;
    const rankDelta = researchRank(a) - researchRank(b);
    if (rankDelta) return rankDelta;
    const opportunityDelta = scoreValue(b, 'conversion_opportunity') - scoreValue(a, 'conversion_opportunity');
    if (opportunityDelta) return opportunityDelta;
    const fitDelta = scoreValue(b, 'execution_fit') - scoreValue(a, 'execution_fit');
    if (fitDelta) return fitDelta;
    return String(a.name || '').localeCompare(String(b.name || ''), 'nl');
  }

  function hardGateLabel(key) {
    return ({ website_reachable: 'Website bereikbaar', html_response: 'Bruikbare webpagina ontvangen' })[key]
      || String(key || '').replaceAll('_', ' ');
  }

  function failedGateSummary(row) {
    const failed = Object.entries(row.qualification?.triage?.hard_gates || {}).find(([, value]) => value === false);
    if (!failed) return 'Basischeck niet gehaald.';
    if (failed[0] === 'website_reachable') return 'Website niet bereikbaar.';
    if (failed[0] === 'html_response') return 'Geen bruikbare webpagina ontvangen.';
    return `${hardGateLabel(failed[0])} niet gehaald.`;
  }

  function candidateSummary(row) {
    if (row.state === 'DISQUALIFIED' || hardGateFailed(row)) return failedGateSummary(row);
    const research = row.qualification?.research;
    if (research?.decision === 'DEEP_AUDIT') return 'Onderzoek wijst op een duidelijke redesignkans.';
    if (research?.decision === 'VERIFY_FIRST') return 'Interessant, maar eerst extra verificatie nodig.';
    if (research?.decision === 'LOWER_PRIORITY') return 'Minder sterke redesignkans.';
    if (research?.decision === 'REJECT') return 'Onderzoek geeft onvoldoende aanleiding.';

    const triage = row.qualification?.triage;
    if (!triage) return 'Beoordeling loopt…';
    const opportunity = scoreValue(row, 'conversion_opportunity');
    const fit = scoreValue(row, 'execution_fit');
    if (triage.verdict === 'STRONG' && opportunity >= 4 && fit >= 4) return 'Sterke verbeterkans · eenvoudig uitvoerbaar.';
    if (triage.verdict === 'STRONG') return 'Sterke verbeterkans.';
    if (triage.verdict === 'WEAK') return 'Weinig zichtbare verbeterkans.';
    return 'Mogelijke verbeterkans · bekijk waarom.';
  }

  function statusChip(row) {
    const key = groupKey(row);
    const labels = { recommended: 'KANSRIJK', review: 'NOG BEOORDELEN', low: 'LAGE PRIORITEIT', disqualified: 'AFGEWEZEN' };
    const css = { recommended: 'strong', review: 'possible', low: 'weak', disqualified: 'disqualified' };
    return chip(`triage-verdict ${css[key]}`, labels[key]);
  }

  function sourceLabel(value) {
    return ({ research: 'Gericht onderzoek', overture: 'Breed zoeken', manual_url: 'Bekend bedrijf' })[value] || 'Discovery';
  }

  function setDiscoveryMessage(text, isError = false) {
    const node = document.getElementById('discoveryMessage');
    if (!node) return;
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(isError));
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
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Websitecontrole mislukt (${response.status}).`);
    return payload;
  }

  async function prepareProspect(prospectId, accessToken) {
    const response = await fetch('/api/prepare-prospect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospect_id: prospectId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Voorbereiding kon niet worden gestart (${response.status}).`);
    return payload;
  }

  function qualificationWithTriage(existing, triage, check) {
    return {
      ...(existing && typeof existing === 'object' ? existing : {}),
      stage: 'triage',
      eligible: null,
      evidence_required: true,
      triage: { ...triage, site_status: check.status ?? null, final_url: check.final_url || null },
      note: 'Discovery triage beoordeelt alleen goedkope website-/delivery-signalen. Research-evidence en volledige 0–25 qualification blijven afzonderlijk bewaard.'
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
          version: 'discovery-triage-v1', verdict: 'UNASSESSED', checked_at: new Date().toISOString(),
          evidence: ['Website-preflight gaf geen triage-resultaat.']
        };
      } catch (error) {
        check = { status: null, final_url: row.website_url, reachable: null };
        triage = {
          version: 'discovery-triage-v1', verdict: 'UNASSESSED', checked_at: new Date().toISOString(), hard_gates: {},
          conversion_opportunity: { score: null, evidence: [] }, execution_fit: { score: null, evidence: [] },
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
      while (cursor < missing.length) await triageCandidate(missing[cursor++], session.access_token);
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

  function chip(className, text) {
    const node = document.createElement('span');
    node.className = className;
    node.textContent = text;
    return node;
  }

  function evidenceList(title, value) {
    const section = document.createElement('section');
    section.className = 'triage-assessment-section';
    const heading = document.createElement('div');
    heading.className = 'triage-assessment-heading';
    const strong = document.createElement('strong');
    strong.textContent = title;
    heading.appendChild(strong);
    section.appendChild(heading);
    const items = Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Geen extra toelichting beschikbaar.';
      section.appendChild(empty);
      return section;
    }
    const list = document.createElement('ul');
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = String(item);
      list.appendChild(li);
    }
    section.appendChild(list);
    return section;
  }

  function renderAssessment(node, row) {
    const triage = row.qualification?.triage;
    const research = row.qualification?.research;
    let panel = node.querySelector('.triage-assessment');
    if (!triage && !research) {
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
    title.textContent = 'Waarom deze kandidaat?';
    const note = document.createElement('span');
    note.textContent = `Bron: ${sourceLabel(row.discovery_source)}`;
    intro.append(title, note);
    panel.appendChild(intro);

    if (research) {
      panel.appendChild(evidenceList('Commerciële signalen', research.commercial_signals));
      panel.appendChild(evidenceList('Website-observaties', research.website_observations));
      panel.appendChild(evidenceList('Redesignhypothese', research.redesign_hypothesis));
      panel.appendChild(evidenceList('Nog te verifiëren', research.verification_needed));
      if (Array.isArray(research.source_urls) && research.source_urls.length) panel.appendChild(evidenceList('Bronnen', research.source_urls));
    }

    if (triage) {
      const scoreSection = (titleText, score, evidence) => {
        const section = evidenceList(titleText, evidence);
        const heading = section.querySelector('.triage-assessment-heading');
        const value = document.createElement('b');
        value.textContent = hasScore(score) ? `${Number(score)}/5` : '—';
        heading?.appendChild(value);
        return section;
      };
      panel.appendChild(scoreSection('Verbeterkans', triage.conversion_opportunity?.score, triage.conversion_opportunity?.evidence));
      panel.appendChild(scoreSection('Uitvoerbaarheid', triage.execution_fit?.score, triage.execution_fit?.evidence));
      const gates = Object.entries(triage.hard_gates || {}).map(([key, value]) => `${value === true ? '✓' : value === false ? '✕' : '·'} ${hardGateLabel(key)}`);
      panel.appendChild(evidenceList('Basischeck', gates));
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
      primary.textContent = 'Toevoegen';
      primary.addEventListener('click', async () => {
        primary.disabled = true;
        try {
          const session = await sessionOrThrow();
          const changed = await rpc('operator_promote_discovery_candidate', { p_id: row.id });
          if (!changed) throw new Error('Bedrijf kon niet aan Prospects worden toegevoegd.');
          try {
            await prepareProspect(row.id, session.access_token);
            setDiscoveryMessage(`✓ ${row.name} is toegevoegd aan Prospects.`);
          } catch (prepareError) {
            console.error('Automatic prospect preparation failed to start', prepareError);
            setDiscoveryMessage(`${row.name} is toegevoegd, maar de automatische voorbereiding kon niet starten. Start die vanuit Prospects opnieuw.`, true);
          }
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

    const assessment = node.querySelector('.triage-assessment');
    let assessmentButton = null;
    if (assessment) {
      assessmentButton = document.createElement('button');
      assessmentButton.type = 'button';
      assessmentButton.className = 'secondary candidate-assessment-toggle';
      assessmentButton.textContent = 'Waarom?';
      assessmentButton.setAttribute('aria-expanded', 'false');
      assessmentButton.addEventListener('click', () => {
        const opening = assessment.classList.contains('hidden');
        assessment.classList.toggle('hidden', !opening);
        assessmentButton.setAttribute('aria-expanded', String(opening));
        assessmentButton.textContent = opening ? 'Sluit' : 'Waarom?';
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
    const main = node.querySelector('.candidate-main');
    const meta = main?.querySelector('small');
    if (!main) return;

    node.classList.add('triage-candidate');
    node.dataset.group = groupKey(row);
    meta?.remove();

    let decision = main.querySelector('.triage-decision');
    if (!decision) {
      decision = document.createElement('div');
      decision.className = 'triage-decision';
      main.appendChild(decision);
    }
    decision.replaceChildren();
    decision.appendChild(statusChip(row));
    const summary = document.createElement('span');
    summary.className = 'candidate-summary';
    summary.textContent = candidateSummary(row);
    decision.appendChild(summary);

    renderAssessment(node, row);
    arrangeActions(node, row);
  }

  function renderGroups(container, rows) {
    const nodes = rowByWebsite(container);
    if (!nodes.size) return;
    const grouped = new Map(GROUPS.map((group) => [group.key, []]));
    for (const row of rows) {
      const node = nodes.get(normalizeUrl(row.website_url));
      if (node) grouped.get(groupKey(row))?.push({ row, node });
    }

    const fragment = document.createDocumentFragment();
    for (const group of GROUPS) {
      const items = grouped.get(group.key) || [];
      if (!items.length) continue;
      items.sort((a, b) => compareRows(a.row, b.row));
      const section = document.createElement(group.collapsed ? 'details' : 'section');
      section.className = `triage-group ${group.key}${group.collapsed ? ' collapsible' : ''}`;
      const heading = document.createElement(group.collapsed ? 'summary' : 'div');
      heading.className = 'triage-group-heading';
      const left = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = group.label;
      const hint = document.createElement('span');
      hint.textContent = group.hint;
      left.append(strong, hint);
      const count = document.createElement('b');
      count.textContent = String(items.length);
      heading.append(left, count);
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