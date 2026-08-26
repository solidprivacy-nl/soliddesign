(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const DUCKDB_VERSION = '1.33.1-dev57.0';
  const OVERTURE_STAC = 'https://stac.overturemaps.org/catalog.json';
  const OVERTURE_S3 = 's3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*';
  const KEYWORD_ALIASES = Object.freeze({
    elektricien: 'electrician',
    electricien: 'electrician',
    electrician: 'electrician',
    loodgieter: 'plumber',
    plumber: 'plumber',
    tandarts: 'dentist',
    dentist: 'dentist',
    accountant: 'accountant',
    schilder: 'painter',
    painter: 'painter'
  });

  let duckDbPromise = null;

  const el = (id) => document.getElementById(id);
  const prospectsView = el('prospectsView');
  const discoveryView = el('discoveryView');
  const detailPanel = el('detailPanel');

  function setMessage(text, isError = false) {
    const node = el('discoveryMessage');
    if (!node) return;
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(isError));
  }

  function formatDate(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('nl-NL', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) throw new Error('Log opnieuw in om deze actie uit te voeren.');
    return session;
  }

  async function rpc(name, args = {}) {
    const { data, error } = await db.rpc(name, args);
    if (error) throw error;
    return data;
  }

  function showProspects() {
    prospectsView.classList.remove('hidden');
    discoveryView.classList.add('hidden');
    el('prospectsNav').classList.add('active');
    el('discoveryNav').classList.remove('active');
  }

  async function showDiscovery() {
    prospectsView.classList.add('hidden');
    discoveryView.classList.remove('hidden');
    el('prospectsNav').classList.remove('active');
    el('discoveryNav').classList.add('active');
    await refreshDiscovery();
  }

  function showActiveProspects() {
    el('activeProspectPane').classList.remove('hidden');
    el('archiveProspectPane').classList.add('hidden');
    el('activeScopeBtn').classList.add('active');
    el('archiveScopeBtn').classList.remove('active');
  }

  async function showArchive() {
    el('activeProspectPane').classList.add('hidden');
    el('archiveProspectPane').classList.remove('hidden');
    el('activeScopeBtn').classList.remove('active');
    el('archiveScopeBtn').classList.add('active');
    detailPanel.className = 'detail-panel empty-state';
    detailPanel.innerHTML = '<div><h2>Archief</h2><p class="muted">Herstel een prospect om hem opnieuw in de actieve werkvoorraad te zetten.</p></div>';
    await loadArchive();
  }

  async function loadArchive() {
    const list = el('archiveProspectList');
    list.innerHTML = '<div class="list-empty">Archief laden…</div>';
    try {
      const rows = await rpc('operator_list_archived_prospects') || [];
      if (!rows.length) {
        list.innerHTML = '<div class="list-empty">Het archief is leeg.</div>';
        return;
      }
      list.replaceChildren(...rows.map(buildArchiveRow));
    } catch (error) {
      list.innerHTML = `<div class="list-empty error-text">${escapeHtml(error.message || String(error))}</div>`;
    }
  }

  function buildArchiveRow(row) {
    const wrap = document.createElement('div');
    wrap.className = 'archive-row';
    wrap.innerHTML = `
      <div class="archive-main">
        <strong>${escapeHtml(row.name)}</strong>
        <span>${escapeHtml(row.city || '')}</span>
        <small>${escapeHtml(row.state || '')} · gearchiveerd ${escapeHtml(formatDate(row.archived_at))}</small>
      </div>
      <div class="compact-actions">
        <a href="${escapeHtml(row.website_url)}" target="_blank" rel="noopener">Website ↗</a>
        <button type="button" class="secondary" data-action="restore">Herstel</button>
        <button type="button" class="danger" data-action="delete">Verwijder</button>
      </div>`;
    wrap.querySelector('[data-action="restore"]').addEventListener('click', async () => {
      await runButtonAction(wrap.querySelector('[data-action="restore"]'), async () => {
        const changed = await rpc('operator_restore_prospect', { p_id: row.id });
        if (!changed) throw new Error('Prospect kon niet worden hersteld.');
        await loadArchive();
        el('refreshBtn')?.click();
      });
    });
    wrap.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!window.confirm(`Verwijder ${row.name} definitief? Dit kan alleen zonder demo- of mailinghistorie.`)) return;
      await runButtonAction(wrap.querySelector('[data-action="delete"]'), async () => {
        const changed = await rpc('operator_delete_prospect', { p_id: row.id });
        if (!changed) throw new Error('Niet verwijderd. Archiveer records met demo- of mailinghistorie; hard delete is alleen voor administratieve correcties.');
        await loadArchive();
      });
    });
    return wrap;
  }

  async function runButtonAction(button, fn) {
    button.disabled = true;
    try {
      await fn();
    } catch (error) {
      window.alert(error.message || String(error));
    } finally {
      button.disabled = false;
    }
  }

  async function resolveActiveProspectFromDetail(root) {
    const name = root.querySelector('[data-field="name"]')?.textContent?.trim();
    const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim();
    if (!name || !website || website === '—') throw new Error('Prospect kon niet worden bepaald.');
    const { data, error } = await db.from('prospects')
      .select('id,name,website_url')
      .eq('name', name)
      .eq('website_url', website)
      .limit(2);
    if (error) throw error;
    if (!data || data.length !== 1) throw new Error('Prospect kon niet eenduidig worden bepaald.');
    return data[0];
  }

  function bindArchiveAction() {
    const root = detailPanel.querySelector('.detail-content');
    if (!root || root.dataset.archiveBound === 'true') return;
    const button = root.querySelector('[data-ops-action="archive"]');
    if (!button) return;
    root.dataset.archiveBound = 'true';
    button.addEventListener('click', async () => {
      if (!window.confirm('Archiveer deze prospect? De data blijft bewaard en kan later worden hersteld.')) return;
      button.disabled = true;
      try {
        const prospect = await resolveActiveProspectFromDetail(root);
        const changed = await rpc('operator_archive_prospect', { p_id: prospect.id });
        if (!changed) throw new Error('Prospect kon niet worden gearchiveerd.');
        detailPanel.className = 'detail-panel empty-state';
        detailPanel.innerHTML = '<div><h2>Prospect gearchiveerd</h2><p class="muted">De prospect staat niet meer in de actieve werkvoorraad.</p></div>';
        el('refreshBtn')?.click();
      } catch (error) {
        window.alert(error.message || String(error));
        button.disabled = false;
      }
    });
  }

  async function refreshDiscovery() {
    try {
      await sessionOrThrow();
      await Promise.all([loadRuns(), loadCandidates()]);
    } catch (error) {
      setMessage(error.message || String(error), true);
    }
  }

  async function loadRuns() {
    const list = el('discoveryRuns');
    const { data, error } = await db.from('discovery_runs')
      .select('id,run_type,input,status,found_count,new_count,qualified_count,disqualified_count,result,error,started_at,completed_at,created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    if (!data?.length) {
      list.innerHTML = '<div class="list-empty">Nog geen discovery-runs.</div>';
      return;
    }
    list.innerHTML = data.map((run) => {
      const input = run.run_type === 'AREA'
        ? `${run.input?.location || '—'} · ${(run.input?.keywords || []).join(', ')}`
        : run.input?.url || '—';
      const counts = run.status === 'COMPLETED'
        ? `${run.found_count} gevonden · ${run.new_count} nieuw`
        : run.status;
      return `<div class="run-row">
        <div>
          <strong>${escapeHtml(input)}</strong>
          <span>${escapeHtml(run.run_type)} · ${escapeHtml(formatDate(run.created_at))}</span>
          ${run.error ? `<small class="error-text">${escapeHtml(run.error)}</small>` : ''}
        </div>
        <span class="run-status ${escapeHtml(run.status.toLowerCase())}">${escapeHtml(counts)}</span>
      </div>`;
    }).join('');
  }

  async function loadCandidates() {
    const list = el('discoveryCandidates');
    const rows = await rpc('operator_list_discovery_candidates') || [];
    if (!rows.length) {
      list.innerHTML = '<div class="list-empty">Geen kandidaten in de Discovery-inbox.</div>';
      return;
    }
    list.replaceChildren(...rows.map(buildCandidateRow));
  }

  function buildCandidateRow(row) {
    const wrap = document.createElement('div');
    wrap.className = 'candidate-row';
    const score = Number.isFinite(Number(row.qualification?.total_score))
      ? `${Number(row.qualification.total_score)}/25`
      : 'nog niet gescoord';
    wrap.innerHTML = `
      <div class="candidate-main">
        <div><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.city || row.category || '')}</span></div>
        <small>${escapeHtml(row.state)} · ${escapeHtml(row.discovery_source || '—')} · ${escapeHtml(score)}</small>
      </div>
      <div class="compact-actions">
        <a href="${escapeHtml(row.website_url)}" target="_blank" rel="noopener">Website ↗</a>
        ${row.state === 'DISCOVERED'
          ? '<button type="button" class="secondary" data-action="reject">Diskwalificeer</button>'
          : '<button type="button" class="secondary" data-action="reopen">Heropen</button>'}
        <button type="button" class="danger" data-action="delete">Verwijder</button>
      </div>`;
    const stateButton = wrap.querySelector('[data-action="reject"], [data-action="reopen"]');
    stateButton.addEventListener('click', async () => {
      const next = row.state === 'DISCOVERED' ? 'DISQUALIFIED' : 'DISCOVERED';
      await runButtonAction(stateButton, async () => {
        const changed = await rpc('operator_set_discovery_state', { p_id: row.id, p_state: next });
        if (!changed) throw new Error('Discovery-status kon niet worden gewijzigd.');
        await loadCandidates();
      });
    });
    wrap.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!window.confirm(`Verwijder ${row.name} definitief uit Discovery?`)) return;
      await runButtonAction(wrap.querySelector('[data-action="delete"]'), async () => {
        const changed = await rpc('operator_delete_prospect', { p_id: row.id });
        if (!changed) throw new Error('Kandidaat kon niet worden verwijderd.');
        await loadCandidates();
      });
    });
    return wrap;
  }

  async function createRun(runType, input) {
    const session = await sessionOrThrow();
    const now = new Date().toISOString();
    const { data, error } = await db.from('discovery_runs').insert({
      run_type: runType,
      input,
      status: 'RUNNING',
      created_by: session.user.email || session.user.id,
      started_at: now
    }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async function finishRun(runId, patch) {
    const { error } = await db.from('discovery_runs')
      .update({ ...patch, completed_at: new Date().toISOString() })
      .eq('id', runId);
    if (error) throw error;
  }

  async function failRun(runId, error) {
    try {
      await finishRun(runId, {
        status: 'FAILED',
        error: String(error?.message || error).slice(0, 1200)
      });
    } catch (updateError) {
      console.error(updateError);
    }
  }

  function normalizeKeyword(value) {
    const key = value.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 _-]/g, '')
      .replace(/[\s-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return KEYWORD_ALIASES[key] || key;
  }

  function parseKeywords(value) {
    const items = value.split(',').map(normalizeKeyword).filter(Boolean);
    return [...new Set(items)].slice(0, 12);
  }

  function sqlLiteral(value) {
    return `'${String(value).replaceAll("'", "''")}'`;
  }

  async function geocode(location) {
    const session = await sessionOrThrow();
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(location)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Locatie kon niet worden gevonden (${response.status}).`);
    return payload;
  }

  async function latestOvertureRelease() {
    const response = await fetch(OVERTURE_STAC, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Overture releasecatalogus niet bereikbaar (${response.status}).`);
    const payload = await response.json();
    if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(payload.latest || '')) {
      throw new Error('Overture releasecatalogus bevat geen geldige latest release.');
    }
    return payload.latest;
  }

  async function getDuckDb() {
    if (!duckDbPromise) {
      duckDbPromise = (async () => {
        const duckdb = await import(`https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/+esm`);
        const bundles = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(bundles);
        const workerUrl = URL.createObjectURL(new Blob([
          `importScripts("${bundle.mainWorker}");`
        ], { type: 'text/javascript' }));
        const worker = new Worker(workerUrl);
        const logger = new duckdb.ConsoleLogger();
        const database = new duckdb.AsyncDuckDB(logger, worker);
        try {
          await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
        } finally {
          URL.revokeObjectURL(workerUrl);
        }
        return database;
      })().catch((error) => {
        duckDbPromise = null;
        throw error;
      });
    }
    return duckDbPromise;
  }

  async function searchOverture(bbox, keywords, limit, release) {
    const database = await getDuckDb();
    const conn = await database.connect();
    try {
      await conn.query(`LOAD httpfs; SET s3_region='us-west-2';`);
      const filters = keywords.map((keyword) => {
        const q = sqlLiteral(keyword);
        return `(lower(coalesce(basic_category,'')) = ${q}
          OR lower(coalesce(taxonomy.primary,'')) = ${q}
          OR list_contains(taxonomy.hierarchy, ${q})
          OR list_contains(taxonomy.alternates, ${q}))`;
      }).join(' OR ');
      const path = OVERTURE_S3.replace('{release}', release);
      const sql = `
        SELECT
          id,
          names.primary AS name,
          coalesce(basic_category, taxonomy.primary, 'local_business') AS category,
          CASE WHEN websites IS NOT NULL AND length(websites) > 0 THEN websites[1] END AS website,
          CASE WHEN phones IS NOT NULL AND length(phones) > 0 THEN phones[1] END AS phone,
          CASE WHEN addresses IS NOT NULL AND length(addresses) > 0 THEN addresses[1].freeform END AS address,
          CASE WHEN addresses IS NOT NULL AND length(addresses) > 0 THEN addresses[1].locality END AS city,
          confidence,
          operating_status
        FROM read_parquet(${sqlLiteral(path)}, hive_partitioning=1)
        WHERE bbox.xmin BETWEEN ${Number(bbox.west)} AND ${Number(bbox.east)}
          AND bbox.ymin BETWEEN ${Number(bbox.south)} AND ${Number(bbox.north)}
          AND names.primary IS NOT NULL
          AND websites IS NOT NULL
          AND length(websites) > 0
          AND (operating_status IS NULL OR operating_status <> 'permanently_closed')
          ${filters ? `AND (${filters})` : ''}
        LIMIT ${Math.min(Math.max(Number(limit) || 25, 1), 50)}
      `;
      const table = await conn.query(sql);
      return table.toArray().map((row) => row.toJSON());
    } finally {
      await conn.close();
    }
  }

  function normalizeWebsite(value) {
    if (!value) return null;
    const text = String(value).trim();
    if (!text) return null;
    try {
      return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`).toString();
    } catch {
      return null;
    }
  }

  function overtureCandidates(rows, release) {
    return rows.map((row) => ({
      external_id: row.id ? `overture:${row.id}` : null,
      name: row.name || null,
      category: String(row.category || '').replaceAll('_', ' ') || null,
      city: row.city || null,
      address: row.address || null,
      website_url: normalizeWebsite(row.website),
      phone: row.phone || null,
      place_id: row.id || null,
      discovery_source: 'overture',
      discovery_version: release,
      source_confidence: row.confidence == null ? null : Number(row.confidence),
      operating_status: row.operating_status || null,
      state: 'DISCOVERED',
      qualification: {
        stage: 'discovery',
        eligible: null,
        evidence_required: true,
        note: 'Overture presence is discovery evidence, not sufficient commercial qualification.'
      }
    })).filter((row) => row.website_url);
  }

  async function runAreaDiscovery() {
    const button = el('runAreaDiscovery');
    const location = el('discoveryLocation').value.trim();
    const keywords = parseKeywords(el('discoveryKeywords').value);
    const limit = Number(el('discoveryLimit').value || 25);
    if (!location) return setMessage('Vul een locatie in.', true);
    if (!keywords.length) return setMessage('Vul minimaal één keyword in.', true);

    button.disabled = true;
    setMessage('Discovery-run starten…');
    let runId = null;
    try {
      runId = await createRun('AREA', { location, keywords, limit });
      setMessage('Locatie bepalen…');
      const bbox = await geocode(location);
      setMessage('Overture-release bepalen…');
      const release = await latestOvertureRelease();
      setMessage('Overture doorzoeken in de browser…');
      const rows = await searchOverture(bbox, keywords, limit, release);
      const candidates = overtureCandidates(rows, release);
      const ingest = await rpc('operator_ingest_discovery_candidates', {
        p_run_id: runId,
        p_candidates: candidates
      });
      await finishRun(runId, {
        status: 'COMPLETED',
        found_count: ingest.found_count || 0,
        new_count: ingest.new_count || 0,
        qualified_count: 0,
        disqualified_count: 0,
        result: {
          bbox: { west: bbox.west, south: bbox.south, east: bbox.east, north: bbox.north },
          geocoded_location: bbox.display_name,
          release,
          keywords,
          existing_count: ingest.existing_count || 0
        },
        error: null
      });
      setMessage(`${ingest.found_count || 0} gevonden · ${ingest.new_count || 0} nieuw. Nieuwe kandidaten staan in de Discovery-inbox.`);
      await refreshDiscovery();
    } catch (error) {
      if (runId) await failRun(runId, error);
      setMessage(error.message || String(error), true);
      await loadRuns().catch(console.error);
    } finally {
      button.disabled = false;
    }
  }

  async function siteCheck(value) {
    const session = await sessionOrThrow();
    const response = await fetch('/api/site-check', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: value })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Websitecontrole mislukt (${response.status}).`);
    return payload;
  }

  async function runUrlDiscovery() {
    const button = el('runUrlDiscovery');
    const value = el('discoveryUrl').value.trim();
    if (!value) return setMessage('Vul een website-URL in.', true);

    button.disabled = true;
    setMessage('Website onderzoeken…');
    let runId = null;
    try {
      runId = await createRun('URL', { url: value });
      const check = await siteCheck(value);
      const state = check.reachable ? 'DISCOVERED' : 'DISQUALIFIED';
      const qualification = check.reachable
        ? {
            stage: 'preflight',
            eligible: null,
            evidence_required: true,
            hard_gates: { website_reachable: true },
            evidence: [`HTTP ${check.status} op ${check.final_url}`]
          }
        : {
            stage: 'preflight',
            eligible: false,
            total_score: null,
            hard_gates: { website_reachable: false },
            evidence: [check.error || `Website niet bereikbaar (${check.status || 'fetch failure'}).`]
          };
      const candidate = {
        external_id: `url:${check.website_key}`,
        name: check.title || check.website_key,
        category: null,
        city: null,
        address: null,
        website_url: check.final_url || check.input_url,
        phone: null,
        place_id: null,
        discovery_source: 'manual_url',
        discovery_version: 'url-preflight-v1',
        source_confidence: null,
        operating_status: check.reachable ? 'reachable' : 'unreachable',
        state,
        qualification
      };
      const ingest = await rpc('operator_ingest_discovery_candidates', {
        p_run_id: runId,
        p_candidates: [candidate]
      });
      await finishRun(runId, {
        status: 'COMPLETED',
        found_count: 1,
        new_count: ingest.new_count || 0,
        qualified_count: 0,
        disqualified_count: state === 'DISQUALIFIED' && ingest.new_count ? 1 : 0,
        result: { site_check: check, existing_count: ingest.existing_count || 0 },
        error: null
      });
      const verdict = state === 'DISQUALIFIED' ? 'objectief gediskwalificeerd op bereikbaarheid' : 'toegevoegd als DISCOVERED voor verdere evidence-gated kwalificatie';
      setMessage(ingest.new_count ? `Website ${verdict}.` : 'Dit domein bestond al; er is geen duplicaat aangemaakt.');
      await refreshDiscovery();
    } catch (error) {
      if (runId) await failRun(runId, error);
      setMessage(error.message || String(error), true);
      await loadRuns().catch(console.error);
    } finally {
      button.disabled = false;
    }
  }

  el('prospectsNav')?.addEventListener('click', showProspects);
  el('discoveryNav')?.addEventListener('click', () => showDiscovery().catch((error) => setMessage(error.message, true)));
  el('activeScopeBtn')?.addEventListener('click', showActiveProspects);
  el('archiveScopeBtn')?.addEventListener('click', () => showArchive().catch((error) => window.alert(error.message || String(error))));
  el('refreshDiscoveryBtn')?.addEventListener('click', () => refreshDiscovery());
  el('runAreaDiscovery')?.addEventListener('click', runAreaDiscovery);
  el('runUrlDiscovery')?.addEventListener('click', runUrlDiscovery);

  const detailObserver = new MutationObserver(bindArchiveAction);
  detailObserver.observe(detailPanel, { childList: true, subtree: true });
  bindArchiveAction();
})();
