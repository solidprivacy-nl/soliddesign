(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const detailPanel = document.getElementById('detailPanel');
  if (!detailPanel) return;

  let publishedSectorPromise = null;

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om deze actie uit te voeren.');
    return session;
  }

  async function publishedSectors() {
    if (!publishedSectorPromise) {
      publishedSectorPromise = (async () => {
        const session = await sessionOrThrow();
        const response = await fetch('/api/sector-intelligence', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `Sectoronderzoek kon niet worden geladen (${response.status}).`);
        return (Array.isArray(payload.sectors) ? payload.sectors : [])
          .filter((row) => row?.has_published)
          .sort((a, b) => String(a.research_label || a.canonical_sector_key).localeCompare(String(b.research_label || b.canonical_sector_key), 'nl'));
      })().catch((error) => {
        publishedSectorPromise = null;
        throw error;
      });
    }
    return publishedSectorPromise;
  }

  function humanizeKey(value) {
    const text = String(value || '').replaceAll('_', ' ').replaceAll('-', ' ').trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Geen sector gekoppeld';
  }

  async function resolveProspect(root) {
    const name = root.querySelector('[data-field="name"]')?.textContent?.trim() || '';
    const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim() || '';
    if (!name || !website || website === '—') return null;

    const { data, error } = await db
      .from('prospects')
      .select('id,name,website_url,city,canonical_sector_key')
      .eq('name', name)
      .eq('website_url', website)
      .limit(2);
    if (error) throw error;
    return Array.isArray(data) && data.length === 1 ? data[0] : null;
  }

  async function installNewestDesignLink(root, prospect) {
    const link = root.querySelector('[data-link="preview"]');
    if (!link || !prospect) return;

    const { data, error } = await db
      .from('demos')
      .select('id,preview_url,status,created_at')
      .eq('prospect_id', prospect.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;

    const newest = Array.isArray(data) ? data[0] : null;
    if (!newest?.preview_url) {
      link.classList.add('hidden');
      link.setAttribute('aria-hidden', 'true');
      link.setAttribute('tabindex', '-1');
      link.removeAttribute('href');
      return;
    }

    link.href = newest.preview_url;
    link.textContent = 'Nieuwste ontwerp ↗';
    link.title = `Meest recente ontwerpversie · ${String(newest.status || 'CONCEPT').toUpperCase()}`;
    link.classList.remove('hidden', 'disabled');
    link.setAttribute('aria-hidden', 'false');
    link.removeAttribute('tabindex');
  }

  function openSectorResearch(prospect, row) {
    const open = window.SOLIDDESIGN_OPEN_SECTOR_INTELLIGENCE;
    if (typeof open !== 'function') return;
    open({
      sectorTerm: row?.research_label || '',
      canonicalKey: prospect.canonical_sector_key || '',
      location: prospect.city || '',
      targetId: prospect.id,
      focusResearch: true
    }).catch((error) => window.alert(error.message || String(error)));
  }

  async function installSectorSelector(root, prospect) {
    if (!prospect) return;
    const oldControl = root.querySelector('[data-prospect-sector-control]:not([data-design-sector-selector="true"])');
    if (!oldControl) return;

    const sectors = await publishedSectors();
    if (!root.isConnected || !oldControl.isConnected) return;

    const currentKey = String(prospect.canonical_sector_key || '').trim().toLowerCase();
    const currentPublished = sectors.find((row) => row.canonical_sector_key === currentKey) || null;

    const control = document.createElement('div');
    control.dataset.prospectSectorControl = 'true';
    control.dataset.designSectorSelector = 'true';
    control.className = 'form-grid';

    const label = document.createElement('label');
    label.append('Sector voor design ');
    const optional = document.createElement('span');
    optional.className = 'subtle';
    optional.textContent = '(optioneel)';
    label.appendChild(optional);

    const select = document.createElement('select');
    select.dataset.prospectSectorSelect = 'true';

    const automatic = document.createElement('option');
    automatic.value = '';
    automatic.textContent = `Automatisch gekoppeld · ${humanizeKey(currentKey)}`;
    select.appendChild(automatic);

    for (const row of sectors) {
      const option = document.createElement('option');
      option.value = row.canonical_sector_key;
      option.textContent = row.research_label || humanizeKey(row.canonical_sector_key);
      if (row.canonical_sector_key === currentKey) option.selected = true;
      select.appendChild(option);
    }
    label.appendChild(select);

    const side = document.createElement('div');
    const status = document.createElement('span');
    status.className = 'subtle';
    status.dataset.prospectSectorStatus = 'true';
    status.textContent = currentPublished
      ? `${currentPublished.research_label || humanizeKey(currentKey)} · gepubliceerd onderzoek beschikbaar`
      : `${humanizeKey(currentKey)} · automatisch gekoppeld${sectors.length ? ' · kies optioneel een gepubliceerd onderzoek' : ' · nog geen gepubliceerd onderzoek beschikbaar'}`;

    const actions = document.createElement('div');
    actions.className = 'compact-actions';
    const research = document.createElement('button');
    research.type = 'button';
    research.className = 'secondary';
    research.textContent = 'Sectoronderzoek';
    actions.appendChild(research);
    side.append(status, actions);
    control.append(label, side);

    oldControl.replaceWith(control);

    select.addEventListener('change', async () => {
      const selectedKey = select.value;
      if (!selectedKey) {
        select.value = currentPublished ? currentKey : '';
        return;
      }
      if (selectedKey === prospect.canonical_sector_key) return;

      select.disabled = true;
      status.textContent = 'Sector voor design opslaan…';
      try {
        const { data: changed, error } = await db.rpc('operator_set_prospect_sector', {
          p_id: prospect.id,
          p_sector_key: selectedKey
        });
        if (error) throw error;
        if (!changed) throw new Error('Sector voor design kon niet worden opgeslagen.');
        prospect.canonical_sector_key = selectedKey;
        const selectedRow = sectors.find((row) => row.canonical_sector_key === selectedKey);
        status.textContent = `${selectedRow?.research_label || humanizeKey(selectedKey)} · gepubliceerd onderzoek geselecteerd`;
      } catch (error) {
        window.alert(error.message || String(error));
        select.value = currentKey && sectors.some((row) => row.canonical_sector_key === currentKey) ? currentKey : '';
        status.textContent = currentPublished
          ? `${currentPublished.research_label || humanizeKey(currentKey)} · gepubliceerd onderzoek beschikbaar`
          : `${humanizeKey(currentKey)} · automatisch gekoppeld`;
      } finally {
        select.disabled = false;
      }
    });

    research.addEventListener('click', () => {
      const selectedRow = sectors.find((row) => row.canonical_sector_key === (select.value || prospect.canonical_sector_key));
      openSectorResearch(prospect, selectedRow);
    });
  }

  async function syncCurrentDetail() {
    const root = detailPanel.querySelector('.detail-content');
    if (!root || root.dataset.designUiPreviewBusy === 'true') return;

    const needsSectorSelector = Boolean(root.querySelector('[data-prospect-sector-control]:not([data-design-sector-selector="true"])'));
    const newestLink = root.querySelector('[data-link="preview"]');
    const needsNewestLink = Boolean(newestLink && newestLink.dataset.newestDesignBound !== 'true');
    if (!needsSectorSelector && !needsNewestLink) return;

    root.dataset.designUiPreviewBusy = 'true';
    try {
      const prospect = await resolveProspect(root);
      if (!root.isConnected || !prospect) return;
      if (needsNewestLink) {
        await installNewestDesignLink(root, prospect);
        if (newestLink) newestLink.dataset.newestDesignBound = 'true';
      }
      if (needsSectorSelector) await installSectorSelector(root, prospect);
    } catch (error) {
      console.error('SolidDesign design UI refinement failed', error);
    } finally {
      delete root.dataset.designUiPreviewBusy;
    }
  }

  const observer = new MutationObserver(() => syncCurrentDetail());
  observer.observe(detailPanel, { childList: true, subtree: true });
  syncCurrentDetail();
})();
