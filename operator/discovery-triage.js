(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const inFlight = new Set();
  let decorateTimer = null;

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
    return ({ STRONG: 'STERK', POSSIBLE: 'MOGELIJK', WEAK: 'ZWAK', UNASSESSED: 'NIET BEOORDEELD' })[value] || 'NIET BEOORDEELD';
  }

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om Discovery te beoordelen.');
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
          evidence: [`Automatische triage niet beschikbaar: ${error.message || error}`]
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

  function rowByWebsite() {
    const map = new Map();
    document.querySelectorAll('#discoveryCandidates .candidate-row').forEach((node) => {
      const href = node.querySelector('a[href]')?.href;
      if (href) map.set(normalizeUrl(href), node);
    });
    return map;
  }

  function decorateRow(node, row) {
    const triage = row.qualification?.triage;
    const main = node.querySelector('.candidate-main');
    const meta = main?.querySelector('small');
    if (!main || !meta) return;

    if (!triage) {
      meta.textContent = `${row.state} · ${row.discovery_source || '—'} · beoordeling loopt…`;
      return;
    }

    const opportunity = triage.conversion_opportunity?.score;
    const fit = triage.execution_fit?.score;
    const gateValues = Object.values(triage.hard_gates || {});
    const gates = gateValues.length && gateValues.every(Boolean) ? 'gates PASS' : gateValues.some((value) => value === false) ? 'gates FAIL' : 'gates —';
    meta.textContent = `${row.state} · ${row.discovery_source || '—'} · TRIAGE ${verdictLabel(triage.verdict)} · Opportunity ${Number.isFinite(Number(opportunity)) ? `${opportunity}/5` : '—'} · Fit ${Number.isFinite(Number(fit)) ? `${fit}/5` : '—'} · ${gates}`;

    let context = main.querySelector('.triage-context');
    if (!context) {
      context = document.createElement('small');
      context.className = 'triage-context';
      main.appendChild(context);
    }
    context.textContent = triage.verdict === 'UNASSESSED'
      ? (triage.evidence?.[0] || 'Automatische beoordeling niet beschikbaar.')
      : 'Customer economics, demand en competitive context worden pas verdiept nadat je de kandidaat naar Prospects zet.';

    const actions = node.querySelector('.compact-actions');
    if (!actions || row.state !== 'DISCOVERED' || actions.querySelector('[data-triage-action="promote"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary promote-prospect';
    button.dataset.triageAction = 'promote';
    button.textContent = 'Naar prospects';
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const changed = await rpc('operator_promote_discovery_candidate', { p_id: row.id });
        if (!changed) throw new Error('Kandidaat kon niet naar Prospects worden gezet.');
        document.getElementById('refreshDiscoveryBtn')?.click();
        document.getElementById('refreshBtn')?.click();
      } catch (error) {
        window.alert(error.message || String(error));
        button.disabled = false;
      }
    });
    const stateButton = actions.querySelector('[data-action="reject"], [data-action="reopen"]');
    actions.insertBefore(button, stateButton || actions.querySelector('.danger'));
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

    const map = rowByWebsite();
    for (const row of rows) {
      const node = map.get(normalizeUrl(row.website_url));
      if (node) decorateRow(node, row);
    }

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
  if (container) new MutationObserver(scheduleDecorate).observe(container, { childList: true, subtree: true });
  document.getElementById('discoveryNav')?.addEventListener('click', scheduleDecorate);
  document.getElementById('refreshDiscoveryBtn')?.addEventListener('click', scheduleDecorate);
  scheduleDecorate();
})();
