const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
const db = window.supabase?.createClient(CONFIG?.supabaseUrl, CONFIG?.supabasePublishableKey);

function hideSelfSignup() {
  const button = document.getElementById('signupBtn');
  if (button) button.classList.add('hidden');
  const loginCard = document.querySelector('#loginView .auth-card .muted');
  if (loginCard) loginCard.textContent = 'Log in met je SolidDesign-account. Nieuwe collega? Laat een Key user of Admin je uitnodigen.';
}

function setupOverlay() {
  if (document.getElementById('inviteSetupOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'inviteSetupOverlay';
  overlay.className = 'auth-shell invite-setup-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:var(--bg);overflow:auto;';
  overlay.innerHTML = `
    <section class="auth-card">
      <div class="brand">SolidDesign <span>Operator</span></div>
      <h1>Account activeren</h1>
      <p class="muted">Kies een wachtwoord om je uitnodiging af te ronden.</p>
      <form class="stack" data-invite-setup-form>
        <label>Nieuw wachtwoord<input name="password" type="password" autocomplete="new-password" minlength="8" required /></label>
        <label>Herhaal wachtwoord<input name="confirm" type="password" autocomplete="new-password" minlength="8" required /></label>
        <button type="submit" class="primary">Account activeren</button>
      </form>
      <button type="button" class="ghost full" data-invite-setup-signout>Uitloggen</button>
      <p class="message" data-invite-setup-message aria-live="polite"></p>
    </section>`;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('[data-invite-setup-form]');
  const message = overlay.querySelector('[data-invite-setup-message]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = form.elements.password.value;
    const confirm = form.elements.confirm.value;
    if (password.length < 8) {
      message.textContent = 'Gebruik een wachtwoord van minimaal 8 tekens.';
      message.classList.add('error');
      return;
    }
    if (password !== confirm) {
      message.textContent = 'De wachtwoorden zijn niet gelijk.';
      message.classList.add('error');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    message.classList.remove('error');
    message.textContent = 'Account activeren…';

    const { error } = await db.auth.updateUser({
      password,
      data: { solidDesignMustSetPassword: false }
    });
    if (error) {
      submit.disabled = false;
      message.textContent = error.message || 'Wachtwoord kon niet worden ingesteld.';
      message.classList.add('error');
      return;
    }

    const { error: joinedError } = await db.rpc('operator_mark_joined');
    if (joinedError) {
      submit.disabled = false;
      message.textContent = 'Account is geactiveerd, maar de teamstatus kon niet worden bijgewerkt. Vernieuw de pagina of log opnieuw in.';
      message.classList.add('error');
      return;
    }

    message.textContent = 'Account geactiveerd.';
    // Stay on the exact internal environment that accepted the invite. This keeps
    // PR acceptance isolated and naturally follows a later cms.<brand>.nl cutover.
    window.setTimeout(() => window.location.replace(window.location.origin), 250);
  });

  overlay.querySelector('[data-invite-setup-signout]').addEventListener('click', async () => {
    await db.auth.signOut();
    window.location.replace(window.location.origin);
  });
}

async function enforceInviteSetup() {
  if (!db) return;
  const { data: { session } } = await db.auth.getSession();
  if (session?.user?.user_metadata?.solidDesignMustSetPassword === true) setupOverlay();
}

hideSelfSignup();
enforceInviteSetup().catch(console.error);
db?.auth.onAuthStateChange((_event, session) => {
  if (session?.user?.user_metadata?.solidDesignMustSetPassword === true) setupOverlay();
});
