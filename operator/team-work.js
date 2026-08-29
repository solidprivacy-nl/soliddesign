const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);

const RESPONSIBILITIES = [
  ['CASE_LEAD', 'Dossierhouder'],
  ['DESIGN', 'Design'],
  ['OUTREACH', 'Outreach & opvolging']
];
const ROLE_LABELS = { ADMIN: 'Admin', KEY_USER: 'Key user', USER: 'User' };

let currentMember = null;
let team = [];
let assignments = [];
let prospects = [];

function el(id) { return document.getElementById(id); }
function memberName(userId) { return team.find((m) => m.user_id === userId)?.display_name || 'Onbekend'; }
function assignmentFor(prospectId, responsibility) {
  return assignments.find((a) => a.prospect_id === prospectId && a.responsibility === responsibility) || null;
}

function addStylesheet() {
  if (document.querySelector('link[data-team-work-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './team-work.css';
  link.dataset.teamWorkStyle = 'true';
  document.head.appendChild(link);
}

async function loadTeamState() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return false;

  const [memberResult, teamResult, assignmentResult, prospectResult] = await Promise.all([
    db.from('team_members').select('user_id,email,display_name,role,active,joined_at').eq('user_id', session.user.id).maybeSingle(),
    db.from('team_members').select('user_id,email,display_name,role,active,joined_at').order('display_name'),
    db.from('prospect_assignments').select('prospect_id,responsibility,user_id,assigned_at'),
    db.from('prospects').select('id,name,city,contact_status,next_action_at,website_url').order('updated_at', { ascending: false })
  ]);

  if (memberResult.error) throw memberResult.error;
  if (!memberResult.data?.active) return false;
  if (teamResult.error) throw teamResult.error;
  if (assignmentResult.error) throw assignmentResult.error;
  if (prospectResult.error) throw prospectResult.error;

  currentMember = memberResult.data;
  team = (teamResult.data || []).filter((m) => m.active);
  assignments = assignmentResult.data || [];
  prospects = prospectResult.data || [];
  return true;
}

function mainNavButton(id, label) {
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.className = 'nav-button';
  button.textContent = label;
  return button;
}

function setActiveNav(active) {
  document.querySelectorAll('.main-nav .nav-button').forEach((button) => button.classList.toggle('active', button === active));
}

function hideExtensionViews() {
  el('myWorkView')?.classList.add('hidden');
  el('teamView')?.classList.add('hidden');
}

function showExtensionView(view, navButton) {
  el('prospectsView')?.classList.add('hidden');
  el('discoveryView')?.classList.add('hidden');
  hideExtensionViews();
  view.classList.remove('hidden');
  setActiveNav(navButton);
}

function installNavigation() {
  const nav = document.querySelector('.main-nav');
  const prospectsNav = el('prospectsNav');
  const discoveryNav = el('discoveryNav');
  if (!nav || !prospectsNav || el('myWorkNav')) return;

  const myWorkNav = mainNavButton('myWorkNav', 'Mijn werk');
  nav.insertBefore(myWorkNav, prospectsNav);

  let teamNav = null;
  if (['ADMIN', 'KEY_USER'].includes(currentMember.role)) {
    teamNav = mainNavButton('teamNav', 'Team');
    nav.appendChild(teamNav);
  }

  const app = el('appView');
  const myWorkView = document.createElement('main');
  myWorkView.id = 'myWorkView';
  myWorkView.className = 'workspace-page hidden';
  app.appendChild(myWorkView);

  const teamView = document.createElement('main');
  teamView.id = 'teamView';
  teamView.className = 'workspace-page hidden';
  app.appendChild(teamView);

  myWorkNav.addEventListener('click', async () => {
    await refreshState();
    renderMyWork();
    showExtensionView(myWorkView, myWorkNav);
  });
  teamNav?.addEventListener('click', async () => {
    await refreshState();
    renderTeam();
    showExtensionView(teamView, teamNav);
  });

  [prospectsNav, discoveryNav].forEach((button) => button.addEventListener('click', () => {
    hideExtensionViews();
    setActiveNav(button);
  }, true));

  const email = el('userEmail');
  if (email) email.title = `SolidDesign rol: ${ROLE_LABELS[currentMember.role] || currentMember.role}`;

  renderMyWork();
  showExtensionView(myWorkView, myWorkNav);
}

async function refreshState() {
  const [teamResult, assignmentResult, prospectResult] = await Promise.all([
    db.from('team_members').select('user_id,email,display_name,role,active,joined_at').order('display_name'),
    db.from('prospect_assignments').select('prospect_id,responsibility,user_id,assigned_at'),
    db.from('prospects').select('id,name,city,contact_status,next_action_at,website_url').order('updated_at', { ascending: false })
  ]);
  if (teamResult.error) throw teamResult.error;
  if (assignmentResult.error) throw assignmentResult.error;
  if (prospectResult.error) throw prospectResult.error;
  team = (teamResult.data || []).filter((m) => m.active);
  assignments = assignmentResult.data || [];
  prospects = prospectResult.data || [];
}

function prospectStatusLabel(value) {
  return ({
    qualified: 'Gekwalificeerd', ready_to_mail: 'Klaar voor brief', mailed: 'Brief verstuurd',
    follow_up: 'Opvolgen', contacted: 'Contact gehad', meeting: 'Afspraak', proposal: 'Voorstel',
    won: 'Gewonnen', lost: 'Verloren', no_response: 'Geen reactie'
  })[value] || value || '—';
}

function openExistingProspect(prospect) {
  el('prospectsNav')?.click();
  const search = el('searchInput');
  if (!search) return;
  search.value = prospect.name;
  search.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(() => {
    const rows = [...document.querySelectorAll('#prospectList .prospect-row')];
    const match = rows.find((row) => row.textContent.includes(prospect.name));
    match?.click();
  }, 0);
}

function renderMyWork(filter = 'ALL') {
  const root = el('myWorkView');
  if (!root) return;
  const mine = assignments.filter((a) => a.user_id === currentMember.user_id);
  const relevant = filter === 'ALL' ? mine : mine.filter((a) => a.responsibility === filter);
  const counts = Object.fromEntries(RESPONSIBILITIES.map(([key]) => [key, mine.filter((a) => a.responsibility === key).length]));

  root.innerHTML = `
    <div class="workspace-head"><div><h1>Mijn werk</h1><p class="subtle">Prospects waarvoor jij nu verantwoordelijk bent.</p></div></div>
    <div class="work-filters">
      <button data-work-filter="ALL" class="scope-button ${filter === 'ALL' ? 'active' : ''}">Alles ${mine.length}</button>
      ${RESPONSIBILITIES.map(([key,label]) => `<button data-work-filter="${key}" class="scope-button ${filter === key ? 'active' : ''}">${label} ${counts[key]}</button>`).join('')}
    </div>
    <div class="work-list"></div>`;

  root.querySelectorAll('[data-work-filter]').forEach((button) => button.addEventListener('click', () => renderMyWork(button.dataset.workFilter)));
  const list = root.querySelector('.work-list');
  if (!relevant.length) {
    list.innerHTML = '<div class="card empty-work"><strong>Geen toegewezen werk</strong><p class="subtle">Nieuwe verantwoordelijkheden verschijnen hier automatisch.</p></div>';
    return;
  }

  const byProspect = new Map();
  for (const item of relevant) {
    if (!byProspect.has(item.prospect_id)) byProspect.set(item.prospect_id, []);
    byProspect.get(item.prospect_id).push(item.responsibility);
  }

  for (const [prospectId, roles] of byProspect) {
    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'work-item';
    const labels = roles.map((role) => RESPONSIBILITIES.find(([key]) => key === role)?.[1] || role).join(' · ');
    button.innerHTML = `<div><strong></strong><span></span></div><div class="work-meta"><span>${labels}</span><span>${prospectStatusLabel(prospect.contact_status)}</span></div>`;
    button.querySelector('strong').textContent = prospect.name;
    button.querySelector('div > span').textContent = prospect.city || '';
    button.addEventListener('click', () => openExistingProspect(prospect));
    list.appendChild(button);
  }
}

function renderTeam() {
  const root = el('teamView');
  if (!root) return;
  root.innerHTML = `
    <div class="workspace-head">
      <div><h1>Team</h1><p class="subtle">Leden en huidige werkverdeling. Uitnodigen en rolbeheer volgen in de invite-only onboardingstap.</p></div>
    </div>
    <section class="card team-card">
      <div class="team-table" role="table">
        <div class="team-row team-head" role="row"><span>Medewerker</span><span>Rol</span><span>Dossier</span><span>Design</span><span>Outreach</span></div>
      </div>
    </section>`;
  const table = root.querySelector('.team-table');
  for (const member of team) {
    const counts = Object.fromEntries(RESPONSIBILITIES.map(([key]) => [key, assignments.filter((a) => a.user_id === member.user_id && a.responsibility === key).length]));
    const row = document.createElement('div');
    row.className = 'team-row';
    row.setAttribute('role', 'row');
    row.innerHTML = `<span><strong></strong><small></small></span><span></span><span>${counts.CASE_LEAD}</span><span>${counts.DESIGN}</span><span>${counts.OUTREACH}</span>`;
    row.querySelector('strong').textContent = member.display_name;
    row.querySelector('small').textContent = member.email;
    row.children[1].textContent = ROLE_LABELS[member.role] || member.role;
    table.appendChild(row);
  }
}

function canAssign(responsibility, prospectId) {
  if (['ADMIN', 'KEY_USER'].includes(currentMember.role)) return true;
  if (currentMember.role !== 'USER' || responsibility === 'CASE_LEAD') return false;
  return assignmentFor(prospectId, 'CASE_LEAD')?.user_id === currentMember.user_id;
}

async function selectedProspect(root) {
  const name = root.querySelector('[data-field="name"]')?.textContent?.trim();
  const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim();
  if (!name || !website || website === '—') return null;
  const { data, error } = await db.from('prospects').select('id,name,website_url').eq('name', name).eq('website_url', website).limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0] : null;
}

function assignmentSelect(prospect, responsibility, label) {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const select = document.createElement('select');
  select.dataset.assignment = responsibility;
  select.disabled = !canAssign(responsibility, prospect.id);
  select.innerHTML = '<option value="">Niet toegewezen</option>' + team.map((member) => `<option value="${member.user_id}"></option>`).join('');
  [...select.options].slice(1).forEach((option, index) => { option.textContent = team[index].display_name; });
  select.value = assignmentFor(prospect.id, responsibility)?.user_id || '';
  wrapper.appendChild(select);
  return wrapper;
}

async function bindResponsibilityCard() {
  const root = document.querySelector('#detailPanel .detail-content');
  if (!root || root.dataset.responsibilityBound === 'true') return;
  const linkRow = root.querySelector('.link-row');
  if (!linkRow) return;
  root.dataset.responsibilityBound = 'true';

  try {
    await refreshState();
    const prospect = await selectedProspect(root);
    if (!prospect) throw new Error('Prospect kon niet worden bepaald.');

    const card = document.createElement('section');
    card.className = 'card responsibility-card';
    card.innerHTML = '<div><h3>Verantwoordelijkheid</h3><p class="subtle">Wie bewaakt het dossier en wie is primair verantwoordelijk voor Design en Outreach.</p></div><div class="responsibility-grid"></div><p class="message" data-assignment-message></p>';
    const grid = card.querySelector('.responsibility-grid');
    for (const [key,label] of RESPONSIBILITIES) grid.appendChild(assignmentSelect(prospect, key, label));

    grid.querySelectorAll('select').forEach((select) => select.addEventListener('change', async () => {
      const message = card.querySelector('[data-assignment-message]');
      select.disabled = true;
      message.textContent = 'Verantwoordelijkheid opslaan…';
      const userId = select.value || null;
      const { error } = await db.rpc('operator_set_assignment', {
        p_prospect_id: prospect.id,
        p_responsibility: select.dataset.assignment,
        p_user_id: userId
      });
      if (error) {
        message.textContent = error.message || 'Kon verantwoordelijkheid niet opslaan.';
        message.classList.add('error');
      } else {
        message.classList.remove('error');
        message.textContent = 'Verantwoordelijkheid opgeslagen.';
        await refreshState();
        renderMyWork();
        if (!el('teamView')?.classList.contains('hidden')) renderTeam();
      }
      select.disabled = !canAssign(select.dataset.assignment, prospect.id);
    }));

    linkRow.insertAdjacentElement('afterend', card);
  } catch (error) {
    console.error(error);
    delete root.dataset.responsibilityBound;
  }
}

async function initialize() {
  if (!db) return;
  const ready = await loadTeamState();
  if (!ready) return;
  addStylesheet();
  installNavigation();

  const panel = el('detailPanel');
  if (panel) {
    new MutationObserver(() => bindResponsibilityCard()).observe(panel, { childList: true, subtree: true });
    bindResponsibilityCard();
  }
}

function startWhenAuthenticated() {
  initialize().catch(console.error);
  db.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') initialize().catch(console.error);
  });
}

startWhenAuthenticated();
