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
    const card = root.querySelector('[data-design-process]');
    if (!card) return;

    const sectors = await publishedSectors();
    if (!root.isConnected) return;

    root.querySelector('[data-prospect-sector-control]')?.remove();

    const currentKey = String(prospect.canonical_sector_key || '').trim().toLowerCase();
    const currentPublished = sectors.find((row) => row.canonical_sector_key === currentKey) || null;
    const currentLabel = currentPublished?.research_label || humanizeKey(currentKey);

    const control = document.createElement('div');
    control.dataset.prospectSectorControl = 'true';
    control.className = 'form-grid';

    const label = document.createElement('label');
    label.append('Sector voor design ');
    const optional = document.createElement('span');
    optional.className = 'subtle';
    optional.textContent = '(optioneel aanpassen)';
    label.appendChild(optional);

    const select = document.createElement('select');
    select.dataset.prospectSectorSelect = 'true';

    if (currentKey) {
      const current = document.createElement('option');
      current.value = currentKey;
      current.textContent = `${currentLabel}${currentPublished ? ' · gepubliceerd onderzoek' : ' · gekoppelde sector'}`;
      current.selected = true;
      select.appendChild(current);
    } else {
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Geen sector gekoppeld';
      empty.selected = true;
      select.appendChild(empty);
    }

    for (const row of sectors) {
      if (row.canonical_sector_key === currentKey) continue;
      const option = document.createElement('option');
      option.value = row.canonical_sector_key;
      option.textContent = row.research_label || humanizeKey(row.canonical_sector_key);
      select.appendChild(option);
    }
    label.appendChild(select);

    const side = document.createElement('div');
    const status = document.createElement('span');
    status.className = 'subtle';
    status.dataset.prospectSectorStatus = 'true';
    status.textContent = currentPublished
      ? `${currentLabel} · gepubliceerd onderzoek beschikbaar`
      : `${currentLabel} · ${sectors.length ? 'kies optioneel een sector met gepubliceerd onderzoek' : 'nog geen gepubliceerd sectoronderzoek beschikbaar'}`;

    const actions = document.createElement('div');
    actions.className = 'compact-actions';
    const research = document.createElement('button');
    research.type = 'button';
    research.className = 'secondary';
    research.textContent = 'Sectoronderzoek';
    actions.appendChild(research);
    side.append(status, actions);
    control.append(label, side);

    const intro = card.querySelector(':scope > p.subtle');
    if (intro) intro.insertAdjacentElement('afterend', control);
    else card.prepend(control);

    select.addEventListener('change', async () => {
      const selectedKey = select.value;
      if (!selectedKey || selectedKey === prospect.canonical_sector_key) return;

      const previousKey = prospect.canonical_sector_key || '';
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
        window.dispatchEvent(new CustomEvent('soliddesign:prospect-sector-changed', {
          detail: { prospectId: prospect.id, canonicalSectorKey: selectedKey }
        }));
      } catch (error) {
        window.alert(error.message || String(error));
        select.value = previousKey;
        status.textContent = currentPublished
          ? `${currentLabel} · gepubliceerd onderzoek beschikbaar`
          : `${currentLabel} · gekoppelde sector`;
      } finally {
        select.disabled = false;
      }
    });

    research.addEventListener('click', () => {
      const selectedKey = select.value || prospect.canonical_sector_key;
      const selectedRow = sectors.find((row) => row.canonical_sector_key === selectedKey) || null;
      openSectorResearch({ ...prospect, canonical_sector_key: selectedKey }, selectedRow);
    });
  }

  async function syncCurrentDetail(force = false) {
    const root = detailPanel.querySelector('.detail-content');
    if (!root || root.dataset.designDetailUiBusy === 'true') return;
    if (!force && root.dataset.designDetailUiBound === 'true') return;

    root.dataset.designDetailUiBusy = 'true';
    try {
      const prospect = await resolveProspect(root);
      if (!root.isConnected || !prospect) return;
      await installNewestDesignLink(root, prospect);
      await installSectorSelector(root, prospect);
      root.dataset.designDetailUiBound = 'true';
    } catch (error) {
      console.error('SolidDesign design detail UI failed', error);
    } finally {
      delete root.dataset.designDetailUiBusy;
    }
  }

  const observer = new MutationObserver(() => syncCurrentDetail());
  observer.observe(detailPanel, { childList: true });

  window.addEventListener('soliddesign:sector-intelligence-changed', () => {
    publishedSectorPromise = null;
    syncCurrentDetail(true);
  });
  window.addEventListener('soliddesign:prospect-sector-changed', () => syncCurrentDetail(true));

  syncCurrentDetail();
})();
