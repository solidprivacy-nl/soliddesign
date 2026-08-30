const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);

const EVENT_LABELS = {
  responsibility_changed: 'Verantwoordelijkheid gewijzigd',
  demo_created: 'Mock-upversie aangemaakt',
  demo_promoted_live: 'Mock-up LIVE gezet',
  preview_published: 'Mock-up gepubliceerd',
  mailing_artifact_created: 'Printmailingversie opgeslagen',
  mailing_marked_sent: 'Brief als verstuurd geregistreerd',
  contact_recorded: 'Contactmoment geregistreerd',
  contact_status_changed: 'Contactstatus gewijzigd',
  prospect_archived: 'Prospect gearchiveerd',
  prospect_restored: 'Prospect hersteld'
};

let pendingWorkTab = null;

function addStylesheet() {
  if (document.querySelector('link[data-dossier-tabs-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './dossier-tabs.css';
  link.dataset.dossierTabsStyle = 'true';
  document.head.appendChild(link);
}

function cardByHeading(root, heading) {
  return [...root.querySelectorAll('section.card')].find((card) => card.querySelector(':scope > h3')?.textContent.trim() === heading) || null;
}

async function selectedProspect(root) {
  const name = root.querySelector('[data-field="name"]')?.textContent?.trim();
  const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim();
  if (!name || !website || website === '—') return null;
  const { data, error } = await db.from('prospects').select('id,name').eq('name', name).eq('website_url', website).limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0] : null;
}

function activateTab(root, name) {
  const target = root.querySelector(`[data-dossier-tab="${name}"]`) ? name : 'overview';
  root.querySelectorAll('[data-dossier-tab]').forEach((button) => button.classList.toggle('active', button.dataset.dossierTab === target));
  root.querySelectorAll('[data-dossier-pane]').forEach((pane) => pane.classList.toggle('hidden', pane.dataset.dossierPane !== target));
}

function eventDescription(event) {
  if (event.event_type === 'responsibility_changed') {
    const label = ({ CASE_LEAD: 'Dossierhouder', DESIGN: 'Design', OUTREACH: 'Outreach & opvolging' })[event.metadata?.responsibility] || 'Verantwoordelijkheid';
    return `${label} gewijzigd`;
  }
  return EVENT_LABELS[event.event_type] || String(event.event_type || 'Activiteit').replaceAll('_', ' ');
}

function formatActivityDate(value) {
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function loadActivity(prospectId, pane) {
  const list = pane.querySelector('[data-activity-list]');
  if (!list) return;
  list.innerHTML = '<p class="subtle">Activiteit laden…</p>';
  const { data, error } = await db.rpc('operator_list_prospect_activity', { p_id: prospectId });
  if (error) {
    list.innerHTML = '<p class="error-text">Activiteit kon niet worden geladen.</p>';
    return;
  }
  if (!data?.length) {
    list.innerHTML = '<p class="subtle">Nog geen gelogde dossieractiviteit.</p>';
    return;
  }
  list.innerHTML = '';
  for (const event of data) {
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = '<div class="activity-time"></div><div><strong></strong><span></span></div>';
    row.querySelector('.activity-time').textContent = formatActivityDate(event.created_at);
    row.querySelector('strong').textContent = eventDescription(event);
    row.querySelector('span').textContent = event.actor_name || 'Systeem';
    list.appendChild(row);
  }
}

function createOverviewSummary(root) {
  const card = document.createElement('section');
  card.className = 'card dossier-summary-card';
  card.innerHTML = `
    <h3>Dossieroverzicht</h3>
    <div class="dossier-summary-grid">
      <div><span>Contactstatus</span><strong data-summary-status>—</strong></div>
      <div><span>Volgende actie</span><strong data-summary-next>—</strong></div>
      <div><span>Website</span><strong data-summary-audit>—</strong></div>
      <div><span>Mock-up</span><strong data-summary-demo>—</strong></div>
    </div>`;

  const status = root.querySelector('[data-input="status"]');
  const next = root.querySelector('[data-input="nextAction"]');
  card.querySelector('[data-summary-status]').textContent = status?.selectedOptions?.[0]?.textContent || status?.value || '—';
  card.querySelector('[data-summary-next]').textContent = next?.value ? new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(next.value)) : 'Geen geplande actie';
  card.querySelector('[data-summary-audit]').textContent = root.querySelector('[data-field="auditSummary"]')?.textContent || '—';
  card.querySelector('[data-summary-demo]').textContent = root.querySelector('[data-field="demoStatus"]')?.textContent || '—';
  return card;
}

function placeLateComponents(root) {
  const overview = root.querySelector('[data-dossier-pane="overview"]');
  const outreach = root.querySelector('[data-dossier-pane="outreach"]');
  const responsibility = root.querySelector('.responsibility-card');
  if (overview && responsibility && responsibility.parentElement !== overview) overview.insertBefore(responsibility, overview.children[1] || null);

  const publicLink = root.querySelector('[data-public-prospect-link]');
  if (outreach && publicLink && publicLink.parentElement !== outreach) outreach.insertBefore(publicLink, outreach.firstChild);
}

async function bindDossier(root) {
  if (!db || !root || root.dataset.dossierTabsBound === 'true') return;
  const topLinks = root.querySelector(':scope > .link-row');
  const designProcess = root.querySelector('[data-design-process]');
  const mockups = root.querySelector('.mockup-card');
  const outreachCard = cardByHeading(root, 'Contactopvolging');
  const sourceCard = cardByHeading(root, 'Brongegevens');
  const qualificationCard = cardByHeading(root, 'Kwalificatiecriteria');
  if (!topLinks || !designProcess || !mockups || !outreachCard) return;

  root.dataset.dossierTabsBound = 'true';
  const prospect = await selectedProspect(root);
  if (!prospect) {
    delete root.dataset.dossierTabsBound;
    return;
  }

  const nav = document.createElement('div');
  nav.className = 'dossier-tabs';
  nav.innerHTML = `
    <button type="button" class="active" data-dossier-tab="overview">Overzicht</button>
    <button type="button" data-dossier-tab="design">Design</button>
    <button type="button" data-dossier-tab="outreach">Outreach</button>
    <button type="button" data-dossier-tab="activity">Activiteit</button>`;

  const panes = document.createElement('div');
  panes.className = 'dossier-panes';
  panes.innerHTML = `
    <div data-dossier-pane="overview"></div>
    <div class="hidden" data-dossier-pane="design"></div>
    <div class="hidden" data-dossier-pane="outreach"></div>
    <div class="hidden" data-dossier-pane="activity"><section class="card"><h3>Activiteit</h3><p class="subtle">Materiële wijzigingen in dit dossier, met uitvoerende medewerker waar bekend.</p><div data-activity-list></div></section></div>`;

  topLinks.insertAdjacentElement('afterend', nav);
  nav.insertAdjacentElement('afterend', panes);

  const overview = panes.querySelector('[data-dossier-pane="overview"]');
  const design = panes.querySelector('[data-dossier-pane="design"]');
  const outreach = panes.querySelector('[data-dossier-pane="outreach"]');
  const activity = panes.querySelector('[data-dossier-pane="activity"]');

  overview.appendChild(createOverviewSummary(root));
  if (sourceCard) overview.appendChild(sourceCard);
  if (qualificationCard) overview.appendChild(qualificationCard);
  design.appendChild(designProcess);
  design.appendChild(mockups);
  outreach.appendChild(outreachCard);
  placeLateComponents(root);

  nav.querySelectorAll('[data-dossier-tab]').forEach((button) => button.addEventListener('click', () => activateTab(root, button.dataset.dossierTab)));
  activateTab(root, pendingWorkTab || 'overview');
  pendingWorkTab = null;
  await loadActivity(prospect.id, activity);

  new MutationObserver(() => placeLateComponents(root)).observe(root, { childList: true, subtree: true });
}

function bindCurrent() {
  const root = document.querySelector('#detailPanel .detail-content');
  if (root) bindDossier(root).catch(console.error);
}

addStylesheet();
const panel = document.getElementById('detailPanel');
if (panel) {
  new MutationObserver(bindCurrent).observe(panel, { childList: true, subtree: true });
  bindCurrent();
}

document.addEventListener('click', (event) => {
  const item = event.target.closest?.('.work-item');
  if (!item) return;
  const responsibility = item.querySelector('.work-meta span')?.textContent?.trim() || '';
  if (responsibility === 'Design') pendingWorkTab = 'design';
  else if (responsibility === 'Outreach & opvolging') pendingWorkTab = 'outreach';
  else pendingWorkTab = 'overview';
}, true);

document.addEventListener('soliddesign:open-dossier-tab', (event) => {
  const root = document.querySelector('#detailPanel .detail-content');
  if (root) activateTab(root, event.detail?.tab || 'overview');
});
