(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  const resolveSingleSector = window.SOLIDDESIGN_RESOLVE_SINGLE_SECTOR;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase || !resolveSingleSector) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const appView = document.getElementById('appView');
  const prospectsView = document.getElementById('prospectsView');
  const discoveryView = document.getElementById('discoveryView');
  const prospectsNav = document.getElementById('prospectsNav');
  const discoveryNav = document.getElementById('discoveryNav');
  const detailPanel = document.getElementById('detailPanel');
  if (!appView || !prospectsView || !discoveryView || !prospectsNav || !discoveryNav || !detailPanel) return;

  let sectorRows = [];
  let linkTargets = [];
  let detailRow = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function humanizeKey(value) {
    const text = String(value || '').replaceAll('_', ' ').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }

  function validCanonicalKey(value) {
    const key = String(value || '').trim().toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,62}$/.test(key) ? key : null;
  }

  function setKnownCanonicalKey(input, value, preserveWhileEditing = false) {
    const key = validCanonicalKey(value);
    if (key) {
      input.dataset.canonicalKey = key;
      input.dataset.preserveCanonicalKey = preserveWhileEditing ? 'true' : 'false';
    } else {
      delete input.dataset.canonicalKey;
      delete input.dataset.preserveCanonicalKey;
    }
  }

  async function resolveInputSector(input) {
    const humanTerm = input.value.trim();
    if (!humanTerm) throw new Error('Vul één sector in.');
    const knownKey = validCanonicalKey(input.dataset.canonicalKey);
    if (knownKey) return { humanTerm, canonicalKey: knownKey };
    return resolveSingleSector(humanTerm);
  }

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om deze actie uit te voeren.');
    return session;
  }

  async function sectorApi({ method = 'GET', query = '', body = null } = {}) {
    const session = await sessionOrThrow();
    const response = await fetch(`/api/sector-intelligence${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Sectoronderzoek kon niet worden verwerkt (${response.status}).`);
    return payload;
  }

  const sectorNav = document.createElement('button');
  sectorNav.id = 'sectorIntelligenceNav';
  sectorNav.type = 'button';
  sectorNav.className = 'nav-button';
  sectorNav.textContent = 'Sectoronderzoek';
  discoveryNav.insertAdjacentElement('afterend', sectorNav);

  const sectorView = document.createElement('main');
  sectorView.id = 'sectorIntelligenceView';
  sectorView.className = 'discovery-layout hidden';
  sectorView.innerHTML = `
    <section class="discovery-grid">
      <div class="card discovery-card">
        <div class="eyebrow">Herbruikbare designkennis</div>
        <h2>Sectoronderzoek</h2>
        <p class="subtle">Onderzoek één markt één keer en hergebruik de inzichten voor ieder relevant prospect. Gebruik de menselijke marktterm; SolidDesign handelt de technische sectoridentiteit af.</p>
        <div class="form-grid">
          <label>Sector
            <input id="sectorResearchTerm" type="text" maxlength="120" placeholder="Bijv. juwelier" />
          </label>
          <label>Startlocatie
            <input id="sectorResearchLocation" type="text" maxlength="120" placeholder="Bijv. Amsterdam" />
          </label>
        </div>
        <label>Aanvullende onderzoeksrichting <span class="subtle">(optioneel)</span>
          <textarea id="sectorResearchGuidance" rows="4" maxlength="4000" placeholder="Bijv. bekijk ook https://voorbeeld.nl; ik vind daar vooral de mobiele navigatie sterk. Beoordeel dit wel onafhankelijk."></textarea>
        </label>
        <p class="subtle">Deze aanwijzingen sturen het onderzoek, maar gelden niet als waarheid. Het onderzoek moet ze onafhankelijk toetsen en mag ze tegenspreken.</p>
        <div class="discovery-action">
          <span class="subtle">De onderzoeksopdracht wordt gekopieerd en ChatGPT wordt geopend.</span>
          <button id="startSectorIntelligence" type="button" class="primary">Start sectoronderzoek in ChatGPT</button>
        </div>
        <div class="discovery-action">
          <span class="subtle">Onderzoek klaar? Kopieer het definitieve antwoord in ChatGPT en verwerk het hier.</span>
          <button id="processSectorIntelligence" type="button" class="secondary">Verwerk onderzoeksresultaat</button>
        </div>
        <div id="sectorIntelligencePasteFallback" hidden>
          <label>Onderzoeksresultaat
            <textarea id="sectorIntelligenceResult" rows="10" placeholder="Plak hier alleen het definitieve Markdown-resultaat uit ChatGPT."></textarea>
          </label>
          <div class="discovery-action">
            <span class="subtle">Gebruik dit veld alleen als de browser het klembord niet kan lezen.</span>
            <button id="submitSectorIntelligenceResult" type="button" class="secondary">Verwerk geplakte tekst</button>
          </div>
        </div>
        <p id="sectorResearchMessage" class="message" aria-live="polite"></p>
      </div>

      <div class="card discovery-card">
        <div class="eyebrow">Operator-keuze</div>
        <h2>Koppel een sector</h2>
        <p class="subtle">Bepaal expliciet bij welke sector een bedrijf of prospect hoort. Dit werkt ook voor websites die via een losse URL zijn toegevoegd.</p>
        <label>Bedrijf / prospect
          <select id="sectorLinkTarget"></select>
        </label>
        <label>Sector
          <input id="sectorLinkTerm" type="text" maxlength="120" placeholder="Bijv. juwelier" />
        </label>
        <div class="save-row">
          <span id="sectorLinkStatus" class="subtle"></span>
          <div>
            <button id="sectorLinkResearch" type="button" class="secondary">Onderzoek deze sector</button>
            <button id="sectorLinkSave" type="button" class="primary">Koppel sector</button>
          </div>
        </div>
        <p id="sectorLinkMessage" class="message" aria-live="polite"></p>
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <h3>Sectorinzichten</h3>
          <p class="subtle">Beschikbaar onderzoek wordt automatisch gebruikt voor relevante designbriefs. Nieuw of bijgewerkt onderzoek wordt eerst in het CMS beoordeeld.</p>
        </div>
        <button id="refreshSectorIntelligence" type="button" class="ghost">Vernieuwen</button>
      </div>
      <div id="sectorIntelligenceList" class="run-list"></div>
    </section>

    <section id="sectorIntelligenceDetail" class="card" hidden>
      <div class="section-heading">
        <div>
          <h3 id="sectorIntelligenceDetailTitle">Sectoronderzoek</h3>
          <p id="sectorIntelligenceDetailMeta" class="subtle"></p>
        </div>
        <button id="closeSectorIntelligenceDetail" type="button" class="ghost">Sluiten</button>
      </div>
      <textarea id="sectorIntelligenceDetailContent" rows="24" readonly></textarea>
      <div class="save-row">
        <button id="viewPublishedSectorIntelligence" type="button" class="secondary" hidden>Bekijk huidige versie</button>
        <div>
          <button id="rejectSectorIntelligence" type="button" class="secondary" hidden>Afwijzen</button>
          <button id="approveSectorIntelligence" type="button" class="primary" hidden>Publiceer</button>
        </div>
      </div>
      <p id="sectorIntelligenceDetailMessage" class="message" aria-live="polite"></p>
    </section>`;
  discoveryView.insertAdjacentElement('afterend', sectorView);

  const researchTerm = document.getElementById('sectorResearchTerm');
  const researchLocation = document.getElementById('sectorResearchLocation');
  const researchGuidance = document.getElementById('sectorResearchGuidance');
  const researchMessage = document.getElementById('sectorResearchMessage');
  const fallback = document.getElementById('sectorIntelligencePasteFallback');
  const fallbackResult = document.getElementById('sectorIntelligenceResult');
  const linkTarget = document.getElementById('sectorLinkTarget');
  const linkTerm = document.getElementById('sectorLinkTerm');
  const linkStatus = document.getElementById('sectorLinkStatus');
  const linkMessage = document.getElementById('sectorLinkMessage');
  const sectorList = document.getElementById('sectorIntelligenceList');
  const detail = document.getElementById('sectorIntelligenceDetail');
  const detailTitle = document.getElementById('sectorIntelligenceDetailTitle');
  const detailMeta = document.getElementById('sectorIntelligenceDetailMeta');
  const detailContent = document.getElementById('sectorIntelligenceDetailContent');
  const detailMessage = document.getElementById('sectorIntelligenceDetailMessage');
  const viewPublishedButton = document.getElementById('viewPublishedSectorIntelligence');
  const rejectButton = document.getElementById('rejectSectorIntelligence');
  const approveButton = document.getElementById('approveSectorIntelligence');

  researchTerm.addEventListener('input', () => {
    if (researchTerm.dataset.preserveCanonicalKey !== 'true') setKnownCanonicalKey(researchTerm, null);
  });
  linkTerm.addEventListener('input', () => setKnownCanonicalKey(linkTerm, null));

  function setResearchMessage(text, isError = false) {
    researchMessage.textContent = text || '';
    researchMessage.classList.toggle('error', Boolean(isError));
  }

  function setDetailMessage(text, isError = false) {
    detailMessage.textContent = text || '';
    detailMessage.classList.toggle('error', Boolean(isError));
  }

  function statusLabel(value) {
    return ({
      AVAILABLE: 'Beschikbaar',
      PENDING_REVIEW: 'Ter beoordeling',
      UPDATE_PENDING_REVIEW: 'Bijwerking ter beoordeling'
    })[value] || value || 'Onbekend';
  }

  function rowForKey(key) {
    return sectorRows.find((row) => row.canonical_sector_key === key) || null;
  }

  function sectorAvailability(key, fallbackLabel = '') {
    if (!key) return 'Geen sector gekoppeld';
    const row = rowForKey(key);
    const label = row?.research_label || fallbackLabel || humanizeKey(key);
    if (!row) return `${label} · sector gekoppeld, nog geen onderzoek beschikbaar`;
    return `${label} · ${statusLabel(row.status).toLowerCase()}`;
  }

  function leaveSectorView() {
    sectorView.classList.add('hidden');
    sectorNav.classList.remove('active');
  }

  async function showSectorView(options = {}) {
    const requestedTerm = String(options.sectorTerm || '').trim();
    const requestedLocation = String(options.location || '').trim();
    if (options.resetResearchTerm) {
      researchTerm.value = '';
      setKnownCanonicalKey(researchTerm, null);
    } else if (requestedTerm) {
      researchTerm.value = requestedTerm;
      setKnownCanonicalKey(researchTerm, options.canonicalKey, Boolean(options.canonicalKey));
    } else if (options.canonicalKey) {
      researchTerm.value = '';
      setKnownCanonicalKey(researchTerm, options.canonicalKey, true);
    }
    if (requestedLocation) researchLocation.value = requestedLocation;

    prospectsView.classList.add('hidden');
    discoveryView.classList.add('hidden');
    sectorView.classList.remove('hidden');
    prospectsNav.classList.remove('active');
    discoveryNav.classList.remove('active');
    sectorNav.classList.add('active');

    await refreshWorkspace();
    if (options.targetId && linkTargets.some((target) => target.id === options.targetId)) {
      linkTarget.value = options.targetId;
      updateLinkFormFromTarget();
    }
    if (options.focusResearch) researchTerm.focus();
  }

  window.SOLIDDESIGN_OPEN_SECTOR_INTELLIGENCE = showSectorView;
  sectorNav.addEventListener('click', () => showSectorView().catch((error) => setResearchMessage(error.message || String(error), true)));
  prospectsNav.addEventListener('click', leaveSectorView, true);
  discoveryNav.addEventListener('click', leaveSectorView, true);

  function installDiscoveryShortcut() {
    if (document.querySelector('[data-open-sector-intelligence]')) return;
    const discoveryButton = document.getElementById('runAreaDiscovery');
    const action = discoveryButton?.closest('.discovery-action');
    if (!action) return;
    const shortcut = document.createElement('div');
    shortcut.className = 'discovery-action';
    shortcut.innerHTML = '<span class="subtle"><strong>Sectorinzichten:</strong> onderzoek of beheer herbruikbare designkennis los van deze zoekopdracht.</span>';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.dataset.openSectorIntelligence = 'true';
    button.textContent = 'Open sectoronderzoek';
    shortcut.appendChild(button);
    action.insertAdjacentElement('afterend', shortcut);
    button.addEventListener('click', () => {
      showSectorView({
        sectorTerm: document.getElementById('discoveryKeywords')?.value || '',
        location: document.getElementById('discoveryLocation')?.value || ''
      }).catch((error) => window.alert(error.message || String(error)));
    });
  }

  async function resolveResearchContext() {
    const location = researchLocation.value.trim();
    if (!location) throw new Error('Vul eerst een startlocatie in voor het sectoronderzoek.');
    const sector = await resolveInputSector(researchTerm);
    return { location, ...sector };
  }

  function sectorIntelligencePrompt({ humanTerm, location, canonicalKey, guidance }) {
    const operatorGuidance = guidance
      ? `\nAANVULLENDE ONDERZOEKSRICHTING VAN DE OPERATOR\n${guidance}\n\nBehandel deze input als een hypothese, niet als vastgestelde waarheid. Inspecteer aangedragen websites zelf, toets observaties onafhankelijk en benoem het wanneer een observatie niet of slechts gedeeltelijk standhoudt. De operatorinput mag het brede autonome onderzoek niet vervangen of vernauwen.\n`
      : '';
    return `Werk autonoom als Sector Intelligence researcher voor SolidDesign.\n\nDOEL\nOnderzoek de actuele design- en conversiekwaliteitsstandaard voor deze markt en distilleer herbruikbare, evidence-backed designinzichten. Het resultaat is adviserend en mag nooit prospectfeiten verzinnen of externe designs kopiëren.\n\nRESEARCH INPUTS\n- human_sector_term: ${humanTerm}\n- location: ${location}\n- canonical_sector_key: ${canonicalKey}\n${operatorGuidance}\nWERKWIJZE\n1. Gebruik de menselijke sectornaam en locatie als marktbetekenis. De canonical sector key is alleen machine identity en mag de researchscope niet vernauwen.\n2. Start lokaal, verbreed naar Nederland wanneer lokale voorbeelden onvoldoende zijn en voeg alleen selectief sterke internationale of aangrenzende creatieve referenties toe.\n3. Inspecteer daadwerkelijke websites, niet alleen zoekresultaatsnippets.\n4. Beoordeel ten minste: first impression/craft, typografie, compositie en hiërarchie, imagery/art direction, trust, conversiehiërarchie, mobile, originaliteit/sector-specificiteit en evidente template/AI-slop patronen.\n5. Een bruikbare richtlijn is ongeveer 7 sterke sectorreferenties plus ongeveer 3 aangrenzende creatieve referenties. Dit is geen scoreformule.\n6. Trek principes uit meerdere observaties. Kopieer geen branding, copy, layouts of onderscheidende creatieve elementen.\n7. Wees kritisch op eigen conclusies: prominent merk is niet automatisch sterk design; één voorbeeld is geen regel; clichés zijn geen best practice; benoem de drie zwakste/onzekerste conclusies expliciet.\n8. Werk vanuit first principles, solid but simple en zonder overengineering.\n\nEINDOUTPUT\nJe allerlaatste bericht moet uitsluitend het definitieve Markdown-document bevatten, zonder inleiding, toelichting of code fence. Gebruik exact deze structuur en headings:\n\n---\nsector_key: ${canonicalKey}\nresearch_label: <menselijk leesbare sectornaam>\nmarket: Nederland\nresearched_at: <YYYY-MM-DD>\nmethod_version: 1\n---\n# Sector Design Intelligence — <label>\n\n## Quality bar\n## Customer / market context relevant to design\n## Strong recurring patterns\n### Hero\n### Typography\n### Imagery\n### Trust\n### Services / offering\n### Conversion\n### Mobile\n## Creative opportunities\n## Patterns to avoid\n## Sector references\n## Adjacent creative references\n## Principles distilled from the evidence\n## Weak / uncertain conclusions\n\nElke genoemde referentie bevat een directe bron-URL en een korte reden voor selectie. Lever uitsluitend het definitieve onderzoeksdocument; SolidDesign handelt verwerking en publicatie af.`;
  }

  document.getElementById('startSectorIntelligence').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    setResearchMessage('Onderzoeksopdracht voorbereiden…');
    try {
      const context = await resolveResearchContext();
      const prompt = sectorIntelligencePrompt({ ...context, guidance: researchGuidance.value.trim() });
      await navigator.clipboard.writeText(prompt);
      const popup = window.open('https://chatgpt.com/', '_blank', 'noopener');
      setResearchMessage(popup
        ? `Onderzoeksopdracht voor “${context.humanTerm}” in ${context.location} gekopieerd. Plak hem in de nieuwe ChatGPT-chat.`
        : `Onderzoeksopdracht voor “${context.humanTerm}” in ${context.location} gekopieerd. Open ChatGPT en plak de opdracht.`);
    } catch (error) {
      setResearchMessage(error.message || String(error), true);
    } finally {
      button.disabled = false;
    }
  });

  async function submitResearchResult(markdown, button) {
    if (!String(markdown || '').trim()) throw new Error('Het onderzoeksresultaat is leeg.');
    const context = await resolveResearchContext();
    button.disabled = true;
    setResearchMessage('Onderzoeksresultaat controleren en klaarzetten voor beoordeling…');
    try {
      const result = await sectorApi({
        method: 'POST',
        body: {
          action: 'submit',
          canonical_sector_key: context.canonicalKey,
          markdown
        }
      });
      fallback.hidden = true;
      fallbackResult.value = '';
      setResearchMessage(result.status === 'unchanged'
        ? `De sectorinzichten voor “${context.humanTerm}” zijn al actueel.`
        : `Sectorinzichten voor “${context.humanTerm}” staan klaar voor beoordeling in het CMS.`);
      await loadSectorRows();
      updateLinkFormFromTarget();
    } finally {
      button.disabled = false;
    }
  }

  document.getElementById('processSectorIntelligence').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      let markdown = '';
      try {
        markdown = await navigator.clipboard.readText();
      } catch {
        fallback.hidden = false;
        fallbackResult.focus();
        setResearchMessage('De browser kon het klembord niet lezen. Plak het definitieve onderzoeksresultaat hieronder.', true);
        return;
      }
      await submitResearchResult(markdown, button);
    } catch (error) {
      setResearchMessage(error.message || String(error), true);
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById('submitSectorIntelligenceResult').addEventListener('click', async (event) => {
    try {
      await submitResearchResult(fallbackResult.value, event.currentTarget);
    } catch (error) {
      setResearchMessage(error.message || String(error), true);
    }
  });

  async function loadSectorRows() {
    const payload = await sectorApi();
    sectorRows = Array.isArray(payload.sectors) ? payload.sectors : [];
    renderSectorRows();
    window.dispatchEvent(new CustomEvent('soliddesign:sector-intelligence-changed'));
  }

  function renderSectorRows() {
    if (!sectorRows.length) {
      sectorList.innerHTML = '<div class="list-empty">Nog geen sectoronderzoek beschikbaar of ter beoordeling.</div>';
      return;
    }
    sectorList.innerHTML = '';
    for (const row of sectorRows) {
      const item = document.createElement('div');
      item.className = 'run-row';
      const date = row.researched_at ? ` · ${escapeHtml(row.researched_at)}` : '';
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(row.research_label)}</strong>
          <span>${escapeHtml(statusLabel(row.status))}${date}</span>
        </div>
        <div class="compact-actions">
          ${row.has_published ? '<button type="button" class="secondary" data-view-published>Bekijken</button>' : ''}
          ${row.has_pending_review ? '<button type="button" class="primary" data-review-pending>Beoordelen</button>' : '<button type="button" class="secondary" data-update-sector>Bijwerken</button>'}
          <button type="button" class="secondary" data-link-sector>Koppel aan prospect</button>
        </div>`;
      item.querySelector('[data-view-published]')?.addEventListener('click', () => openSectorDetail(row, 'published').catch(showDetailError));
      item.querySelector('[data-review-pending]')?.addEventListener('click', () => openSectorDetail(row, 'pending').catch(showDetailError));
      item.querySelector('[data-update-sector]')?.addEventListener('click', () => {
        researchTerm.value = row.research_label;
        setKnownCanonicalKey(researchTerm, row.canonical_sector_key, true);
        researchTerm.focus();
        setResearchMessage(`Werk het onderzoek voor “${row.research_label}” bij. Controleer de marktterm en startlocatie voordat je start.`);
      });
      item.querySelector('[data-link-sector]').addEventListener('click', () => {
        linkTerm.value = row.research_label;
        setKnownCanonicalKey(linkTerm, row.canonical_sector_key);
        linkStatus.textContent = sectorAvailability(row.canonical_sector_key, row.research_label);
        linkMessage.textContent = `Kies het bedrijf dat je aan “${row.research_label}” wilt koppelen.`;
        linkMessage.classList.remove('error');
        linkTarget.focus();
      });
      sectorList.appendChild(item);
    }
  }

  function showDetailError(error) {
    detail.hidden = false;
    setDetailMessage(error.message || String(error), true);
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openSectorDetail(row, version) {
    setDetailMessage('Sectoronderzoek laden…');
    const payload = await sectorApi({
      query: `?key=${encodeURIComponent(row.canonical_sector_key)}&version=${version}`
    });
    const sector = payload.sector;
    detailRow = row;
    detailTitle.textContent = sector.research_label || row.research_label;
    detailMeta.textContent = `${version === 'pending' ? 'Ter beoordeling' : 'Beschikbare versie'}${sector.researched_at ? ` · ${sector.researched_at}` : ''}`;
    detailContent.value = sector.content || '';
    detail.hidden = false;
    const reviewing = version === 'pending';
    rejectButton.hidden = !reviewing;
    approveButton.hidden = !reviewing;
    viewPublishedButton.hidden = !(reviewing && row.has_published);
    setDetailMessage('');
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('closeSectorIntelligenceDetail').addEventListener('click', () => {
    detail.hidden = true;
    detailRow = null;
    setDetailMessage('');
  });

  viewPublishedButton.addEventListener('click', () => {
    if (detailRow) openSectorDetail(detailRow, 'published').catch(showDetailError);
  });

  async function reviewSector(action) {
    if (!detailRow) return;
    const label = detailRow.research_label;
    const verb = action === 'approve' ? 'publiceren' : 'afwijzen';
    if (!window.confirm(`Wil je het sectoronderzoek voor “${label}” ${verb}?`)) return;
    rejectButton.disabled = true;
    approveButton.disabled = true;
    setDetailMessage(action === 'approve' ? 'Sectoronderzoek publiceren…' : 'Sectoronderzoek afwijzen…');
    try {
      await sectorApi({
        method: 'POST',
        body: { action, canonical_sector_key: detailRow.canonical_sector_key }
      });
      detail.hidden = true;
      setResearchMessage(action === 'approve'
        ? `Sectoronderzoek voor “${label}” is gepubliceerd.`
        : `Sectoronderzoek voor “${label}” is afgewezen.`);
      detailRow = null;
      await loadSectorRows();
      updateLinkFormFromTarget();
    } catch (error) {
      setDetailMessage(error.message || String(error), true);
    } finally {
      rejectButton.disabled = false;
      approveButton.disabled = false;
    }
  }

  rejectButton.addEventListener('click', () => reviewSector('reject'));
  approveButton.addEventListener('click', () => reviewSector('approve'));

  async function loadLinkTargets() {
    const { data, error } = await db.rpc('operator_list_sector_link_targets');
    if (error) throw error;
    linkTargets = Array.isArray(data) ? data : [];
    const current = linkTarget.value;
    linkTarget.innerHTML = '';
    for (const target of linkTargets) {
      const option = document.createElement('option');
      option.value = target.id;
      option.textContent = `${target.name} — ${target.website_url}`;
      linkTarget.appendChild(option);
    }
    if (current && linkTargets.some((target) => target.id === current)) linkTarget.value = current;
    updateLinkFormFromTarget();
  }

  function selectedLinkTarget() {
    return linkTargets.find((target) => target.id === linkTarget.value) || null;
  }

  function updateLinkFormFromTarget() {
    const target = selectedLinkTarget();
    if (!target) {
      linkTerm.value = '';
      setKnownCanonicalKey(linkTerm, null);
      linkStatus.textContent = 'Geen prospect beschikbaar.';
      return;
    }
    const row = rowForKey(target.canonical_sector_key);
    linkTerm.value = row?.research_label || humanizeKey(target.canonical_sector_key);
    setKnownCanonicalKey(linkTerm, target.canonical_sector_key);
    linkStatus.textContent = sectorAvailability(target.canonical_sector_key, row?.research_label || '');
  }

  linkTarget.addEventListener('change', updateLinkFormFromTarget);

  document.getElementById('sectorLinkSave').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const target = selectedLinkTarget();
    if (!target) return;
    button.disabled = true;
    linkMessage.textContent = 'Sector koppelen…';
    linkMessage.classList.remove('error');
    try {
      const resolved = await resolveInputSector(linkTerm);
      const { data, error } = await db.rpc('operator_set_prospect_sector', {
        p_id: target.id,
        p_sector_key: resolved.canonicalKey
      });
      if (error) throw error;
      if (!data) throw new Error('Sector kon niet aan het prospect worden gekoppeld.');
      target.canonical_sector_key = resolved.canonicalKey;
      linkTerm.value = rowForKey(resolved.canonicalKey)?.research_label || resolved.humanTerm;
      setKnownCanonicalKey(linkTerm, resolved.canonicalKey);
      linkStatus.textContent = sectorAvailability(resolved.canonicalKey, resolved.humanTerm);
      linkMessage.textContent = `“${resolved.humanTerm}” is gekoppeld aan ${target.name}.`;
      window.dispatchEvent(new CustomEvent('soliddesign:prospect-sector-changed', {
        detail: { prospectId: target.id, canonicalSectorKey: resolved.canonicalKey }
      }));
    } catch (error) {
      linkMessage.textContent = error.message || String(error);
      linkMessage.classList.add('error');
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById('sectorLinkResearch').addEventListener('click', () => {
    const target = selectedLinkTarget();
    if (!target) return;
    const row = rowForKey(target.canonical_sector_key);
    researchTerm.value = row?.research_label || '';
    setKnownCanonicalKey(researchTerm, target.canonical_sector_key, true);
    researchLocation.value = target.city || researchLocation.value;
    setResearchMessage(row
      ? `Onderzoek of actualiseer “${row.research_label}”.`
      : 'Vul de menselijke marktterm in voor deze gekoppelde sector.');
    researchTerm.focus();
  });

  document.getElementById('refreshSectorIntelligence').addEventListener('click', () => refreshWorkspace().catch((error) => setResearchMessage(error.message || String(error), true)));

  async function refreshWorkspace() {
    setResearchMessage('');
    await loadSectorRows();
    await loadLinkTargets();
  }

  installDiscoveryShortcut();
})();
