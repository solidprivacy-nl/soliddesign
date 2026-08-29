const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);

let currentMember = null;
let members = [];
let observer = null;

function initials(displayName, email = '') {
  const parts = String(displayName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return String(email || '?').slice(0, 2).toUpperCase();
}

async function loadIdentityState() {
  if (!db) return false;
  const { data: { session } } = await db.auth.getSession();
  if (!session) return false;

  const { data, error } = await db
    .from('team_members')
    .select('user_id,email,display_name,role,active,joined_at')
    .order('display_name');
  if (error) throw error;

  members = data || [];
  currentMember = members.find((member) => member.user_id === session.user.id) || null;
  return Boolean(currentMember?.active);
}

function teamMessage() {
  return document.querySelector('#teamView [data-team-message]');
}

function setTeamMessage(text, error = false) {
  const node = teamMessage();
  if (!node) return;
  node.textContent = text || '';
  node.classList.toggle('error', Boolean(error));
}

function refreshVisibleTeam() {
  const teamNav = document.getElementById('teamNav');
  if (teamNav && !document.getElementById('teamView')?.classList.contains('hidden')) teamNav.click();
}

function memberForRow(row) {
  const email = row.querySelector('small')?.textContent?.trim().toLowerCase();
  if (!email) return null;
  return members.find((member) => member.email.toLowerCase() === email) || null;
}

function buildAvatar(member) {
  const avatar = document.createElement('span');
  avatar.className = 'member-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = initials(member.display_name, member.email);
  return avatar;
}

function openRenameDialog(member) {
  document.querySelector('.member-name-dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.className = 'member-name-dialog';
  dialog.innerHTML = `
    <form class="member-name-form">
      <div>
        <h3>Naam wijzigen</h3>
        <p class="subtle">Deze naam wordt gebruikt bij verantwoordelijkheden en activiteit. Het e-mailadres blijft alleen accountinformatie.</p>
      </div>
      <label>Weergavenaam
        <input name="display_name" type="text" minlength="2" maxlength="100" required />
      </label>
      <p class="message" data-name-message></p>
      <div class="member-dialog-actions">
        <button type="button" class="secondary" data-cancel>Annuleren</button>
        <button type="submit" class="primary">Opslaan</button>
      </div>
    </form>`;

  document.body.appendChild(dialog);
  const form = dialog.querySelector('form');
  const input = form.elements.display_name;
  const message = dialog.querySelector('[data-name-message]');
  input.value = member.display_name;

  const close = () => {
    dialog.close();
    dialog.remove();
  };
  dialog.querySelector('[data-cancel]').addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const displayName = input.value.trim().replace(/\s+/g, ' ');
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    message.textContent = 'Naam opslaan…';
    message.classList.remove('error');

    const { error } = await db.rpc('operator_update_team_display_name', {
      p_user_id: member.user_id,
      p_display_name: displayName,
    });
    if (error) {
      submit.disabled = false;
      message.textContent = error.message || 'Naam kon niet worden opgeslagen.';
      message.classList.add('error');
      return;
    }

    await loadIdentityState();
    close();
    updateCurrentIdentity();
    refreshVisibleTeam();
  });

  dialog.showModal();
  input.focus();
  input.select();
}

async function deleteMember(member, button) {
  const accepted = window.confirm(
    `Verwijder ${member.display_name} definitief uit SolidDesign?\n\n` +
    'Gebruik dit alleen voor een foutief/testaccount zonder dossierhistorie. Voor voormalige medewerkers is Deactiveren de juiste actie.'
  );
  if (!accepted) return;

  const { data: { session } } = await db.auth.getSession();
  if (!session) throw new Error('Je bent niet meer ingelogd.');

  button.disabled = true;
  setTeamMessage('Gebruiker definitief verwijderen…');
  const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/team-member-admin`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.supabasePublishableKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'delete', user_id: member.user_id }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    button.disabled = false;
    throw new Error(payload.error || 'Gebruiker kon niet worden verwijderd.');
  }

  await loadIdentityState();
  setTeamMessage(`${member.display_name} is definitief verwijderd.`);
  refreshVisibleTeam();
}

function enhanceRow(row) {
  if (row.classList.contains('team-head') || row.dataset.identityEnhanced === 'true') return;
  const member = memberForRow(row);
  if (!member) return;

  row.dataset.identityEnhanced = 'true';
  const identityCell = row.firstElementChild;
  const name = identityCell?.querySelector('strong');
  const email = identityCell?.querySelector('small');
  if (identityCell && name && email) {
    identityCell.classList.add('member-identity');
    const copy = document.createElement('span');
    copy.className = 'member-identity-copy';
    identityCell.insertBefore(copy, name);
    copy.appendChild(name);
    copy.appendChild(email);
    identityCell.insertBefore(buildAvatar(member), copy);
  }

  if (currentMember?.role !== 'ADMIN') return;
  const actions = row.querySelector('.team-actions');
  if (!actions) return;
  actions.classList.add('team-actions-expanded');

  const rename = document.createElement('button');
  rename.type = 'button';
  rename.className = 'ghost compact-action';
  rename.textContent = 'Naam';
  rename.title = 'Weergavenaam wijzigen';
  rename.addEventListener('click', () => openRenameDialog(member));
  actions.prepend(rename);

  if (member.user_id === currentMember.user_id) return;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'ghost compact-action danger-action';
  remove.textContent = 'Verwijder';

  const responsibilityCount = Number(row.children[3]?.textContent || 0)
    + Number(row.children[4]?.textContent || 0)
    + Number(row.children[5]?.textContent || 0);
  if (responsibilityCount > 0) {
    remove.disabled = true;
    remove.title = 'Draag eerst alle actieve verantwoordelijkheden over.';
  } else {
    remove.title = 'Alleen mogelijk zolang er geen dossierhistorie bestaat.';
  }

  remove.addEventListener('click', async () => {
    try {
      await deleteMember(member, remove);
    } catch (error) {
      setTeamMessage(error.message, true);
    }
  });
  actions.appendChild(remove);
}

function enhanceTeam() {
  document.querySelectorAll('#teamView .team-row').forEach(enhanceRow);
}

function updateCurrentIdentity() {
  if (!currentMember) return;
  const account = document.getElementById('userEmail');
  if (!account) return;
  account.textContent = currentMember.display_name;
  account.title = `${currentMember.email} · ${currentMember.role}`;
}

async function initialize() {
  if (!await loadIdentityState()) return;
  updateCurrentIdentity();
  enhanceTeam();
  if (!observer) {
    observer = new MutationObserver(enhanceTeam);
    observer.observe(document.getElementById('appView') || document.body, { childList: true, subtree: true });
  }
}

initialize().catch(console.error);
db?.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') initialize().catch(console.error);
});
