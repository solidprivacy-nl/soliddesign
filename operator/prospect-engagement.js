(() => {
  'use strict';
  if (window.__SOLIDDESIGN_PROSPECT_ENGAGEMENT__) return;
  window.__SOLIDDESIGN_PROSPECT_ENGAGEMENT__ = true;

  const script = document.currentScript || document.getElementById('soliddesignProspectEngagement');
  const slug = script?.dataset?.slug;
  const endpoint = script?.dataset?.endpoint;
  if (!slug || !endpoint) return;

  const url = new URL(window.location.href);
  const source = url.searchParams.get('src') === 'qr' ? 'QR' : 'DIRECT';
  const internal = url.searchParams.get('__internal') === '1';
  if (url.searchParams.has('src') || url.searchParams.has('__internal')) {
    url.searchParams.delete('src');
    url.searchParams.delete('__internal');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  const viewport = Math.max(window.screen?.width || 0, window.innerWidth || 0);
  const deviceType = viewport <= 767 ? 'MOBILE' : viewport <= 1100 ? 'TABLET' : 'DESKTOP';
  let visitId = null;
  let visitToken = null;
  let activeMs = 0;
  let visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
  let maxScroll = 0;
  let started = false;
  let starting = false;

  function accrueVisibleTime() {
    if (visibleSince !== null) {
      const now = Date.now();
      activeMs += Math.max(0, now - visibleSince);
      visibleSince = document.visibilityState === 'visible' ? now : null;
    }
  }

  function measureScroll() {
    const doc = document.documentElement;
    const scrollable = Math.max(0, doc.scrollHeight - window.innerHeight);
    const pct = scrollable === 0 ? 100 : Math.round((Math.max(0, window.scrollY) / scrollable) * 100);
    maxScroll = Math.max(maxScroll, Math.min(100, pct));
  }

  async function post(body, keepalive = false) {
    try {
      return await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive,
        credentials: 'omit',
        cache: 'no-store'
      });
    } catch {
      return null;
    }
  }

  async function start() {
    if (started || starting || document.visibilityState !== 'visible') return;
    starting = true;
    const response = await post({ action: 'start', slug, source, device_type: deviceType, internal });
    starting = false;
    if (!response?.ok) return;
    const data = await response.json().catch(() => null);
    if (!data?.visit_id || !data?.token) return;
    visitId = data.visit_id;
    visitToken = data.token;
    started = true;
    visibleSince = Date.now();
    measureScroll();
  }

  async function flush(keepalive = false) {
    if (!started || !visitId || !visitToken) return;
    accrueVisibleTime();
    measureScroll();
    await post({
      action: 'update',
      visit_id: visitId,
      token: visitToken,
      active_seconds: Math.min(43200, Math.floor(activeMs / 1000)),
      max_scroll_pct: maxScroll
    }, keepalive);
  }

  window.addEventListener('scroll', measureScroll, { passive: true });
  document.addEventListener('visibilitychange', () => {
    accrueVisibleTime();
    if (document.visibilityState === 'visible') {
      visibleSince = Date.now();
      if (!started) window.setTimeout(start, 1000);
    } else {
      flush(true);
    }
  });
  window.addEventListener('pagehide', () => { flush(true); });

  window.setInterval(() => { if (document.visibilityState === 'visible') flush(); }, 15000);
  measureScroll();
  if (document.visibilityState === 'visible') window.setTimeout(start, 1000);
})();
