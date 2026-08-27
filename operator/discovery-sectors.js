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
    bakery: ['bakery']
  });

  const canonicalCodes = new Set(Object.values(SECTORS).flat());
  let authClient = null;

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
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
      const dynamic = await resolveUnknown(known.unknown);
      const unresolved = Array.isArray(dynamic.unresolved) ? dynamic.unresolved : [];
      if (unresolved.length) {
        const quoted = unresolved.map((item) => `“${item}”`).join(', ');
        throw new Error(`${quoted} kon niet betrouwbaar aan een geldige Overture-sector worden gekoppeld.`);
      }

      const codes = [...known.codes];
      for (const item of Array.isArray(dynamic.resolutions) ? dynamic.resolutions : []) {
        const code = normalize(item?.code);
        if (code && !codes.includes(code)) codes.push(code);
      }
      if (!codes.length) throw new Error('Geen geldige Overture-sector gevonden.');

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
})();
