const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);

const BUCKET = 'mailing-artifacts';
const MAX_BYTES = 25 * 1024 * 1024;
const MIME_BY_EXTENSION = Object.freeze({
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg'
});

function addStylesheet() {
  if (document.querySelector('link[data-mailing-artifacts-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './mailing-artifacts.css';
  link.dataset.mailingArtifactsStyle = 'true';
  document.head.appendChild(link);
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function fileTypeLabel(contentType) {
  return ({
    'application/pdf': 'PDF',
    'image/png': 'PNG',
    'image/jpeg': 'JPG'
  })[contentType] || 'Bestand';
}

function normalizedContentType(file) {
  if (['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) return file.type;
  const extension = String(file.name || '').split('.').pop()?.toLowerCase();
  return MIME_BY_EXTENSION[extension] || '';
}

function storageExtension(contentType) {
  return ({ 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' })[contentType];
}

async function selectedProspect(root) {
  const name = root.querySelector('[data-field="name"]')?.textContent?.trim();
  const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim();
  if (!name || !website || website === '—') return null;
  const { data, error } = await db.from('prospects').select('id,name').eq('name', name).eq('website_url', website).limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0] : null;
}

async function loadState(prospectId) {
  const [artifactResult, mailingResult] = await Promise.all([
    db.from('mailing_artifacts')
      .select('id,prospect_id,storage_path,file_name,content_type,size_bytes,version_note,created_by,created_at')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: true }),
    db.from('mailings')
      .select('id,prospect_id,demo_id,artifact_id,status,mailed_at,created_at')
      .eq('prospect_id', prospectId)
      .order('mailed_at', { ascending: false })
  ]);
  if (artifactResult.error) throw artifactResult.error;
  if (mailingResult.error) throw mailingResult.error;
  return {
    artifacts: artifactResult.data || [],
    mailings: mailingResult.data || []
  };
}

function buildVersionMap(artifacts) {
  return new Map(artifacts.map((artifact, index) => [artifact.id, index + 1]));
}

async function openArtifact(artifact) {
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(artifact.storage_path, 300);
  if (error) throw error;
  const popup = window.open(data.signedUrl, '_blank', 'noopener');
  if (!popup) window.location.assign(data.signedUrl);
}

function designCard() {
  const card = document.createElement('section');
  card.className = 'card mailing-artifacts-card';
  card.dataset.mailingDesign = 'true';
  card.innerHTML = `
    <div class="mailing-heading">
      <div>
        <h3>Printmailing</h3>
        <p class="subtle">Bewaar iedere ontwerpversie. Een nieuwe upload maakt een nieuwe versie; bestaande versies worden niet overschreven.</p>
      </div>
    </div>
    <div class="mailing-upload-grid">
      <label>Nieuwe versie
        <input data-mailing-file type="file" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" />
      </label>
      <label>Wat is gewijzigd?
        <input data-mailing-note type="text" maxlength="500" placeholder="Bijv. QR, prijsblok en CTA aangepast" />
      </label>
    </div>
    <div class="mailing-action-row">
      <p class="subtle">PDF is aanbevolen voor de definitieve drukversie; PNG/JPG kan voor concepten. Maximaal 25 MB.</p>
      <button type="button" class="primary" data-mailing-upload>Upload nieuwe versie</button>
    </div>
    <p class="message" data-mailing-message aria-live="polite"></p>
    <div class="version-heading"><h4>Versies</h4><span class="subtle" data-mailing-version-count></span></div>
    <div class="mailing-version-list" data-mailing-version-list></div>`;
  return card;
}

function outreachCard() {
  const card = document.createElement('section');
  card.className = 'card mailing-send-card';
  card.dataset.mailingOutreach = 'true';
  card.innerHTML = `
    <h3>Fysieke mailing</h3>
    <p class="subtle">Kies de exacte ontwerpversie die fysiek de deur uitgaat. De verzending wordt daarna onveranderlijk aan die versie gekoppeld.</p>
    <div class="mailing-send-controls">
      <label>Te versturen versie
        <select data-mailing-select></select>
      </label>
      <div class="mailing-send-actions">
        <button type="button" class="secondary" data-mailing-open>Open bestand</button>
        <button type="button" class="primary" data-mailing-sent>Registreer als verstuurd</button>
      </div>
    </div>
    <p class="message" data-mailing-send-message aria-live="polite"></p>
    <div class="version-heading"><h4>Verzendhistorie</h4></div>
    <div class="mailing-history" data-mailing-history></div>`;
  return card;
}

function setMessage(node, text, isError = false) {
  if (!node) return;
  node.textContent = text || '';
  node.classList.toggle('error', Boolean(isError));
}

function renderDesign(card, state) {
  const versions = buildVersionMap(state.artifacts);
  const sentByArtifact = new Map();
  for (const mailing of state.mailings) {
    if (!sentByArtifact.has(mailing.artifact_id)) sentByArtifact.set(mailing.artifact_id, mailing);
  }

  card.querySelector('[data-mailing-version-count]').textContent = `${state.artifacts.length} versie${state.artifacts.length === 1 ? '' : 's'}`;
  const list = card.querySelector('[data-mailing-version-list]');
  list.replaceChildren();
  if (!state.artifacts.length) {
    list.innerHTML = '<p class="subtle">Nog geen printmailing opgeslagen.</p>';
    return;
  }

  [...state.artifacts].reverse().forEach((artifact) => {
    const row = document.createElement('div');
    row.className = 'mailing-version-row';
    const sent = sentByArtifact.get(artifact.id);
    row.innerHTML = `
      <div class="mailing-version-main">
        <div class="mailing-version-title"><strong></strong><span class="mailing-file-meta"></span></div>
        <div class="version-meta" data-version-date></div>
        <div class="version-note" data-version-note></div>
      </div>
      <div class="mailing-version-actions"></div>`;
    row.querySelector('strong').textContent = `v${versions.get(artifact.id)}`;
    row.querySelector('.mailing-file-meta').textContent = `${fileTypeLabel(artifact.content_type)} · ${formatBytes(artifact.size_bytes)}`;
    row.querySelector('[data-version-date]').textContent = formatDate(artifact.created_at);
    const note = row.querySelector('[data-version-note]');
    note.textContent = artifact.version_note || artifact.file_name;

    const actions = row.querySelector('.mailing-version-actions');
    if (sent) {
      const badge = document.createElement('span');
      badge.className = 'mailing-sent-badge';
      badge.textContent = `VERSTUURD · ${formatDate(sent.mailed_at)}`;
      actions.appendChild(badge);
    }
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'secondary';
    open.textContent = 'Open';
    open.addEventListener('click', () => openArtifact(artifact).catch((error) => setMessage(card.querySelector('[data-mailing-message]'), error.message || String(error), true)));
    actions.appendChild(open);
    list.appendChild(row);
  });
}

function renderOutreach(card, state) {
  const select = card.querySelector('[data-mailing-select]');
  const open = card.querySelector('[data-mailing-open]');
  const sent = card.querySelector('[data-mailing-sent]');
  const versions = buildVersionMap(state.artifacts);

  select.replaceChildren();
  if (!state.artifacts.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Eerst een versie uploaden in Design';
    select.appendChild(option);
    open.disabled = true;
    sent.disabled = true;
  } else {
    [...state.artifacts].reverse().forEach((artifact) => {
      const option = document.createElement('option');
      option.value = artifact.id;
      option.textContent = `v${versions.get(artifact.id)} · ${artifact.file_name}`;
      select.appendChild(option);
    });
    open.disabled = false;
    sent.disabled = false;
  }

  const history = card.querySelector('[data-mailing-history]');
  history.replaceChildren();
  if (!state.mailings.length) {
    history.innerHTML = '<p class="subtle">Nog niets als fysiek verstuurd geregistreerd.</p>';
  } else {
    state.mailings.forEach((mailing) => {
      const artifact = state.artifacts.find((item) => item.id === mailing.artifact_id);
      const row = document.createElement('div');
      row.className = 'mailing-history-row';
      row.innerHTML = '<div><strong></strong><span></span></div><button type="button" class="secondary">Open</button>';
      row.querySelector('strong').textContent = `${formatDate(mailing.mailed_at)} · v${versions.get(mailing.artifact_id) || '—'}`;
      row.querySelector('span').textContent = artifact?.file_name || 'Opgeslagen printmailing';
      const button = row.querySelector('button');
      button.disabled = !artifact;
      if (artifact) button.addEventListener('click', () => openArtifact(artifact).catch((error) => setMessage(card.querySelector('[data-mailing-send-message]'), error.message || String(error), true)));
      history.appendChild(row);
    });
  }
}

async function uploadVersion(prospectId, design, outreach, stateRef) {
  const input = design.querySelector('[data-mailing-file]');
  const note = design.querySelector('[data-mailing-note]');
  const button = design.querySelector('[data-mailing-upload]');
  const message = design.querySelector('[data-mailing-message]');
  const file = input.files?.[0];
  if (!file) return setMessage(message, 'Kies eerst een PDF-, PNG- of JPG-bestand.', true);

  const contentType = normalizedContentType(file);
  if (!contentType) return setMessage(message, 'Gebruik PDF, PNG of JPG.', true);
  if (!file.size || file.size > MAX_BYTES) return setMessage(message, 'Het bestand moet groter dan 0 en maximaal 25 MB zijn.', true);

  const artifactId = crypto.randomUUID();
  const extension = storageExtension(contentType);
  const storagePath = `prospects/${prospectId}/${artifactId}/artifact.${extension}`;
  button.disabled = true;
  setMessage(message, 'Versie uploaden…');

  try {
    const { error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, file, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { error: registerError } = await db.rpc('operator_register_mailing_artifact', {
      p_id: artifactId,
      p_prospect_id: prospectId,
      p_storage_path: storagePath,
      p_file_name: file.name,
      p_content_type: contentType,
      p_size_bytes: file.size,
      p_version_note: note.value.trim() || null
    });
    if (registerError) {
      await db.storage.from(BUCKET).remove([storagePath]);
      throw registerError;
    }

    input.value = '';
    note.value = '';
    setMessage(message, 'Nieuwe printmailingversie opgeslagen.');
    stateRef.value = await loadState(prospectId);
    renderDesign(design, stateRef.value);
    renderOutreach(outreach, stateRef.value);
  } catch (error) {
    setMessage(message, error.message || String(error), true);
  } finally {
    button.disabled = false;
  }
}

async function openSelected(outreach, state) {
  const id = outreach.querySelector('[data-mailing-select]').value;
  const artifact = state.artifacts.find((item) => item.id === id);
  if (!artifact) return;
  await openArtifact(artifact);
}

async function registerSent(prospectId, design, outreach, stateRef) {
  const select = outreach.querySelector('[data-mailing-select]');
  const button = outreach.querySelector('[data-mailing-sent]');
  const message = outreach.querySelector('[data-mailing-send-message]');
  const artifact = stateRef.value.artifacts.find((item) => item.id === select.value);
  if (!artifact) return setMessage(message, 'Kies eerst een printmailingversie.', true);
  if (!window.confirm(`Bevestig dat ${artifact.file_name} fysiek is verstuurd.`)) return;

  button.disabled = true;
  setMessage(message, 'Verzending registreren…');
  try {
    const { error } = await db.rpc('operator_register_mailing_sent', {
      p_prospect_id: prospectId,
      p_artifact_id: artifact.id
    });
    if (error) throw error;
    setMessage(message, 'Fysieke mailing als verstuurd geregistreerd.');
    stateRef.value = await loadState(prospectId);
    renderDesign(design, stateRef.value);
    renderOutreach(outreach, stateRef.value);
  } catch (error) {
    setMessage(message, error.message || String(error), true);
  } finally {
    button.disabled = false;
  }
}

function placeCard(pane, card) {
  if (!pane || !card || card.isConnected) return;
  const firstSection = [...pane.children].find((child) => child.matches?.('section.card'));
  if (firstSection) pane.insertBefore(card, firstSection);
  else pane.appendChild(card);
}

async function bind(root) {
  if (!db || !root || root.dataset.mailingArtifactsBound === 'true') return;
  const designPane = root.querySelector('[data-dossier-pane="design"]');
  const outreachPane = root.querySelector('[data-dossier-pane="outreach"]');
  if (!designPane || !outreachPane) return;

  root.dataset.mailingArtifactsBound = 'true';
  const prospect = await selectedProspect(root);
  if (!prospect) {
    delete root.dataset.mailingArtifactsBound;
    return;
  }

  const design = designCard();
  const outreach = outreachCard();
  designPane.appendChild(design);
  placeCard(outreachPane, outreach);

  const stateRef = { value: await loadState(prospect.id) };
  renderDesign(design, stateRef.value);
  renderOutreach(outreach, stateRef.value);

  design.querySelector('[data-mailing-upload]').addEventListener('click', () => uploadVersion(prospect.id, design, outreach, stateRef));
  outreach.querySelector('[data-mailing-open]').addEventListener('click', () => openSelected(outreach, stateRef.value).catch((error) => setMessage(outreach.querySelector('[data-mailing-send-message]'), error.message || String(error), true)));
  outreach.querySelector('[data-mailing-sent]').addEventListener('click', () => registerSent(prospect.id, design, outreach, stateRef));
}

function bindCurrent() {
  const root = document.querySelector('#detailPanel .detail-content');
  if (root) bind(root).catch(console.error);
}

addStylesheet();
const panel = document.getElementById('detailPanel');
if (panel) {
  new MutationObserver(bindCurrent).observe(panel, { childList: true, subtree: true });
  bindCurrent();
}
