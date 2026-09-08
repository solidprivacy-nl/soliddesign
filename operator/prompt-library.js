(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  const prompts = window.SOLIDDESIGN_PROMPTS;
  if (!CONFIG?.supabaseUrl || !window.supabase || !prompts) return;

  if (!document.querySelector('link[data-prompt-library-style]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = './prompt-library.css';
    stylesheet.dataset.promptLibraryStyle = 'true';
    document.head.appendChild(stylesheet);
  }

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const appView = document.getElementById('appView');
  const nav = appView?.querySelector('.main-nav');
  const prospectsView = document.getElementById('prospectsView');
  const discoveryView = document.getElementById('discoveryView');
  if (!appView || !nav || !prospectsView || !discoveryView) return;

  let rows = [];
  let canManage = false;
  let editing = null;

  function escapeAttr(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om de Promptbibliotheek te gebruiken.');
    return session;
  }

  async function api({ method = 'GET', query = '', body = null } = {}) {
    const session = await sessionOrThrow();
    const response = await fetch(`/api/prompt-library${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Promptbibliotheek kon niet worden verwerkt (${response.status}).`);
    return payload;
  }

  const promptNav = document.createElement('button');
  promptNav.id = 'promptLibraryNav';
  promptNav.type = 'button';
  promptNav.className = 'nav-button';
  promptNav.textContent = 'Prompts';
  const sectorNav = document.getElementById('sectorIntelligenceNav');
  (sectorNav || document.getElementById('discoveryNav')).insertAdjacentElement('beforebegin', promptNav);

  const view = document.createElement('main');
  view.id = 'promptLibraryView';
  view.className = 'prompt-library-layout hidden';
  view.innerHTML = `
    <section class="prompt-library-head">
      <div>
        <div class="eyebrow">Herbruikbare ChatGPT-methodes</div>
        <h1>Promptbibliotheek</h1>
        <p class="subtle">Vul alleen de context voor deze opdracht in. De achterliggende SolidDesign-prompt blijft centraal beheerd.</p>
      </div>
      <button id="newPromptLibraryItem" type="button" class="primary" hidden>Nieuwe prompt</button>
    </section>
    <section class="card">
      <div class="filters"><input id="promptLibrarySearch" type="search" placeholder="Zoek prompt" /></div>
      <div id="promptLibraryList" class="prompt-library-grid"></div>
    </section>
    <section id="promptLibraryEditor" class="card" hidden></section>
    <p id="promptLibraryMessage" class="message" aria-live="polite"></p>`;
  appView.appendChild(view);

  const list = document.getElementById('promptLibraryList');
  const editor = document.getElementById('promptLibraryEditor');
  const message = document.getElementById('promptLibraryMessage');
  const newButton = document.getElementById('newPromptLibraryItem');
  const search = document.getElementById('promptLibrarySearch');

  function setMessage(text, error = false) {
    message.textContent = text || '';
    message.classList.toggle('error', Boolean(error));
  }

  function leaveView() {
    view.classList.add('hidden');
    promptNav.classList.remove('active');
  }

  async function showView() {
    for (const main of appView.querySelectorAll('main')) main.classList.add('hidden');
    nav.querySelectorAll('.nav-button').forEach((button) => button.classList.remove('active'));
    view.classList.remove('hidden');
    promptNav.classList.add('active');
    await refresh();
  }

  nav.addEventListener('click', (event) => {
    if (event.target !== promptNav && event.target.closest('.nav-button')) leaveView();
  }, true);
  promptNav.addEventListener('click', () => showView().catch((error) => setMessage(error.message || String(error), true)));

  async function refresh() {
    setMessage('Prompts laden…');
    const payload = await api();
    rows = Array.isArray(payload.prompts) ? payload.prompts : [];
    canManage = payload.can_manage === true;
    newButton.hidden = !canManage;
    renderList();
    setMessage('');
  }

  function fieldControl(field) {
    const input = field.control === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (field.control !== 'textarea') input.type = field.control === 'url' ? 'url' : 'text';
    input.placeholder = field.placeholder || '';
    input.dataset.promptField = field.key;
    if (field.required) input.required = true;
    return input;
  }

  function renderCard(row) {
    const card = document.createElement('article');
    card.className = 'card prompt-card';
    const category = document.createElement('div');
    category.className = 'prompt-category';
    category.textContent = row.category;
    const title = document.createElement('h3');
    title.textContent = row.title;
    const description = document.createElement('p');
    description.className = 'subtle';
    description.textContent = row.description;
    const fields = document.createElement('div');
    fields.className = 'prompt-fields';
    for (const field of row.invocation?.fields || []) {
      const label = document.createElement('label');
      label.textContent = `${field.label}${field.required ? ' *' : ''}`;
      label.appendChild(fieldControl(field));
      fields.appendChild(label);
    }
    const actions = document.createElement('div');
    actions.className = 'prompt-card-actions';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'primary';
    copy.textContent = 'Kopieer voor ChatGPT';
    copy.addEventListener('click', async () => {
      copy.disabled = true;
      try {
        const values = {};
        for (const input of card.querySelectorAll('[data-prompt-field]')) values[input.dataset.promptField] = input.value;
        for (const field of row.invocation?.fields || []) {
          if (field.required && !String(values[field.key] || '').trim()) throw new Error(`Vul eerst “${field.label}” in.`);
        }
        await prompts.writeClipboard(prompts.render(row, values));
        setMessage(`“${row.title}” is gekopieerd voor ChatGPT.`);
      } catch (error) {
        setMessage(error.message || String(error), true);
      } finally {
        copy.disabled = false;
      }
    });
    actions.appendChild(copy);
    if (canManage) {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'secondary';
      edit.textContent = 'Bewerken';
      edit.addEventListener('click', () => openEditor(row.slug).catch((error) => setMessage(error.message || String(error), true)));
      actions.appendChild(edit);
    }
    card.append(category, title, description, fields, actions);
    return card;
  }

  function renderList() {
    const q = search.value.trim().toLowerCase();
    const filtered = rows.filter((row) => !q || `${row.title} ${row.description} ${row.category}`.toLowerCase().includes(q));
    list.replaceChildren(...filtered.map(renderCard));
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'prompt-empty';
      empty.textContent = q ? 'Geen prompts gevonden.' : 'Nog geen operatorprompts beschikbaar.';
      list.appendChild(empty);
    }
  }

  function emptyPrompt() {
    return {
      slug: '', sha: null, title: '', category: '', description: '', body: '',
      invocation: { intro: 'Lees en volg deze SolidDesign-prompt volledig:', fields: [] }
    };
  }

  function editorFieldRow(field = {}) {
    const row = document.createElement('div');
    row.className = 'prompt-field-editor';
    row.innerHTML = `
      <label>Key<input data-field-key maxlength="40" value="${escapeAttr(field.key || '')}"></label>
      <label>Label<input data-field-label maxlength="80" value="${escapeAttr(field.label || '')}"></label>
      <label>Type<select data-field-control><option value="text">Tekst</option><option value="url">URL</option><option value="textarea">Lange tekst</option></select></label>
      <label class="field-wide">Placeholder<input data-field-placeholder maxlength="240" value="${escapeAttr(field.placeholder || '')}"></label>
      <label>Verplicht<input data-field-required type="checkbox" ${field.required ? 'checked' : ''}></label>
      <button type="button" class="ghost" data-remove-field aria-label="Verwijder veld">×</button>`;
    row.querySelector('[data-field-control]').value = field.control || 'text';
    row.querySelector('[data-remove-field]').addEventListener('click', () => row.remove());
    return row;
  }

  function renderEditor() {
    const item = editing || emptyPrompt();
    editor.hidden = false;
    editor.innerHTML = `
      <div class="section-heading"><div><h3>${item.sha ? 'Prompt bewerken' : 'Nieuwe prompt'}</h3><p class="subtle">Alleen Admin kan de achterliggende promptinhoud zien of wijzigen.</p></div></div>
      <div class="prompt-editor">
        <div class="prompt-editor-grid">
          <label>Slug<input data-editor-slug maxlength="63" ${item.sha ? 'readonly' : ''}></label>
          <label>Titel<input data-editor-title maxlength="120"></label>
          <label>Categorie<input data-editor-category maxlength="80"></label>
          <label>Omschrijving<textarea data-editor-description rows="3" maxlength="500"></textarea></label>
        </div>
        <label>Invocation-intro<textarea data-editor-intro rows="2" maxlength="500"></textarea></label>
        <div><div class="section-heading"><h4>Invoervelden</h4><button data-add-field type="button" class="secondary">+ Invoerveld</button></div><div data-editor-fields class="prompt-fields"></div></div>
        <label>Promptinhoud<textarea data-editor-body rows="24"></textarea></label>
        <div class="prompt-editor-actions"><button data-cancel type="button" class="secondary">Annuleren</button>${item.sha ? '<button data-delete type="button" class="danger">Verwijderen</button>' : ''}<button data-save type="button" class="primary">Opslaan</button></div>
      </div>`;
    editor.querySelector('[data-editor-slug]').value = item.slug || '';
    editor.querySelector('[data-editor-title]').value = item.title || '';
    editor.querySelector('[data-editor-category]').value = item.category || '';
    editor.querySelector('[data-editor-description]').value = item.description || '';
    editor.querySelector('[data-editor-intro]').value = item.invocation?.intro || '';
    editor.querySelector('[data-editor-body]').value = item.body || '';
    const fields = editor.querySelector('[data-editor-fields]');
    for (const field of item.invocation?.fields || []) fields.appendChild(editorFieldRow(field));
    editor.querySelector('[data-add-field]').addEventListener('click', () => fields.appendChild(editorFieldRow()));
    editor.querySelector('[data-cancel]').addEventListener('click', closeEditor);
    editor.querySelector('[data-save]').addEventListener('click', saveEditor);
    editor.querySelector('[data-delete]')?.addEventListener('click', deleteEditor);
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openEditor(slug = null) {
    if (!canManage) throw new Error('Alleen een Admin kan prompts bewerken.');
    if (!slug) {
      editing = emptyPrompt();
      renderEditor();
      return;
    }
    setMessage('Prompt laden…');
    const payload = await api({ query: `?slug=${encodeURIComponent(slug)}&body=1` });
    editing = payload.prompt;
    renderEditor();
    setMessage('');
  }

  function closeEditor() {
    editing = null;
    editor.hidden = true;
    editor.replaceChildren();
  }

  function editorValue(selector) {
    return String(editor.querySelector(selector)?.value || '').trim();
  }

  function collectEditor() {
    const fields = [...editor.querySelectorAll('.prompt-field-editor')].map((row) => ({
      key: row.querySelector('[data-field-key]').value.trim(),
      label: row.querySelector('[data-field-label]').value.trim(),
      control: row.querySelector('[data-field-control]').value,
      placeholder: row.querySelector('[data-field-placeholder]').value.trim(),
      required: row.querySelector('[data-field-required]').checked
    }));
    return {
      slug: editorValue('[data-editor-slug]'),
      sha: editing?.sha || null,
      title: editorValue('[data-editor-title]'),
      category: editorValue('[data-editor-category]'),
      description: editorValue('[data-editor-description]'),
      invocation: { intro: editorValue('[data-editor-intro]'), fields },
      body: editorValue('[data-editor-body]')
    };
  }

  async function saveEditor(event) {
    const button = event.currentTarget;
    button.disabled = true;
    setMessage('Prompt opslaan…');
    try {
      await api({ method: 'POST', body: { action: 'save', ...collectEditor() } });
      closeEditor();
      await refresh();
      setMessage('Prompt opgeslagen. De Cloudflare-versie wordt via de normale deployment bijgewerkt.');
    } catch (error) {
      setMessage(error.message || String(error), true);
    } finally {
      button.disabled = false;
    }
  }

  async function deleteEditor(event) {
    if (!editing?.slug || !editing?.sha) return;
    if (!window.confirm(`Verwijder “${editing.title}”? Git bewaart de historie.`)) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await api({ method: 'POST', body: { action: 'delete', slug: editing.slug, sha: editing.sha } });
      closeEditor();
      await refresh();
      setMessage('Prompt verwijderd.');
    } catch (error) {
      setMessage(error.message || String(error), true);
      button.disabled = false;
    }
  }

  search.addEventListener('input', renderList);
  newButton.addEventListener('click', () => openEditor().catch((error) => setMessage(error.message || String(error), true)));
})();
