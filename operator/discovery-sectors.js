(() => {
  'use strict';

  // Canonical human-input -> Overture taxonomy mapping for manual discovery.
  // Keep this intentionally small. Add sectors only when SolidDesign actually uses them
  // and the Overture taxonomy code has been verified.
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

  function resolve(value) {
    const requested = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
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

  function showValidationError(unknown) {
    const message = document.getElementById('discoveryMessage');
    if (!message) return;
    const quoted = unknown.map((item) => `“${item}”`).join(', ');
    message.textContent = `${quoted} ${unknown.length === 1 ? 'is' : 'zijn'} nog niet gekoppeld aan een geldige Overture-sector. Gebruik een ondersteunde sector of voeg eerst een gecontroleerde mapping toe.`;
    message.classList.add('error');
  }

  // Validate and translate immediately before the existing discovery handler reads
  // the field. Restore the human-entered text in the next microtask so the UI stays Dutch.
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('#runAreaDiscovery');
    if (!button) return;

    const input = document.getElementById('discoveryKeywords');
    if (!input) return;

    const resolved = resolve(input.value);
    if (resolved.unknown.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showValidationError(resolved.unknown);
      return;
    }

    if (!resolved.codes.length) return;
    const original = input.value;
    input.value = resolved.codes.join(', ');
    queueMicrotask(() => { input.value = original; });
  }, true);

  window.SOLIDDESIGN_DISCOVERY_SECTORS = SECTORS;
  window.SOLIDDESIGN_RESOLVE_DISCOVERY_SECTORS = resolve;
})();
