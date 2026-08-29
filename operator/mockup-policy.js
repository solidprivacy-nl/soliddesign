(() => {
  'use strict';

  function applyPolicy(root = document) {
    root.querySelectorAll?.('.version-row').forEach((row) => {
      const meta = row.querySelector('.version-meta')?.textContent || '';
      const status = row.querySelector('.version-status')?.textContent || '';
      const promote = [...row.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Publiceer live');
      if (!promote || !meta.includes('externe link') || status === 'LIVE') return;
      promote.disabled = true;
      promote.textContent = 'Upload nodig voor live';
      promote.title = 'Externe links zijn alleen voor conceptreview. Upload HTML of ZIP om deze versie via de publieke prospectlink LIVE te zetten.';
    });

    root.querySelectorAll?.('.mockup-external').forEach((box) => {
      if (box.querySelector('[data-external-preview-policy]')) return;
      const note = document.createElement('p');
      note.className = 'subtle';
      note.dataset.externalPreviewPolicy = 'true';
      note.textContent = 'Externe links zijn alleen voor conceptreview. Voor LIVE publicatie via de prospectlink is een HTML- of ZIP-upload nodig.';
      box.appendChild(note);
    });
  }

  applyPolicy();
  new MutationObserver(() => applyPolicy()).observe(document.body, { childList: true, subtree: true });
})();
