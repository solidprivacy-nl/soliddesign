(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const appView = document.getElementById('appView');
  const prospectsView = document.getElementById('prospectsView');
  const discoveryView = document.getElementById('discoveryView');
  const prospectsNav = document.getElementById('prospectsNav');
  const discoveryNav = document.getElementById('discoveryNav');
  const detailPanel = document.getElementById('detailPanel');
  if (!appView || !prospectsView || !discoveryView || !prospectsNav || !discoveryNav || !detailPanel) return;

  let discoverySnapshot = null;
  let sectorRows = [];
  let linkTargets = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om deze actie uit te voeren.');
    return session;
  }

  async function resolveSector(term) {
    const clean = String(term || '').trim();
    if (!clean) throw new Error('Vul één sector in.');
    const session = await sessionOrThrow();
    const response = await fetch('/api/resolve-sector', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ terms: [clean] })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Sectorresolutie mislukt (${response.status}).`);
    if (Array.isArray(payload.unresolved) && payload.unresolved.length) {
      throw new Error(`“${clean}” kon niet betrouwbaar aan een geldige Overture-sector worden gekoppeld.`);
    }
    const codes = [...new Set((payload.resolutions || []).map((item) => String(item?.code || '').trim().toLowerCase()).filter(Boolean))];
    if (codes.length !== 1) throw new Error('Deze sector kon niet eenduidig worden gekoppeld. Gebruik een specifiekere sectornaam.');
    return codes[0];
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
        <p class="subtle">Onderzoek één markt één keer en hergebruik de inzichten voor ieder relevant prospect. De sector is losgekoppeld van de manier waarop een bedrijf is gevonden.</p>
        <div class="form-grid">
          <label>Sector
            <input id="sectorResearchTerm" type="text" maxlength="120" placeholder="Bijv. juwelier" />
          </label>
          <label>Startlocatie
            <input id="sectorResearchLocation" type="text" maxlength="120" placeholder="Bijv. Amsterdam" />
          </label>
        </div>
        <p class="subtle">Gebruik hier de menselijke marktterm, bijvoorbeeld <strong>kapper</strong>, niet de canonical key <code>barber</code>. SolidDesign valideert de term en gebruikt de canonical key alleen als machine-identiteit.</p>
        <div id="sectorResearchControls"></div>
        <p id="sectorResearchMessage" class="message" aria-live="polite"></p>
      </div>

      <div class="card discovery-card">
        <div class="eyebrow">Prospect koppelen</div>
        <h2>Koppel een sector</h2>
        <p class="subtle">Koppel dezelfde sectorinformatie aan elk bedrijf of prospect, ook als het alleen via een losse URL is toegevoegd.</p>
        <label>Bedrijf / prospect
          <select id="sectorLinkTarget"></select>
        </label>
        <label>Sector
          <input id="sectorLinkTerm" type="text" maxlength="120" placeholder="Bijv. juwelier of jewelry_store" />
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
          <p class="subtle">Gepubliceerd onderzoek is direct beschikbaar voor designbriefs. Onderzoek in review wordt pas gebruikt nadat het is gepubliceerd.</p>
        </div>
        <button id="refreshSectorIntelligence" type="button" class="ghost">Vernieuwen</button>
      </div>
      <div id="sectorIntelligenceList" class="run-list"></div>
    </section>`;
  discoveryView.insertAdjacentElement('afterend', sectorView);

  const researchTerm = document.getElementById('sectorResearchTerm');
  const researchLocation = document.getElementById('sectorResearchLocation');
  const researchControls = document.getElementById('sectorResearchControls');
  const researchMessage = document.getElementById('sectorResearchMessage');
  const linkTarget = document.getElementById('sectorLinkTarget');
  const linkTerm = document.getElementById('sectorLinkTerm');
  const linkStatus = document.getElementById('sectorLinkStatus');
  const linkMessage = document.getElementById('sectorLinkMessage');
  const sectorList = document.getElementById('sectorIntelligenceList');

  function discoveryInputs() {
    return {
      location: document.getElementById('discoveryLocation'),
      sector: document.getElementById('discoveryKeywords')
    };
  }

  function syncResearchToLegacyInputs() {
    const inputs = discoveryInputs();
    if (inputs.location) inputs.location.value = researchLocation.value;
    if (inputs.sector) inputs.sector.value = researchTerm.value;
  }

  function restoreDiscoveryInputs() {
    if (!discoverySnapshot) return;
    const inputs = discoveryInputs();
    if (inputs.location) inputs.location.value = discoverySnapshot.location;
    if (inputs.sector) inputs.sector.value = discoverySnapshot.sector;
    discoverySnapshot = null;
  }

  function leaveSectorView() {
    restoreDiscoveryInputs();
    sectorView.classList.add('hidden');
    sectorNav.classList.remove('active');
  }

  async function showSectorView(options = {}) {
    const inputs = discoveryInputs();
    if (sectorView.classList.contains('hidden')) {
      discoverySnapshot = {
        location: inputs.location?.value || '',
        sector: inputs.sector?.value || ''
      };
    }

    const requestedTerm = String(options.sectorTerm || '').trim();
    const requestedLocation = String(options.location || '').trim();
    if (options.resetResearchTerm) researchTerm.value = '';
    else researchTerm.value = requestedTerm || researchTerm.value || discoverySnapshot?.sector || '';
    researchLocation.value = requestedLocation || researchLocation.value || discoverySnapshot?.location || '';
    syncResearchToLegacyInputs();

    prospectsView.classList.add('hidden');
    discoveryView.classList.add('hidden');
    sectorView.classList.remove('hidden');
    prospectsNav.classList.remove('active');
    discoveryNav.classList.remove('active');
    sectorNav.classList.add('active');

    await refreshWorkspace();
    if (options.targetId) {
      linkTarget.value = options.targetId;
      updateLinkFormFromTarget();
    }
  }

  window.SOLIDDESIGN_OPEN_SECTOR_INTELLIGENCE = showSectorView;
  sectorNav.addEventListener('click', () => showSectorView().catch((error) => { researchMessage.textContent = error.message || String(error); researchMessage.classList.add('error'); }));
  prospectsNav.addEventListener('click', leaveSectorView, true);
  discoveryNav.addEventListener('click', leaveSectorView, true);

  researchTerm.addEventListener('input', syncResearchToLegacyInputs);
  researchLocation.addEventListener('input', syncResearchToLegacyInputs);

  function installExistingResearchControls() {
    const startButton = document.getElementById('startSectorIntelligence');
    const processButton = document.getElementById('processSectorIntelligence');
    const fallback = document.getElementById('sectorIntelligencePasteFallback');
    if (!startButton || !processButton || !fallback) return;

    const startAction = startButton.closest('.discovery-action');
    const processAction = processButton.closest('.discovery-action');
    if (!startAction || !processAction) return;

    const shortcut = document.createElement('div');
    shortcut.className = 'discovery-action';
    shortcut.innerHTML = '<span class="subtle"><strong>Sectorinzichten:</strong> beheer herbruikbaar sectoronderzoek los van deze zoekopdracht.</span>';
    const shortcutButton = document.createElement('button');
    shortcutButton.type = 'button';
    shortcutButton.className = 'secondary';
    shortcutButton.textContent = 'Open sectoronderzoek';
    shortcut.appendChild(shortcutButton);
    startAction.parentElement.insertBefore(shortcut, startAction);

    researchControls.append(startAction, processAction, fallback);
    fallback.classList.remove('card');

    startButton.addEventListener('click', syncResearchToLegacyInputs, true);
    processButton.addEventListener('click', syncResearchToLegacyInputs, true);
    fallback.querySelector('#submitSectorIntelligenceResult')?.addEventListener('click', syncResearchToLegacyInputs, true);
    shortcutButton.addEventListener('click', () => {
      const current = discoveryInputs();
      showSectorView({
        sectorTerm: current.sector?.value || '',
        location: current.location?.value || ''
      }).catch((error) => window.alert(error.message || String(error)));
    });
  }

  function statusLabel(value) {
    return ({
      PUBLISHED: 'Gepubliceerd',
      IN_REVIEW: 'In review',
      UPDATE_IN_REVIEW: 'Update in review'
    })[value] || value || 'Onbekend';
  }

  async function loadSectorRows() {
    const session = await sessionOrThrow();
    const response = await fetch('/api/sector-intelligence', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Sectorinzichten konden niet worden geladen (${response.status}).`);
    sectorRows = Array.isArray(payload.sectors) ? payload.sectors : [];
    renderSectorRows();
  }

  function renderSectorRows() {
    if (!sectorRows.length) {
      sectorList.innerHTML = '<div class="list-empty">Nog geen sectoronderzoek gepubliceerd of in review.</div>';
      return;
    }
    sectorList.innerHTML = '';
    for (const row of sectorRows) {
      const item = document.createElement('div');
      item.className = 'run-row';
      const links = [];
      if (row.source_url) links.push(`<a href="${escapeHtml(row.source_url)}" target="_blank" rel="noopener">Onderzoek ↗</a>`);
      if (row.review_url) links.push(`<a href="${escapeHtml(row.review_url)}" target="_blank" rel="noopener">Review ↗</a>`);
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(row.canonical_sector_key)}</strong>
          <span>${escapeHtml(statusLabel(row.status))}</span>
        </div>
        <div class="compact-actions">
          ${links.join('')}
          <button type="button" class="secondary" data-use-sector>Koppel aan prospect</button>
        </div>`;
      item.querySelector('[data-use-sector]').addEventListener('click', () => {
        linkTerm.value = row.canonical_sector_key;
        linkStatus.textContent = sectorAvailability(row.canonical_sector_key);
        linkMessage.textContent = `Sector “${row.canonical_sector_key}” geselecteerd. Kies het bedrijf en klik op Koppel sector.`;
        linkMessage.classList.remove('error');
        linkTarget.focus();
      });
      sectorList.appendChild(item);
    }
  }

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

  function sectorAvailability(key) {
    if (!key) return 'Geen sector gekoppeld';
    if (!sectorRows.length) return `${key} · sector gekoppeld`;
    const row = sectorRows.find((item) => item.canonical_sector_key === key);
    if (!row) return `${key} · geen onderzoek bekend`;
    return `${key} · ${statusLabel(row.status).toLowerCase()}`;
  }

  function updateLinkFormFromTarget() {
    const target = selectedLinkTarget();
    if (!target) {
      linkTerm.value = '';
      linkStatus.textContent = 'Geen prospect beschikbaar.';
      return;
    }
    linkTerm.value = target.canonical_sector_key || '';
    linkStatus.textContent = sectorAvailability(target.canonical_sector_key);
  }

  linkTarget.addEventListener('change', updateLinkFormFromTarget);

  document.getElementById('sectorLinkSave').addEventListener('click', async () => {
    const button = document.getElementById('sectorLinkSave');
    const target = selectedLinkTarget();
    if (!target) return;
    button.disabled = true;
    linkMessage.textContent = 'Sector koppelen…';
    linkMessage.classList.remove('error');
    try {
      const key = await resolveSector(linkTerm.value);
      const { data, error } = await db.rpc('operator_set_prospect_sector', {
        p_id: target.id,
        p_sector_key: key
      });
      if (error) throw error;
      if (!data) throw new Error('Sector kon niet aan het prospect worden gekoppeld.');
      target.canonical_sector_key = key;
      linkTerm.value = key;
      linkStatus.textContent = sectorAvailability(key);
      linkMessage.textContent = `Sector “${key}” gekoppeld aan ${target.name}.`;
      bindCurrentProspectSector(true).catch(console.error);
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
    researchTerm.value = '';
    researchLocation.value = target.city || researchLocation.value;
    syncResearchToLegacyInputs();
    const key = linkTerm.value.trim() || target.canonical_sector_key || '';
    researchMessage.textContent = key
      ? `Sector-key “${key}” is de machine-identiteit. Vul hierboven de menselijke marktterm in waarmee ChatGPT moet onderzoeken.`
      : 'Vul hierboven de menselijke marktterm in waarmee ChatGPT deze sector moet onderzoeken.';
    researchMessage.classList.remove('error');
    researchTerm.focus();
  });

  document.getElementById('refreshSectorIntelligence').addEventListener('click', () => refreshWorkspace().catch((error) => {
    researchMessage.textContent = error.message || String(error);
    researchMessage.classList.add('error');
  }));

  async function refreshWorkspace() {
    researchMessage.classList.remove('error');
    await Promise.all([loadSectorRows(), loadLinkTargets()]);
  }

  const discoveryMessage = document.getElementById('discoveryMessage');
  if (discoveryMessage) {
    const mirrorMessage = () => {
      if (sectorView.classList.contains('hidden')) return;
      researchMessage.textContent = discoveryMessage.textContent || '';
      researchMessage.classList.toggle('error', discoveryMessage.classList.contains('error'));
      const text = researchMessage.textContent.toLowerCase();
      if (text.includes('opgeslagen voor review') || text.includes('al actueel')) {
        loadSectorRows().then(() => updateLinkFormFromTarget()).catch(console.error);
      }
    };
    new MutationObserver(mirrorMessage).observe(discoveryMessage, { childList: true, characterData: true, subtree: true, attributes: true });
  }

  async function bindCurrentProspectSector(force = false) {
    const root = detailPanel.querySelector('.detail-content');
    if (!root) return;
    if (!force && root.dataset.sectorLinkBound === 'true') return;
    const card = root.querySelector('[data-design-process]');
    const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim();
    const name = root.querySelector('[data-field="name"]')?.textContent?.trim();
    if (!card || !website || !name) return;

    const { data, error } = await db.from('prospects')
      .select('id,name,website_url,city,canonical_sector_key')
      .eq('name', name)
      .eq('website_url', website)
      .limit(2);
    if (error || data?.length !== 1 || !root.isConnected) return;
    const prospect = data[0];

    root.querySelector('[data-prospect-sector-control]')?.remove();
    const control = document.createElement('div');
    control.dataset.prospectSectorControl = 'true';
    control.className = 'form-grid';
    control.innerHTML = `
      <label>Sector voor design
        <input data-prospect-sector-input type="text" maxlength="120" placeholder="Bijv. juwelier" />
      </label>
      <div>
        <span class="subtle" data-prospect-sector-status></span>
        <div class="compact-actions">
          <button type="button" class="secondary" data-prospect-sector-research>Sectoronderzoek</button>
          <button type="button" class="secondary" data-prospect-sector-save>Koppel sector</button>
        </div>
      </div>`;
    const intro = card.querySelector(':scope > p.subtle');
    if (intro) intro.insertAdjacentElement('afterend', control);
    else card.prepend(control);

    const input = control.querySelector('[data-prospect-sector-input]');
    const status = control.querySelector('[data-prospect-sector-status]');
    input.value = prospect.canonical_sector_key || '';
    status.textContent = sectorAvailability(prospect.canonical_sector_key);

    control.querySelector('[data-prospect-sector-save]').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const key = await resolveSector(input.value);
        const { data: changed, error: saveError } = await db.rpc('operator_set_prospect_sector', {
          p_id: prospect.id,
          p_sector_key: key
        });
        if (saveError) throw saveError;
        if (!changed) throw new Error('Sector kon niet worden gekoppeld.');
        prospect.canonical_sector_key = key;
        input.value = key;
        status.textContent = sectorAvailability(key);
      } catch (error) {
        window.alert(error.message || String(error));
      } finally {
        button.disabled = false;
      }
    });

    control.querySelector('[data-prospect-sector-research]').addEventListener('click', () => {
      showSectorView({
        resetResearchTerm: true,
        location: prospect.city || '',
        targetId: prospect.id
      }).then(() => {
        const key = input.value.trim() || prospect.canonical_sector_key || '';
        researchMessage.textContent = key
          ? `Sector-key “${key}” is gekoppeld aan dit prospect. Vul de menselijke marktterm in voor het onderzoek.`
          : 'Vul de menselijke marktterm in voor het sectoronderzoek.';
        researchMessage.classList.remove('error');
        researchTerm.focus();
      }).catch((error) => window.alert(error.message || String(error)));
    });
    root.dataset.sectorLinkBound = 'true';
  }

  installExistingResearchControls();
  new MutationObserver(() => bindCurrentProspectSector().catch(console.error)).observe(detailPanel, { childList: true, subtree: true });
  bindCurrentProspectSector().catch(console.error);
})();
