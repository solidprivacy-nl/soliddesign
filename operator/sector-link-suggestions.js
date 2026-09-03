(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  const input = document.getElementById('sectorLinkTerm');
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase || !input) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const list = document.createElement('datalist');
  list.id = 'sectorLinkOptions';
  document.body.appendChild(list);

  input.setAttribute('list', list.id);
  input.placeholder = 'Kies een bekende sector of typ een nieuwe';

  let sectorRows = [];
  let loadingPromise = null;

  function statusLabel(value) {
    return ({
      AVAILABLE: 'Beschikbaar',
      PENDING_REVIEW: 'Ter beoordeling',
      UPDATE_PENDING_REVIEW: 'Bijwerking ter beoordeling'
    })[value] || value || 'Onbekend';
  }

  function matchingRow(value) {
    const normalized = String(value || '').trim().toLocaleLowerCase('nl');
    if (!normalized) return null;
    return sectorRows.find((row) => String(row.research_label || '').trim().toLocaleLowerCase('nl') === normalized) || null;
  }

  function syncCanonicalKey() {
    const row = matchingRow(input.value);
    if (row?.canonical_sector_key) {
      input.dataset.canonicalKey = row.canonical_sector_key;
      input.dataset.preserveCanonicalKey = 'false';
    }
  }

  function renderOptions() {
    list.innerHTML = '';
    const rows = [...sectorRows].sort((a, b) =>
      String(a.research_label || a.canonical_sector_key).localeCompare(
        String(b.research_label || b.canonical_sector_key),
        'nl'
      )
    );

    for (const row of rows) {
      if (!row?.research_label || !row?.canonical_sector_key) continue;
      const option = document.createElement('option');
      option.value = row.research_label;
      option.label = statusLabel(row.status);
      list.appendChild(option);
    }
  }

  async function loadOptions() {
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async () => {
      const { data: { session } } = await db.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/sector-intelligence', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Sectoren konden niet worden geladen (${response.status}).`);

      sectorRows = Array.isArray(payload.sectors) ? payload.sectors : [];
      renderOptions();
      syncCanonicalKey();
    })().catch((error) => {
      console.error('SolidDesign sector suggestions failed', error);
    }).finally(() => {
      loadingPromise = null;
    });
    return loadingPromise;
  }

  input.addEventListener('focus', () => loadOptions());
  input.addEventListener('input', syncCanonicalKey);
  window.addEventListener('soliddesign:sector-intelligence-changed', () => loadOptions());
})();
