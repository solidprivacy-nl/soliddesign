const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PR_PREVIEW_HOST_RE = /^pr-\d+\.soliddesign-cms\.pages\.dev$/;
const RESERVED = new Set(['api', 'brief', 'p', 'prospect', 'start-design', 'team']);

function cleanOrigin(value) {
  return String(value || window.location.origin).replace(/\/+$/, '');
}

function cleanPrefix(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

function publicOrigin() {
  // A PR preview must test its own public delivery code, not silently jump to
  // the production Pages host. Outside PR previews, the configured public
  // origin remains authoritative and can later become https://<brand>.nl.
  if (window.location.protocol === 'https:' && PR_PREVIEW_HOST_RE.test(window.location.hostname)) {
    return window.location.origin;
  }
  return cleanOrigin(CONFIG?.publicProspectOrigin);
}

function shortUrl(slug) {
  if (!slug) return '';
  const origin = publicOrigin();
  const prefix = cleanPrefix(CONFIG?.publicProspectPathPrefix);
  return `${origin}${prefix}/${encodeURIComponent(slug)}`;
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '');
}

function setMessage(box, text, error = false) {
  const node = box.querySelector('[data-public-link-message]');
  node.textContent = text || '';
  node.classList.toggle('error', Boolean(error));
}

async function selectedProspect(root) {
  const name = root.querySelector('[data-field="name"]')?.textContent?.trim();
  const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim();
  if (!name || !website || website === '—') return null;

  const { data, error } = await db
    .from('prospects')
    .select('id,name,website_url,public_slug')
    .eq('name', name)
    .eq('website_url', website)
    .limit(2);
  if (error) throw error;
  if (!data || data.length !== 1) return null;

  const prospect = data[0];
  const { data: liveRows, error: liveError } = await db
    .from('demos')
    .select('id')
    .eq('prospect_id', prospect.id)
    .eq('status', 'LIVE')
    .limit(1);
  if (liveError) throw liveError;
  return { ...prospect, hasLive: Boolean(liveRows?.length) };
}

function syncPublicLinks(root, prospect) {
  if (!prospect.hasLive || !prospect.public_slug) return;
  const url = shortUrl(prospect.public_slug);

  const mainPreview = root.querySelector('[data-link="preview"]');
  if (mainPreview) {
    mainPreview.href = url;
    mainPreview.classList.remove('disabled');
  }

  const liveAnchor = root.querySelector('[data-field="liveMockup"] a');
  if (liveAnchor) {
    liveAnchor.href = url;
    liveAnchor.textContent = `Live link: ${url}`;
  }
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
}

function buildBox(prospect, root) {
  const box = document.createElement('div');
  box.className = 'mockup-live';
  box.dataset.publicProspectLink = 'true';
  box.innerHTML = `
    <strong>Korte prospectlink</strong>
    <p class="subtle">Publieke, makkelijk over te typen link naar de live mock-up. De domeinnaam is infrastructuur; deze korte naam blijft gekoppeld aan de prospect wanneer later een merkdomein wordt gekozen.</p>
    <div class="form-grid">
      <label>Korte naam in prospectlink
        <input data-public-link-slug type="text" maxlength="63" inputmode="url" autocomplete="off" />
      </label>
      <label>Volledige prospectlink
        <input data-public-link-url type="text" readonly />
      </label>
    </div>
    <div class="save-row">
      <div class="subtle">Gebruik alleen kleine letters, cijfers en koppeltekens. Wijzig deze naam alleen bewust: een eerder gedeelde korte link kan daarna niet meer naar dezelfde prospect verwijzen.</div>
      <div>
        <button type="button" class="secondary" data-public-link-save>Naam opslaan</button>
        <button type="button" class="secondary" data-public-link-copy>Kopieer link</button>
      </div>
    </div>
    <p class="message" data-public-link-message aria-live="polite"></p>`;

  const slugInput = box.querySelector('[data-public-link-slug]');
  const urlInput = box.querySelector('[data-public-link-url]');
  const saveButton = box.querySelector('[data-public-link-save]');
  const copyButton = box.querySelector('[data-public-link-copy]');

  const refreshFields = () => {
    slugInput.value = prospect.public_slug || '';
    urlInput.value = shortUrl(prospect.public_slug);
    copyButton.disabled = !prospect.public_slug;
  };
  refreshFields();

  saveButton.addEventListener('click', async () => {
    const slug = normalizeSlug(slugInput.value);
    slugInput.value = slug;
    if (!slug || !SLUG_RE.test(slug) || RESERVED.has(slug)) {
      return setMessage(box, 'Kies een andere korte naam met alleen kleine letters, cijfers en koppeltekens.', true);
    }
    if (slug === prospect.public_slug) return setMessage(box, 'De korte naam is al opgeslagen.');

    saveButton.disabled = true;
    setMessage(box, 'Korte naam opslaan…');
    const { data, error } = await db
      .from('prospects')
      .update({ public_slug: slug, updated_at: new Date().toISOString() })
      .eq('id', prospect.id)
      .select('id,public_slug')
      .single();
    saveButton.disabled = false;

    if (error) {
      if (error.code === '23505') return setMessage(box, 'Deze korte naam is al in gebruik bij een andere prospect.', true);
      return setMessage(box, error.message || 'Korte naam kon niet worden opgeslagen.', true);
    }

    prospect.public_slug = data.public_slug;
    refreshFields();
    syncPublicLinks(root, prospect);
    setMessage(box, 'Korte prospectlink opgeslagen.');
  });

  copyButton.addEventListener('click', async () => {
    const url = shortUrl(prospect.public_slug);
    if (!url) return;
    await copyText(url);
    setMessage(box, 'Prospectlink gekopieerd.');
  });

  return box;
}

async function bindCurrentDetail() {
  if (!db) return;
  const root = document.querySelector('#detailPanel .detail-content');
  if (!root || root.dataset.publicProspectLinkBound === 'true') return;
  const liveBox = root.querySelector('[data-field="liveMockup"]');
  if (!liveBox) return;

  root.dataset.publicProspectLinkBound = 'true';
  try {
    const prospect = await selectedProspect(root);
    if (!prospect) throw new Error('Prospect kon niet eenduidig worden bepaald.');
    const box = buildBox(prospect, root);
    liveBox.insertAdjacentElement('afterend', box);
    syncPublicLinks(root, prospect);
  } catch (error) {
    console.error(error);
    delete root.dataset.publicProspectLinkBound;
  }
}

const detailPanel = document.getElementById('detailPanel');
if (detailPanel) {
  new MutationObserver(() => bindCurrentDetail()).observe(detailPanel, { childList: true, subtree: true });
  bindCurrentDetail();
}
