(() => {
  'use strict';

  // Fast deterministic mappings for sectors SolidDesign already uses often.
  // Unknown terms fall back to the authenticated resolver, which may propose a code
  // but can only return it after validation against the official Overture taxonomy.
  const SECTORS = Object.freeze({
    elektricien: ['electrician'],
    electricien: ['electrician'],
    electrician: ['electrician'],
    loodgieter: ['plumber'],
    plumber: ['plumber'],
    tandarts: ['dentist'],
    dentist: ['dentist'],
    schilder: ['painter'],
    painter: ['painter'],
    stukadoor: ['plasterer'],
    stucadoor: ['plasterer'],
    plasterer: ['plasterer'],
    bakker: ['bakery'],
    bakkerij: ['bakery'],
    bakery: ['bakery'],
    kapper: ['barber'],
    kappers: ['barber'],
    kapsalon: ['barber'],
    kapsalons: ['barber'],
    barber: ['barber'],
    barbershop: ['barber']
  });

  const canonicalCodes = new Set(Object.values(SECTORS).flat());
  let authClient = null;

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 _-]/g, '')
      .replace(/[\s-]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function requestedTerms(value) {
    return String(value || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12);
  }

  function resolveKnown(value) {
    const requested = requestedTerms(value);
    const unknown = [];
    const codes = [];

    for (const raw of requested) {
      const key = normalize(raw);
      const mapped = SECTORS[key] || (canonicalCodes.has(key) ? [key] : null);
      if (!mapped) {
        unknown.push(raw);
        continue;
      }
      for (const code of mapped) {
        if (!codes.includes(code)) codes.push(code);
      }
    }

    return { requested, codes, unknown };
  }

  function setMessage(text, isError = false) {
    const message = document.getElementById('discoveryMessage');
    if (!message) return;
    message.textContent = text || '';
    message.classList.toggle('error', Boolean(isError));
  }

  async function accessToken() {
    const config = window.SOLIDDESIGN_OPERATOR_CONFIG;
    if (!config?.supabaseUrl || !config?.supabasePublishableKey || !window.supabase) {
      throw new Error('Operator-authenticatie is niet beschikbaar.');
    }
    authClient ||= window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);
    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om discovery uit te voeren.');
    return session.access_token;
  }

  async function resolveUnknown(terms) {
    const token = await accessToken();
    const response = await fetch('/api/resolve-sector', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ terms })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Sectorresolutie mislukt (${response.status}).`);
    return payload;
  }

  function mergeResolvedCodes(known, dynamic) {
    const unresolved = Array.isArray(dynamic?.unresolved) ? dynamic.unresolved : [];
    if (unresolved.length) {
      const quoted = unresolved.map((item) => `“${item}”`).join(', ');
      throw new Error(`${quoted} kon niet betrouwbaar aan een geldige Overture-sector worden gekoppeld.`);
    }

    const codes = [...known.codes];
    for (const item of Array.isArray(dynamic?.resolutions) ? dynamic.resolutions : []) {
      const code = normalize(item?.code);
      if (code && !codes.includes(code)) codes.push(code);
    }
    if (!codes.length) throw new Error('Geen geldige Overture-sector gevonden.');
    return codes;
  }

  async function resolveSingleSector(value) {
    const known = resolveKnown(value);
    if (known.requested.length !== 1) {
      throw new Error('Voer voor sectorinzichten precies één sector tegelijk in.');
    }
    const codes = known.unknown.length
      ? mergeResolvedCodes(known, await resolveUnknown(known.unknown))
      : known.codes;
    if (codes.length !== 1) {
      throw new Error('Deze sector koppelt aan meerdere Overture-categorieën. Gebruik een specifiekere sectornaam.');
    }
    return { humanTerm: known.requested[0], canonicalKey: codes[0] };
  }

  function sectorIntelligencePrompt({ humanTerm, location, canonicalKey }) {
    return `Werk autonoom als Sector Intelligence researcher voor SolidDesign.\n\nRepository: https://github.com/solidprivacy-nl/soliddesign\nLees eerst ENGINEERING_CONSTITUTION.md en sector-intelligence/README.md in de repository en volg die als canonical instructions.\n\nResearch inputs:\n- human_sector_term: ${humanTerm}\n- location: ${location}\n- canonical_sector_key: ${canonicalKey}\n\nVoer het volledige onderzoek uit in deze gewone ChatGPT-chat: uitgebreid webonderzoek, referentieselectie, analyse, synthese en de verplichte self-review. Gebruik de menselijke marktterm en locatie voor de research; gebruik de Overture-key alleen als machine identity. Schrijf het eindresultaat naar sector-intelligence/${canonicalKey}.md op een nieuwe GitHub branch en open een PR naar main. Als het bestand al bestaat, behandel dit als een refresh en behoud alleen conclusies die na nieuw onderzoek nog gerechtvaardigd zijn. Werk autonoom door tot de PR is geopend en rapporteer daarna kort het resultaat. Merge de PR niet zelf.`;
  }

  function installSectorIntelligenceLauncher() {
    if (document.getElementById('startSectorIntelligence')) return;
    const discoveryButton = document.getElementById('runAreaDiscovery');
    const discoveryAction = discoveryButton?.closest('.discovery-action');
    if (!discoveryAction) return;

    const action = document.createElement('div');
    action.className = 'discovery-action';
    const note = document.createElement('span');
    note.className = 'subtle';
    note.innerHTML = '<strong>Sectorinzichten:</strong> laat ChatGPT voor één sector sterke websites onderzoeken en de herbruikbare designinzichten via GitHub vastleggen.';
    const button = document.createElement('button');
    button.id = 'startSectorIntelligence';
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = 'Start sectoronderzoek in ChatGPT';
    action.append(note, button);
    discoveryAction.insertAdjacentElement('afterend', action);

    button.addEventListener('click', async () => {
      const location = document.getElementById('discoveryLocation')?.value.trim() || '';
      const sectorValue = document.getElementById('discoveryKeywords')?.value.trim() || '';
      if (!location) return setMessage('Vul eerst een locatie in voor het sectoronderzoek.', true);
      if (!sectorValue) return setMessage('Vul eerst één sector in voor het sectoronderzoek.', true);

      const popup = window.open('about:blank', '_blank');
      if (popup) popup.opener = null;
      button.disabled = true;
      setMessage('Sectoronderzoek voor ChatGPT voorbereiden…');
      try {
        const sector = await resolveSingleSector(sectorValue);
        const prompt = sectorIntelligencePrompt({ ...sector, location });
        await navigator.clipboard.writeText(prompt);
        if (popup) popup.location = 'https://chatgpt.com/';
        else window.open('https://chatgpt.com/', '_blank', 'noopener');
        setMessage(`Onderzoeksopdracht voor “${sector.humanTerm}” in ${location} gekopieerd (sector: ${sector.canonicalKey}). Plak hem in een nieuwe ChatGPT-chat.`);
      } catch (error) {
        if (popup) popup.close();
        setMessage(error.message || String(error), true);
      } finally {
        button.disabled = false;
      }
    });
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('#runAreaDiscovery');
    if (!button) return;

    if (button.dataset.sectorResolved === 'true') {
      delete button.dataset.sectorResolved;
      return;
    }

    const input = document.getElementById('discoveryKeywords');
    if (!input) return;

    const original = input.value;
    const known = resolveKnown(original);
    if (!known.requested.length) return;

    if (!known.unknown.length) {
      input.value = known.codes.join(', ');
      queueMicrotask(() => { input.value = original; });
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    setMessage(`Sector${known.unknown.length === 1 ? '' : 'en'} automatisch koppelen aan Overture…`);

    try {
      const codes = mergeResolvedCodes(known, await resolveUnknown(known.unknown));
      input.value = codes.join(', ');
      button.dataset.sectorResolved = 'true';
      button.disabled = false;
      button.click();
      queueMicrotask(() => { input.value = original; });
    } catch (error) {
      setMessage(error.message || String(error), true);
      button.disabled = false;
    }
  }, true);

  window.SOLIDDESIGN_DISCOVERY_SECTORS = SECTORS;
  window.SOLIDDESIGN_RESOLVE_DISCOVERY_SECTORS = resolveKnown;

  installSectorIntelligenceLauncher();

  // Keep the main discovery module unchanged: triage is a thin enhancement layer.
  const triageScript = document.createElement('script');
  triageScript.src = './discovery-triage.js';
  triageScript.defer = true;
  document.head.appendChild(triageScript);
})();