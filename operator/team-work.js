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
function assignmentFor(prospectId, responsibility) {
  return assignments.find((a) => a.prospect_id === prospectId && a.responsibility === responsibility) || null;
}
function assignmentCount(userId) { return assignments.filter((a) => a.user_id === userId).length; }
function assignableTeam() { return team.filter((member) => member.active && member.joined_at); }
function memberStatus(member) {
  if (!member.active) return 'Inactief';
  return member.joined_at ? 'Actief' : 'Uitgenodigd';
}
function memberInitials(displayName) {
  const parts = String(displayName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
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

  // Joining the team is a lifecycle transition performed only after the invitee
  // finishes the mandatory password setup. Reading the workspace must never
  // mutate that lifecycle state.
  const [memberResult, teamResult, assignmentResult, prospectResult] = await Promise.all([
    db.from('team_members').select('user_id,email,display_name,role,active,joined_at,deactivated_at').eq('user_id', session.user.id).maybeSingle(),
    db.from('team_members').select('user_id,email,display_name,role,active,joined_at,deactivated_at').order('display_name'),
    db.from('prospect_assignments').select('prospect_id,responsibility,user_id,assigned_at'),
    db.from('prospects').select('id,name,city,contact_status,next_action_at,website_url').order('updated_at', { ascending: false })
  ]);

  if (memberResult.error) throw memberResult.error;
  if (!memberResult.data?.active) return false;
  if (teamResult.error) throw teamResult.error;
  if (assignmentResult.error) throw assignmentResult.error;
  if (prospectResult.error) throw prospectResult.error;

  currentMember = memberResult.data;
  team = teamResult.data || [];
  assignments = assignmentResult.data || [];
  prospects = prospectResult.data || [];
  return true;
}

async function refreshState() {
  const [teamResult, assignmentResult, prospectResult] = await Promise.all([
    db.from('team_members').select('user_id,email,display_name,role,active,joined_at,deactivated_at').order('display_name'),
    db.from('prospect_assignments').select('prospect_id,responsibility,user_id,assigned_at'),
    db.from('prospects').select('id,name,city,contact_status,next_action_at,website_url').order('updated_at', { ascending: false })
  ]);
  if (teamResult.error) throw teamResult.error;
  if (assignmentResult.error) throw assignmentResult.error;
  if (prospectResult.error) throw prospectResult.error;
  team = teamResult.data || [];
  assignments = assignmentResult.data || [];
  prospects = prospectResult.data || [];
  currentMember = team.find((member) => member.user_id === currentMember?.user_id) || currentMember;
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

  const userIdentity = el('userEmail');
  if (userIdentity) {
    userIdentity.textContent = currentMember.display_name;
    userIdentity.title = `${currentMember.email} · ${ROLE_LABELS[currentMember.role] || currentMember.role}`;
  }

  renderMyWork();
  showExtensionView(myWorkView, myWorkNav);
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

function canManageMember(member) {
  if (member.user_id === currentMember.user_id) return false;
  if (currentMember.role === 'ADMIN') return true;
  return currentMember.role === 'KEY_USER' && member.role === 'USER';
}

async function inviteMember(form, message) {
  const name = form.querySelector('[name="display_name"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const roleNode = form.querySelector('[name="role"]');
  const role = roleNode ? roleNode.value : 'USER';
  const { data: { session } } = await db.auth.getSession();
  if (!session) throw new Error('Je bent niet meer ingelogd.');

  const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/team-invite`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ display_name: name, email, role })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Uitnodiging kon niet worden verstuurd.');
  message.textContent = `Uitnodiging verstuurd naar ${email}.`;
  message.classList.remove('error');
  form.reset();
  await refreshState();
  renderTeam('ALL', true);
}

function inviteCard() {
  const card = document.createElement('section');
  card.className = 'card invite-card hidden';
  card.innerHTML = `
    <div class="section-heading"><div><h3>Gebruiker uitnodigen</h3><p class="subtle">De nieuwe collega ontvangt een e-mail om het SolidDesign-account te activeren.</p></div><button type="button" class="ghost" data-invite-close>Sluiten</button></div>
    <form class="invite-form">
      <label>Naam<input name="display_name" type="text" maxlength="100" required /></label>
      <label>E-mailadres<input name="email" type="email" maxlength="254" required /></label>
      ${currentMember.role === 'ADMIN' ? '<label>Rol<select name="role"><option value="USER">User</option><option value="KEY_USER">Key user</option></select></label>' : ''}
      <div class="invite-actions"><span class="message" data-invite-message></span><button type="submit" class="primary">Uitnodigen</button></div>
    </form>`;
  card.querySelector('[data-invite-close]').addEventListener('click', () => card.classList.add('hidden'));
  const form = card.querySelector('form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const message = card.querySelector('[data-invite-message]');
    submit.disabled = true;
    message.textContent = 'Uitnodiging versturen…';
    message.classList.remove('error');
    try { await inviteMember(form, message); }
    catch (error) { message.textContent = error.message; message.classList.add('error'); }
    finally { submit.disabled = false; }
  });
  return card;
}

async function changeRole(member, role, message) {
  const { error } = await db.rpc('operator_set_team_role', { p_user_id: member.user_id, p_role: role });
  if (error) throw error;
  message.textContent = 'Rol bijgewerkt.';
  await refreshState();
  renderTeam();
}

async function changeDisplayName(member, message) {
  const next = window.prompt('Weergavenaam', member.display_name);
  if (next === null) return;
  const clean = next.trim().replace(/\s+/g, ' ');
  if (clean === member.display_name) return;
  const { error } = await db.rpc('operator_update_team_display_name', {
    p_user_id: member.user_id,
    p_display_name: clean
  });
  if (error) throw error;
  message.textContent = 'Naam bijgewerkt.';
  message.classList.remove('error');
  await refreshState();
  renderTeam();

  const userIdentity = el('userEmail');
  if (member.user_id === currentMember.user_id && userIdentity) {
    userIdentity.textContent = currentMember.display_name;
    userIdentity.title = `${currentMember.email} · ${ROLE_LABELS[currentMember.role] || currentMember.role}`;
  }
}

async function toggleMember(member, message) {
  const rpc = member.active ? 'operator_deactivate_team_member' : 'operator_reactivate_team_member';
  const { error } = await db.rpc(rpc, { p_user_id: member.user_id });
  if (error) throw error;
  message.textContent = member.active ? 'Gebruiker gedeactiveerd.' : 'Gebruiker geactiveerd.';
  message.classList.remove('error');
  await refreshState();
  renderTeam();
}

async function deleteMember(member, message) {
  if (!window.confirm(`Verwijder ${member.display_name} definitief? Gebruik dit alleen voor een test- of foutaccount zonder dossierhistorie.`)) return;
  const { data: { session } } = await db.auth.getSession();
  if (!session) throw new Error('Je bent niet meer ingelogd.');

  const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/team-member-admin`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'delete', user_id: member.user_id })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Gebruiker kon niet definitief worden verwijderd.');

  message.textContent = `${member.display_name} is definitief verwijderd.`;
  message.classList.remove('error');
  await refreshState();
  renderTeam();
}

function addTeamAction(actions, label, handler, className = 'ghost compact-action') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', handler);
  actions.appendChild(button);
  return button;
}

function renderTeam(filter = 'ALL', keepInviteOpen = false) {
  const root = el('teamView');
  if (!root) return;
  const counts = {
    ACTIVE: team.filter((m) => m.active && m.joined_at).length,
    INVITED: team.filter((m) => m.active && !m.joined_at).length,
    INACTIVE: team.filter((m) => !m.active).length
  };
  const shown = team.filter((member) => {
    if (filter === 'ACTIVE') return member.active && member.joined_at;
    if (filter === 'INVITED') return member.active && !member.joined_at;
    if (filter === 'INACTIVE') return !member.active;
    return true;
  });

  root.innerHTML = `
    <div class="workspace-head">
      <div><h1>Team</h1><p class="subtle">Gebruikers, rollen en huidige werkverdeling.</p></div>
      <button type="button" class="primary" data-open-invite>+ Gebruiker uitnodigen</button>
    </div>
    <div class="work-filters">
      <button data-team-filter="ALL" class="scope-button ${filter === 'ALL' ? 'active' : ''}">Alles ${team.length}</button>
      <button data-team-filter="ACTIVE" class="scope-button ${filter === 'ACTIVE' ? 'active' : ''}">Actief ${counts.ACTIVE}</button>
      <button data-team-filter="INVITED" class="scope-button ${filter === 'INVITED' ? 'active' : ''}">Uitgenodigd ${counts.INVITED}</button>
      <button data-team-filter="INACTIVE" class="scope-button ${filter === 'INACTIVE' ? 'active' : ''}">Inactief ${counts.INACTIVE}</button>
    </div>
    <div data-invite-slot></div>
    <section class="card team-card">
      <p class="message" data-team-message></p>
      <div class="team-table" role="table">
        <div class="team-row team-head" role="row"><span>Medewerker</span><span>Rol</span><span>Status</span><span>Dossier</span><span>Design</span><span>Outreach</span><span></span></div>
      </div>
    </section>`;

  const invite = inviteCard();
  root.querySelector('[data-invite-slot]').appendChild(invite);
  if (keepInviteOpen) invite.classList.remove('hidden');
  root.querySelector('[data-open-invite]').addEventListener('click', () => invite.classList.toggle('hidden'));
  root.querySelectorAll('[data-team-filter]').forEach((button) => button.addEventListener('click', () => renderTeam(button.dataset.teamFilter)));

  const message = root.querySelector('[data-team-message]');
  const table = root.querySelector('.team-table');
  for (const member of shown) {
    const work = Object.fromEntries(RESPONSIBILITIES.map(([key]) => [key, assignments.filter((a) => a.user_id === member.user_id && a.responsibility === key).length]));
    const row = document.createElement('div');
    row.className = 'team-row';
    row.setAttribute('role', 'row');
    row.innerHTML = '<span class="team-person"><span class="team-avatar" aria-hidden="true"></span><span class="team-person-copy"><strong></strong><small></small></span></span><span data-role></span><span data-status></span><span></span><span></span><span></span><span class="team-actions"></span>';
    row.querySelector('.team-avatar').textContent = memberInitials(member.display_name);
    row.querySelector('strong').textContent = member.display_name;
    row.querySelector('small').textContent = member.email;
    row.querySelector('[data-status]').textContent = memberStatus(member);
    row.children[3].textContent = work.CASE_LEAD;
    row.children[4].textContent = work.DESIGN;
    row.children[5].textContent = work.OUTREACH;

    const roleCell = row.querySelector('[data-role]');
    if (currentMember.role === 'ADMIN' && member.active && member.user_id !== currentMember.user_id) {
      const select = document.createElement('select');
      select.className = 'compact-select';
      select.innerHTML = Object.entries(ROLE_LABELS).map(([value,label]) => `<option value="${value}">${label}</option>`).join('');
      select.value = member.role;
      select.addEventListener('change', async () => {
        select.disabled = true;
        try { await changeRole(member, select.value, message); }
        catch (error) { message.textContent = error.message; message.classList.add('error'); select.value = member.role; }
        finally { select.disabled = false; }
      });
      roleCell.appendChild(select);
    } else {
      roleCell.textContent = ROLE_LABELS[member.role] || member.role;
    }

    const actions = row.querySelector('.team-actions');
    if (currentMember.role === 'ADMIN') {
      const nameButton = addTeamAction(actions, 'Naam', async () => {
        nameButton.disabled = true;
        try { await changeDisplayName(member, message); }
        catch (error) { message.textContent = error.message; message.classList.add('error'); }
        finally { nameButton.disabled = false; }
      });
    }

    if (canManageMember(member)) {
      const toggleButton = addTeamAction(actions, member.active ? 'Deactiveer' : 'Activeer', async () => {
        toggleButton.disabled = true;
        message.classList.remove('error');
        try { await toggleMember(member, message); }
        catch (error) { message.textContent = error.message; message.classList.add('error'); toggleButton.disabled = false; }
      });
      if (member.active && assignmentCount(member.user_id) > 0) {
        toggleButton.disabled = true;
        toggleButton.title = 'Draag eerst de actieve verantwoordelijkheden over.';
      }
    }

    if (currentMember.role === 'ADMIN' && member.user_id !== currentMember.user_id) {
      const deleteButton = addTeamAction(actions, 'Verwijder', async () => {
        deleteButton.disabled = true;
        message.classList.remove('error');
        try { await deleteMember(member, message); }
        catch (error) { message.textContent = error.message; message.classList.add('error'); deleteButton.disabled = false; }
      }, 'ghost compact-action danger-action');
      if (assignmentCount(member.user_id) > 0) {
        deleteButton.disabled = true;
        deleteButton.title = 'Draag eerst de actieve verantwoordelijkheden over.';
      } else {
        deleteButton.title = 'Alleen mogelijk zolang er geen dossierhistorie bestaat.';
      }
    }

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
  const members = assignableTeam();
  select.innerHTML = '<option value="">Niet toegewezen</option>' + members.map((member) => `<option value="${member.user_id}"></option>`).join('');
  [...select.options].slice(1).forEach((option, index) => { option.textContent = members[index].display_name; });
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
      message.classList.remove('error');
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
