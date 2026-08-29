const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);

function addStylesheet() {
  if (document.querySelector('link[data-engagement-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './engagement-ui.css';
  link.dataset.engagementStyle = 'true';
  document.head.appendChild(link);
}

async function selectedProspect(root) {
  const name = root.querySelector('[data-field="name"]')?.textContent?.trim();
  const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim();
  if (!name || !website || website === '—') return null;
  const { data, error } = await db.from('prospects').select('id,name').eq('name', name).eq('website_url', website).limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0] : null;
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Nog niet gemeten';
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  if (!total) return '—';
  if (total < 60) return `ca. ${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes < 60) return rest ? `ca. ${minutes}m ${rest}s` : `ca. ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `ca. ${hours}u ${mins}m` : `ca. ${hours}u`;
}

function formatLatency(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const total = Number(seconds);
  if (!Number.isFinite(total) || total < 0) return '—';
  if (total < 3600) return `${Math.max(1, Math.round(total / 60))} min`;
  if (total < 86400) return `${Math.round(total / 3600)} uur`;
  const days = Math.floor(total / 86400);
  const hours = Math.round((total % 86400) / 3600);
  return hours ? `${days} d ${hours} u` : `${days} d`;
}

function deviceLabel(value) {
  return ({ MOBILE: 'Mobiel', TABLET: 'Tablet', DESKTOP: 'Desktop', OTHER: 'Overig' })[value] || '—';
}
function sourceLabel(value) { return ({ QR: 'QR', DIRECT: 'Direct' })[value] || '—'; }
function audienceLabel(value) { return value === 'INTERNAL' ? 'Intern' : 'Extern'; }

async function loadDetails(prospectId, card) {
  const details = card.querySelector('[data-engagement-details]');
  if (!details.classList.contains('hidden')) {
    details.classList.add('hidden');
    return;
  }
  details.classList.remove('hidden');
  details.innerHTML = '<p class="subtle">Openingen laden…</p>';
  const { data, error } = await db.rpc('operator_list_prospect_visits', { p_id: prospectId });
  if (error) {
    details.innerHTML = '<p class="error-text">Openingen konden niet worden geladen.</p>';
    return;
  }
  if (!data?.length) {
    details.innerHTML = '<p class="subtle">Nog geen gemeten openingen.</p>';
    return;
  }

  const table = document.createElement('div');
  table.className = 'visit-table';
  table.innerHTML = '<div class="visit-row visit-head"><span>Datum</span><span>Type</span><span>Actieve tijd</span><span>Device</span><span>Scroll</span><span>Bron</span></div>';
  for (const visit of data) {
    const row = document.createElement('div');
    row.className = 'visit-row';
    row.innerHTML = '<span></span><span></span><span></span><span></span><span></span><span></span>';
    row.children[0].textContent = formatDate(visit.started_at);
    row.children[1].textContent = audienceLabel(visit.audience);
    row.children[2].textContent = formatDuration(visit.active_seconds);
    row.children[3].textContent = deviceLabel(visit.device_type);
    row.children[4].textContent = `${Number(visit.max_scroll_pct || 0)}%`;
    row.children[5].textContent = sourceLabel(visit.source);
    table.appendChild(row);
  }
  details.innerHTML = '';
  details.appendChild(table);
}

function ensureInternalTestButton(root) {
  const box = root.querySelector('[data-public-prospect-link]');
  if (!box || box.querySelector('[data-public-link-internal-test]')) return;
  const actions = box.querySelector('.save-row > div:last-child');
  const urlInput = box.querySelector('[data-public-link-url]');
  if (!actions || !urlInput) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary';
  button.dataset.publicLinkInternalTest = 'true';
  button.textContent = 'Test als medewerker';
  button.addEventListener('click', () => {
    if (!urlInput.value) return;
    const url = new URL(urlInput.value);
    url.searchParams.set('__internal', '1');
    window.open(url.toString(), '_blank', 'noopener');
  });
  actions.prepend(button);
}

async function renderEngagement(root, prospectId, card) {
  card.querySelector('[data-engagement-state]').textContent = 'Digitale respons laden…';
  const { data, error } = await db.rpc('operator_get_prospect_engagement', { p_id: prospectId });
  const summary = data?.[0];
  if (error || !summary) {
    card.querySelector('[data-engagement-state]').textContent = 'Digitale respons kon niet worden geladen.';
    card.querySelector('[data-engagement-state]').classList.add('error-text');
    return;
  }

  card.querySelector('[data-engagement-state]').textContent = summary.external_openings > 0 ? `${summary.external_openings} gemeten externe opening${Number(summary.external_openings) === 1 ? '' : 'en'}` : 'Nog geen externe opening gemeten';
  card.querySelector('[data-first-open]').textContent = formatDate(summary.first_opened_at);
  card.querySelector('[data-after-mail]').textContent = formatLatency(summary.seconds_after_mailing);
  card.querySelector('[data-last-open]').textContent = formatDate(summary.last_opened_at);
  card.querySelector('[data-active-time]').textContent = formatDuration(summary.active_seconds_total);
  card.querySelector('[data-max-scroll]').textContent = summary.external_openings > 0 ? `${Number(summary.max_scroll_pct || 0)}%` : '—';
  card.querySelector('[data-device]').textContent = deviceLabel(summary.latest_device);
  card.querySelector('[data-source]').textContent = sourceLabel(summary.first_source);
}

async function bindEngagement(root) {
  if (!db || !root || root.dataset.engagementBound === 'true') return;
  const outreach = root.querySelector('[data-dossier-pane="outreach"]');
  if (!outreach) return;
  root.dataset.engagementBound = 'true';
  const prospect = await selectedProspect(root);
  if (!prospect) {
    delete root.dataset.engagementBound;
    return;
  }

  const card = document.createElement('section');
  card.className = 'card engagement-card';
  card.innerHTML = `
    <div class="section-heading"><div><h3>Digitale respons</h3><p class="subtle" data-engagement-state></p></div><button type="button" class="ghost" data-engagement-refresh>Vernieuwen</button></div>
    <div class="engagement-grid">
      <div><span>Eerste opening</span><strong data-first-open>—</strong></div>
      <div><span>Na verzending</span><strong data-after-mail>—</strong></div>
      <div><span>Laatste opening</span><strong data-last-open>—</strong></div>
      <div><span>Actieve tijd totaal</span><strong data-active-time>—</strong></div>
      <div><span>Max. scroll</span><strong data-max-scroll>—</strong></div>
      <div><span>Laatste device</span><strong data-device>—</strong></div>
      <div><span>Bron eerste opening</span><strong data-source>—</strong></div>
    </div>
    <div class="engagement-actions"><button type="button" class="secondary" data-engagement-toggle>Bekijk openingen</button></div>
    <div class="hidden engagement-details" data-engagement-details></div>`;
  outreach.insertBefore(card, outreach.querySelector('section.card') || null);

  card.querySelector('[data-engagement-refresh]').addEventListener('click', () => renderEngagement(root, prospect.id, card));
  card.querySelector('[data-engagement-toggle]').addEventListener('click', () => loadDetails(prospect.id, card));
  await renderEngagement(root, prospect.id, card);
  ensureInternalTestButton(root);

  new MutationObserver(() => ensureInternalTestButton(root)).observe(root, { childList: true, subtree: true });
}

function bindCurrent() {
  const root = document.querySelector('#detailPanel .detail-content');
  if (root) bindEngagement(root).catch(console.error);
}

addStylesheet();
const panel = document.getElementById('detailPanel');
if (panel) {
  new MutationObserver(bindCurrent).observe(panel, { childList: true, subtree: true });
  bindCurrent();
}
