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
    if (!session?.access_token) throw new Error('Log opnieuw in om deze actie uit te voeren.');
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
    return `Werk autonoom als Sector Intelligence researcher voor SolidDesign.\n\nDOEL\nOnderzoek de actuele design- en conversiekwaliteitsstandaard voor deze markt en distilleer herbruikbare, evidence-backed designinzichten. Het resultaat is adviserend en mag nooit prospectfeiten verzinnen of externe designs kopiëren.\n\nRESEARCH INPUTS\n- human_sector_term: ${humanTerm}\n- location: ${location}\n- canonical_sector_key: ${canonicalKey}\n\nWERKWIJZE\n1. Gebruik de menselijke sectornaam en locatie als marktbetekenis. De canonical sector key is alleen machine identity en mag de researchscope niet vernauwen.\n2. Start lokaal, verbreed naar Nederland wanneer lokale voorbeelden onvoldoende zijn en voeg alleen selectief sterke internationale of aangrenzende creatieve referenties toe.\n3. Inspecteer daadwerkelijke websites, niet alleen zoekresultaatsnippets.\n4. Beoordeel ten minste: first impression/craft, typografie, compositie en hiërarchie, imagery/art direction, trust, conversiehiërarchie, mobile, originaliteit/sector-specificiteit en evidente template/AI-slop patronen.\n5. Een bruikbare richtlijn is ongeveer 7 sterke sectorreferenties plus ongeveer 3 aangrenzende creatieve referenties. Dit is geen scoreformule.\n6. Trek principes uit meerdere observaties. Kopieer geen branding, copy, layouts of onderscheidende creatieve elementen.\n7. Wees kritisch op eigen conclusies: prominent merk is niet automatisch sterk design; één voorbeeld is geen regel; clichés zijn geen best practice; benoem de drie zwakste/onzekerste conclusies expliciet.\n8. Werk vanuit first principles, solid but simple en zonder overengineering.\n\nEINDOUTPUT\nJe allerlaatste bericht moet uitsluitend het definitieve Markdown-document bevatten, zonder inleiding, toelichting of code fence. Gebruik exact deze structuur en headings:\n\n---\nsector_key: ${canonicalKey}\nresearch_label: <menselijk leesbare sectornaam>\nmarket: Nederland\nresearched_at: <YYYY-MM-DD>\nmethod_version: 1\n---\n# Sector Design Intelligence — <label>\n\n## Quality bar\n## Customer / market context relevant to design\n## Strong recurring patterns\n### Hero\n### Typography\n### Imagery\n### Trust\n### Services / offering\n### Conversion\n### Mobile\n## Creative opportunities\n## Patterns to avoid\n## Sector references\n## Adjacent creative references\n## Principles distilled from the evidence\n## Weak / uncertain conclusions\n\nElke genoemde referentie bevat een directe bron-URL en een korte reden voor selectie. Publiceer zelf niets en voer geen repository-, branch- of PR-acties uit. Alleen het definitieve Markdown-resultaat is nodig.`;
  }

  async function publishSectorIntelligence(sector, markdown) {
    const token = await accessToken();
    const response = await fetch('/api/publish-sector-intelligence', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        canonical_sector_key: sector.canonicalKey,
        markdown
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Onderzoeksresultaat kon niet worden verwerkt (${response.status}).`);
    return payload;
  }

  function currentResearchInputs() {
    return {
      location: document.getElementById('discoveryLocation')?.value.trim() || '',
      sectorValue: document.getElementById('discoveryKeywords')?.value.trim() || ''
    };
  }

  async function resolveResearchContext() {
    const { location, sectorValue } = currentResearchInputs();
    if (!location) throw new Error('Vul eerst een locatie in voor het sectoronderzoek.');
    if (!sectorValue) throw new Error('Vul eerst één sector in voor het sectoronderzoek.');
    return {
      location,
      ...(await resolveSingleSector(sectorValue))
    };
  }

  function installSectorIntelligenceLauncher() {
    if (document.getElementById('startSectorIntelligence')) return;
    const discoveryButton = document.getElementById('runAreaDiscovery');
    const discoveryAction = discoveryButton?.closest('.discovery-action');
    if (!discoveryAction) return;

    const startAction = document.createElement('div');
    startAction.className = 'discovery-action';
    const startNote = document.createElement('span');
    startNote.className = 'subtle';
    startNote.innerHTML = '<strong>Sectorinzichten:</strong> laat ChatGPT voor één sector sterke websites onderzoeken en herbruikbare designinzichten opbouwen.';
    const startButton = document.createElement('button');
    startButton.id = 'startSectorIntelligence';
    startButton.type = 'button';
    startButton.className = 'secondary';
    startButton.textContent = 'Start sectoronderzoek in ChatGPT';
    startAction.append(startNote, startButton);

    const processAction = document.createElement('div');
    processAction.className = 'discovery-action';
    const processNote = document.createElement('span');
    processNote.className = 'subtle';
    processNote.textContent = 'Onderzoek klaar? Kopieer het definitieve antwoord in ChatGPT en verwerk het hier.';
    const processButton = document.createElement('button');
    processButton.id = 'processSectorIntelligence';
    processButton.type = 'button';
    processButton.className = 'secondary';
    processButton.textContent = 'Verwerk onderzoeksresultaat';
    processAction.append(processNote, processButton);

    const fallback = document.createElement('div');
    fallback.id = 'sectorIntelligencePasteFallback';
    fallback.hidden = true;
    fallback.className = 'card';
    fallback.innerHTML = `
      <label>Onderzoeksresultaat
        <textarea id="sectorIntelligenceResult" rows="10" placeholder="Plak hier alleen het definitieve Markdown-resultaat uit ChatGPT."></textarea>
      </label>
      <div class="discovery-action">
        <span class="subtle">Gebruik dit plakveld alleen als de browser het klembord niet kan lezen.</span>
        <button id="submitSectorIntelligenceResult" type="button" class="secondary">Verwerk geplakte tekst</button>
      </div>`;

    discoveryAction.insertAdjacentElement('afterend', startAction);
    startAction.insertAdjacentElement('afterend', processAction);
    processAction.insertAdjacentElement('afterend', fallback);

    startButton.addEventListener('click', async () => {
      const popup = window.open('about:blank', '_blank');
      if (popup) popup.opener = null;
      startButton.disabled = true;
      setMessage('Sectoronderzoek voor ChatGPT voorbereiden…');
      try {
        const context = await resolveResearchContext();
        const prompt = sectorIntelligencePrompt(context);
        await navigator.clipboard.writeText(prompt);
        if (popup) popup.location = 'https://chatgpt.com/';
        else window.open('https://chatgpt.com/', '_blank', 'noopener');
        setMessage(`Onderzoeksopdracht voor “${context.humanTerm}” in ${context.location} gekopieerd. Plak hem in een nieuwe ChatGPT-chat.`);
      } catch (error) {
        if (popup) popup.close();
        setMessage(error.message || String(error), true);
      } finally {
        startButton.disabled = false;
      }
    });

    async function submitResult(markdown, button) {
      if (!String(markdown || '').trim()) throw new Error('Het onderzoeksresultaat is leeg.');
      button.disabled = true;
      setMessage('Onderzoeksresultaat controleren en opslaan voor review…');
      try {
        const context = await resolveResearchContext();
        const result = await publishSectorIntelligence(context, markdown);
        fallback.hidden = true;
        document.getElementById('sectorIntelligenceResult').value = '';
        if (result.status === 'unchanged') {
          setMessage(`De sectorinzichten voor “${context.humanTerm}” zijn al actueel; er is geen nieuwe review aangemaakt.`);
        } else {
          setMessage(`Sectorinzichten voor “${context.humanTerm}” zijn opgeslagen voor review.`);
        }
      } finally {
        button.disabled = false;
      }
    }

    processButton.addEventListener('click', async () => {
      processButton.disabled = true;
      try {
        let markdown = '';
        try {
          markdown = await navigator.clipboard.readText();
        } catch {
          fallback.hidden = false;
          document.getElementById('sectorIntelligenceResult').focus();
          setMessage('De browser kon het klembord niet lezen. Plak het definitieve onderzoeksresultaat hieronder.', true);
          return;
        }
        await submitResult(markdown, processButton);
      } catch (error) {
        setMessage(error.message || String(error), true);
      } finally {
        processButton.disabled = false;
      }
    });

    const submitFallback = fallback.querySelector('#submitSectorIntelligenceResult');
    submitFallback.addEventListener('click', async () => {
      try {
        const markdown = fallback.querySelector('#sectorIntelligenceResult').value;
        await submitResult(markdown, submitFallback);
      } catch (error) {
        setMessage(error.message || String(error), true);
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
