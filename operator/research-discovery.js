(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  const prompts = window.SOLIDDESIGN_PROMPTS;
  if (!CONFIG?.supabaseUrl || !window.supabase || !prompts) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const CONTRACT_URL = '/prompts/contracts/prospect-research-import-v1.json';
  const RESEARCH_METHOD_VERSION = '2026-09-08';
  let papaPromise = null;
  let contractPromise = null;

  const panel = document.querySelector('[data-discovery-panel="research"]');
  if (!panel) return;

  panel.innerHTML = `
    <div class="discovery-mode-intro">
      <h2>Gericht zoeken</h2>
      <p>Vind kansrijke bedrijven met uitgebreider onderzoek.</p>
    </div>
    <div class="discovery-form discovery-form-simple">
      <label>Sector
        <input id="researchDiscoverySector" type="text" maxlength="120" placeholder="Bijv. loodgieter" />
      </label>
      <label>Plaats
        <input id="researchDiscoveryLocation" type="text" maxlength="120" placeholder="Bijv. Rotterdam" />
      </label>
    </div>
    <details class="discovery-extra">
      <summary>+ Extra instructie</summary>
      <label>
        <textarea id="researchDiscoveryDirection" rows="3" maxlength="1500" placeholder="Bijv. focus op lokale B2B-bedrijven."></textarea>
      </label>
    </details>
    <div class="research-step">
      <div><strong>1. Kopieer opdracht</strong><span>Plak de opdracht in ChatGPT.</span></div>
      <button id="copyProspectResearch" type="button" class="primary">Kopieer onderzoeksopdracht</button>
    </div>
    <div class="research-step research-import-step">
      <div><strong>2. Importeer resultaat</strong><span>Download het CSV-bestand uit ChatGPT en kies het hier.</span></div>
      <label class="research-file">CSV-resultaat
        <input id="researchDiscoveryFile" type="file" accept=".csv,text/csv" />
      </label>
      <button id="importProspectResearch" type="button" class="secondary">Importeer resultaat</button>
    </div>`;

  const sectorInput = document.getElementById('researchDiscoverySector');
  const locationInput = document.getElementById('researchDiscoveryLocation');
  const directionInput = document.getElementById('researchDiscoveryDirection');
  const fileInput = document.getElementById('researchDiscoveryFile');
  const copyButton = document.getElementById('copyProspectResearch');
  const importButton = document.getElementById('importProspectResearch');

  function setMessage(text, isError = false) {
    const node = document.getElementById('discoveryMessage');
    if (!node) return;
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(isError));
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

  async function resolveSector() {
    const humanTerm = sectorInput.value.trim();
    if (!humanTerm) throw new Error('Vul eerst een sector in.');
    const resolver = window.SOLIDDESIGN_RESOLVE_SINGLE_SECTOR;
    if (typeof resolver !== 'function') throw new Error('De sectorresolver is nog niet beschikbaar. Vernieuw de pagina en probeer opnieuw.');
    return await resolver(humanTerm);
  }

  async function researchContext() {
    const location = locationInput.value.trim();
    if (!location) throw new Error('Vul eerst een plaats in.');
    const sector = await resolveSector();
    return { ...sector, location, direction: directionInput.value.trim() };
  }

  copyButton.addEventListener('click', async () => {
    copyButton.disabled = true;
    try {
      const context = await researchContext();
      await prompts.copy('prospect-research', {
        sector: context.humanTerm,
        location: context.location,
        additional_direction: context.direction
      });
      setMessage('✓ Onderzoeksopdracht gekopieerd. Plak hem in ChatGPT en download daarna het CSV-resultaat.');
    } catch (error) {
      setMessage(error.message || String(error), true);
    } finally {
      copyButton.disabled = false;
    }
  });

  function loadPapa() {
    if (!papaPromise) {
      papaPromise = import('https://cdn.jsdelivr.net/npm/papaparse@5.7.0/+esm')
        .then((module) => module.default || module)
        .catch((error) => {
          papaPromise = null;
          throw error;
        });
    }
    return papaPromise;
  }

  function loadContract() {
    if (!contractPromise) {
      contractPromise = fetch(CONTRACT_URL, { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Research-importcontract kon niet worden geladen (${response.status}).`);
          return await response.json();
        })
        .catch((error) => {
          contractPromise = null;
          throw error;
        });
    }
    return contractPromise;
  }

  function parseBoolean(value, field, rowNumber) {
    const text = String(value ?? '').trim().toLowerCase();
    if (text === 'true') return true;
    if (text === 'false') return false;
    throw new Error(`Rij ${rowNumber}: ${field} moet true of false zijn.`);
  }

  function normalizeWebsite(value, rowNumber) {
    const text = String(value || '').trim();
    try {
      const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      return url.toString();
    } catch {
      throw new Error(`Rij ${rowNumber}: website bevat geen geldige http(s)-URL.`);
    }
  }

  function requiredText(row, key, max, rowNumber) {
    const value = String(row?.[key] ?? '').trim();
    if (!value) throw new Error(`Rij ${rowNumber}: ${key} ontbreekt.`);
    if (value.length > max) throw new Error(`Rij ${rowNumber}: ${key} is te lang.`);
    return value;
  }

  function optionalText(row, key, max, rowNumber) {
    const value = String(row?.[key] ?? '').trim();
    if (value.length > max) throw new Error(`Rij ${rowNumber}: ${key} is te lang.`);
    return value;
  }

  function validateRows(parsed, contract) {
    const fields = Array.isArray(parsed?.meta?.fields) ? parsed.meta.fields.map((field) => String(field || '').replace(/^\uFEFF/, '').trim()) : [];
    const expected = contract.columns || [];
    if (fields.length !== expected.length || fields.some((field, index) => field !== expected[index])) {
      throw new Error(`CSV-kolommen wijken af van ${contract.contract}. Gebruik exact het resultaatcontract uit de onderzoeksprompt.`);
    }
    if (parsed.errors?.length) {
      const first = parsed.errors[0];
      throw new Error(`CSV kon niet betrouwbaar worden gelezen${Number.isInteger(first.row) ? ` bij rij ${first.row + 2}` : ''}: ${first.message}`);
    }
    const rows = (parsed.data || []).filter((row) => Object.values(row || {}).some((value) => String(value ?? '').trim()));
    const maxRows = Number(contract.limits?.max_rows || 100);
    if (!rows.length) throw new Error('De CSV bevat geen kandidaten.');
    if (rows.length > maxRows) throw new Error(`De CSV bevat meer dan ${maxRows} kandidaten.`);

    const enums = contract.enums || {};
    const maxText = Number(contract.limits?.max_text_length || 5000);
    const maxSources = Number(contract.limits?.max_source_urls_length || 12000);

    return rows.map((row, index) => {
      const n = index + 2;
      const rank = Number(requiredText(row, 'rank', 10, n));
      if (!Number.isInteger(rank) || rank < 1) throw new Error(`Rij ${n}: rank moet een positief geheel getal zijn.`);
      const decision = requiredText(row, 'triage_decision', 40, n).toUpperCase();
      const priority = requiredText(row, 'provisional_priority', 40, n).toUpperCase();
      const confidence = requiredText(row, 'evidence_confidence', 40, n).toUpperCase();
      if (!enums.triage_decision?.includes(decision)) throw new Error(`Rij ${n}: onbekende triage_decision.`);
      if (!enums.provisional_priority?.includes(priority)) throw new Error(`Rij ${n}: onbekende provisional_priority.`);
      if (!enums.evidence_confidence?.includes(confidence)) throw new Error(`Rij ${n}: onbekende evidence_confidence.`);
      const sourceText = optionalText(row, 'source_urls', maxSources, n);
      const sourceUrls = sourceText
        ? sourceText.split(contract.source_urls_separator || ' | ').map((url) => url.trim()).filter(Boolean)
        : [];
      for (const source of sourceUrls) normalizeWebsite(source, n);
      return {
        rank,
        business_name: requiredText(row, 'business_name', 300, n),
        location: requiredText(row, 'location', 240, n),
        website: normalizeWebsite(requiredText(row, 'website', 1000, n), n),
        triage_decision: decision,
        provisional_priority: priority,
        eligible_for_pdos: parseBoolean(row.eligible_for_pdos, 'eligible_for_pdos', n),
        evidence_confidence: confidence,
        desktop_content_inspected: parseBoolean(row.desktop_content_inspected, 'desktop_content_inspected', n),
        mobile_inspected: parseBoolean(row.mobile_inspected, 'mobile_inspected', n),
        service_or_project_page_inspected: parseBoolean(row.service_or_project_page_inspected, 'service_or_project_page_inspected', n),
        trust_evidence_checked: parseBoolean(row.trust_evidence_checked, 'trust_evidence_checked', n),
        technical_measurement_run: parseBoolean(row.technical_measurement_run, 'technical_measurement_run', n),
        commercial_signals: optionalText(row, 'commercial_signals', maxText, n),
        website_observations: optionalText(row, 'website_observations', maxText, n),
        structural_redesign_hypothesis: optionalText(row, 'structural_redesign_hypothesis', maxText, n),
        verification_needed: optionalText(row, 'verification_needed', maxText, n),
        source_urls: sourceUrls
      };
    });
  }

  function candidates(rows, context) {
    return rows.map((row) => ({
      external_id: null,
      name: row.business_name,
      category: context.humanTerm,
      city: row.location,
      address: null,
      website_url: row.website,
      phone: null,
      place_id: null,
      discovery_source: 'research',
      discovery_version: RESEARCH_METHOD_VERSION,
      source_confidence: null,
      operating_status: null,
      canonical_sector_key: context.canonicalKey,
      state: 'DISCOVERED',
      qualification: {
        stage: 'research_triage',
        eligible: null,
        evidence_required: true,
        research: {
          method: 'prospect_research',
          version: RESEARCH_METHOD_VERSION,
          rank: row.rank,
          decision: row.triage_decision,
          priority: row.provisional_priority,
          eligible_for_pdos: row.eligible_for_pdos,
          confidence: row.evidence_confidence,
          commercial_signals: row.commercial_signals,
          website_observations: row.website_observations,
          redesign_hypothesis: row.structural_redesign_hypothesis,
          verification_needed: row.verification_needed,
          inspection: {
            desktop: row.desktop_content_inspected,
            mobile: row.mobile_inspected,
            service_page: row.service_or_project_page_inspected,
            trust: row.trust_evidence_checked,
            technical_measurement: row.technical_measurement_run
          },
          source_urls: row.source_urls
        },
        note: 'Research triage is discovery evidence. Full commercial qualification remains separately evidence-gated.'
      }
    }));
  }

  async function createRun(context, fileName) {
    const session = await sessionOrThrow();
    const now = new Date().toISOString();
    const { data, error } = await db.from('discovery_runs').insert({
      run_type: 'IMPORT',
      input: {
        format: 'csv',
        method: 'prospect_research',
        method_version: RESEARCH_METHOD_VERSION,
        sector: context.humanTerm,
        canonical_sector_key: context.canonicalKey,
        location: context.location,
        source_filename: fileName
      },
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
      await finishRun(runId, { status: 'FAILED', error: String(error?.message || error).slice(0, 1200) });
    } catch (updateError) {
      console.error('Research discovery run failure could not be persisted', updateError);
    }
  }

  importButton.addEventListener('click', async () => {
    importButton.disabled = true;
    let runId = null;
    try {
      const context = await researchContext();
      const file = fileInput.files?.[0];
      if (!file) throw new Error('Kies eerst het CSV-resultaat uit ChatGPT.');
      if (file.size > 2 * 1024 * 1024) throw new Error('De CSV is groter dan 2 MB.');
      setMessage('CSV controleren…');
      const [Papa, contract, text] = await Promise.all([loadPapa(), loadContract(), file.text()]);
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: 'greedy' });
      const rows = validateRows(parsed, contract);
      const normalized = candidates(rows, context);
      runId = await createRun(context, file.name);
      const ingest = await rpc('operator_ingest_discovery_candidates', {
        p_run_id: runId,
        p_candidates: normalized
      });
      const enriched = Number(ingest.enriched_count || 0);
      await finishRun(runId, {
        status: 'COMPLETED',
        found_count: ingest.found_count || normalized.length,
        new_count: ingest.new_count || 0,
        qualified_count: 0,
        disqualified_count: 0,
        result: {
          contract: contract.contract,
          method: 'prospect_research',
          method_version: RESEARCH_METHOD_VERSION,
          existing_count: ingest.existing_count || 0,
          enriched_count: enriched
        },
        error: null
      });
      const parts = [`${ingest.found_count || normalized.length} onderzocht`, `${ingest.new_count || 0} nieuw`];
      if (enriched) parts.push(`${enriched} bestaand aangevuld`);
      setMessage(`✓ ${parts.join(' · ')}. Bekijk de kandidaten hieronder.`);
      fileInput.value = '';
      document.getElementById('refreshDiscoveryBtn')?.click();
    } catch (error) {
      if (runId) await failRun(runId, error);
      setMessage(error.message || String(error), true);
    } finally {
      importButton.disabled = false;
    }
  });
})();