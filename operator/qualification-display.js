(() => {
  'use strict';

  const panel = document.getElementById('detailPanel');
  if (!panel) return;

  function reconcile() {
    const value = panel.querySelector('[data-field="qualification"]');
    if (!value) return;
    const scale = value.parentElement?.querySelector('small');
    const text = String(value.textContent || '').trim();
    const hasFullScore = /^\d+(?:\.\d+)?$/.test(text);
    if (!hasFullScore) {
      if (text !== 'Nog niet uitgevoerd') value.textContent = 'Nog niet uitgevoerd';
      if (scale && !scale.hidden) scale.hidden = true;
      return;
    }
    if (scale) {
      if (scale.textContent !== '/ 25') scale.textContent = '/ 25';
      if (scale.hidden) scale.hidden = false;
    }
  }

  new MutationObserver(reconcile).observe(panel, { childList: true, subtree: true, characterData: true });
  reconcile();
})();
