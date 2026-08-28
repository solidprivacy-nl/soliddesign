(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const detailPanel = document.getElementById('detailPanel');
  let decorateTimer = null;
  let pollTimer = null;

  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => decorate().catch(console.error), 80);
  }

  async function sessionOrThrow() {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('Log opnieuw in om de voorbereiding te starten.');
    return session;
  }

  async function currentProspect(root) {
    const website = root.querySelector('[data-link="website"]')?.href;
    if (!website || website === '#') return null;
    const { data, error } = await db
      .from('prospects')
      .select('id,name,website_url,qualification')
      .eq('website_url', website)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  function setPreparationMessage(root, text, isError = false) {
    let node = root.querySelector('[data-preparation-message]');
    if (!node) {
      node = document.createElement('div');
      node.dataset.preparationMessage = 'true';
      node.className = 'subtle';
      root.querySelector('[data-field="liveMockup"]')?.appendChild(node);
    }
    node.textContent = text || '';
    node.classList.toggle('error-text', Boolean(isError));
  }

  function linkhubLabel(root, qualification) {
    const kind = qualification?.preparation?.site_kind || qualification?.triage?.site_kind;
    if (kind !== 'LINKHUB') return;
    const score = root.querySelector('[data-field="auditScore"]');
    const grade = root.querySelector('[data-field="auditGrade"]');
    const summary = root.querySelector('[data-field="auditSummary"]');
    if (score && !root.querySelector('[data-action="report"]')?.disabled) score.textContent = 'n.v.t.';
    if (grade && !root.querySelector('[data-action="report"]')?.disabled) grade.textContent = 'Geen zelfstandige website';
    if (summary && !root.querySelector('[data-action="report"]')?.disabled) summary.textContent = 'Geen zelfstandige website gevonden';
  }

  async function requestPreparation(prospectId) {
    const session = await sessionOrThrow();
    const response = await fetch('/api/prepare-prospect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prospect_id: prospectId })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Voorbereiding kon niet worden gestart (${response.status}).`);
    return payload;
  }

  function startPolling(prospectId) {
    clearTimeout(pollTimer);
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      const { data, error } = await db
        .from('prospects')
        .select('qualification')
        .eq('id', prospectId)
        .single();
      if (error) return;
      const status = data?.qualification?.preparation?.status;
      if (status === 'COMPLETE') {
        document.getElementById('refreshBtn')?.click();
        return;
      }
      if (status === 'FAILED') {
        scheduleDecorate();
        return;
      }
      if (attempts < 24) pollTimer = setTimeout(check, 5000);
    };
    pollTimer = setTimeout(check, 5000);
  }

  async function decorate() {
    const root = detailPanel?.querySelector('.detail-content');
    if (!root) return;

    const prospect = await currentProspect(root);
    if (!prospect) return;
    linkhubLabel(root, prospect.qualification);

    const reportMissing = Boolean(root.querySelector('[data-action="report"]')?.disabled);
    const liveMissing = root.querySelector('[data-field="liveMockup"] strong')?.textContent === 'Nog geen live mock-up';
    if (!reportMissing && !liveMissing) return;

    const liveBox = root.querySelector('[data-field="liveMockup"]');
    if (!liveBox || liveBox.querySelector('[data-preparation-action]')) return;

    const preparation = prospect.qualification?.preparation || {};
    const status = preparation.status;
    if (status === 'QUEUED' || status === 'RUNNING') {
      setPreparationMessage(root, 'Technisch rapport en eerste mock-up worden voorbereid…');
      startPolling(prospect.id);
      return;
    }

    const intro = liveBox.querySelector('.subtle');
    if (intro) {
      intro.textContent = status === 'FAILED'
        ? 'De automatische voorbereiding is niet afgerond. Probeer hem opnieuw.'
        : 'Het technisch rapport en de eerste mock-up zijn nog niet voorbereid.';
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.dataset.preparationAction = 'start';
    button.textContent = status === 'FAILED' ? 'Probeer voorbereiding opnieuw' : 'Start eerste beoordeling en mock-up';
    button.addEventListener('click', async () => {
      button.disabled = true;
      setPreparationMessage(root, 'Voorbereiding starten…');
      try {
        await requestPreparation(prospect.id);
        button.remove();
        setPreparationMessage(root, 'Technisch rapport en eerste mock-up worden voorbereid…');
        startPolling(prospect.id);
      } catch (error) {
        button.disabled = false;
        setPreparationMessage(root, error.message || String(error), true);
      }
    });
    liveBox.appendChild(button);
  }

  if (detailPanel) {
    new MutationObserver(scheduleDecorate).observe(detailPanel, { childList: true, subtree: true });
  }
  document.getElementById('refreshBtn')?.addEventListener('click', scheduleDecorate);
  scheduleDecorate();
})();
