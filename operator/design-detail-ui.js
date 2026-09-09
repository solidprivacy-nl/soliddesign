(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const detailPanel = document.getElementById('detailPanel');
  if (!detailPanel) return;

  async function resolveProspect(root) {
    const name = root.querySelector('[data-field="name"]')?.textContent?.trim() || '';
    const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim() || '';
    if (!name || !website || website === '—') return null;

    const { data, error } = await db
      .from('prospects')
      .select('id,name,website_url')
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

  async function syncCurrentDetail() {
    const root = detailPanel.querySelector('.detail-content');
    if (!root || root.dataset.designDetailUiBusy === 'true' || root.dataset.designDetailUiBound === 'true') return;

    root.dataset.designDetailUiBusy = 'true';
    try {
      const prospect = await resolveProspect(root);
      if (!root.isConnected || !prospect) return;
      await installNewestDesignLink(root, prospect);
      root.dataset.designDetailUiBound = 'true';
    } catch (error) {
      console.error('SolidDesign design detail UI failed', error);
    } finally {
      delete root.dataset.designDetailUiBusy;
    }
  }

  new MutationObserver(syncCurrentDetail).observe(detailPanel, { childList: true });
  syncCurrentDetail();
})();
