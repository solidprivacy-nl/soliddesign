(() => {
  'use strict';

  const CONFIG = window.SOLIDDESIGN_OPERATOR_CONFIG;
  const prompts = window.SOLIDDESIGN_PROMPTS;
  if (!CONFIG?.supabaseUrl || !CONFIG?.supabasePublishableKey || !window.supabase || !prompts) return;

  const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey);
  const detailPanel = document.getElementById('detailPanel');
  if (!detailPanel) return;

  const PROMPT_SLUG = 'website-opportunity-review';

  function setMessage(card, text, isError = false) {
    const node = card?.querySelector('[data-website-opportunity-message]');
    if (!node) return;
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(isError));
  }

  function oneLine(value) {
    return String(value ?? '').replace(/\s+/g, ' ').replaceAll('```', '').trim();
  }

  function selectedIdentity(root) {
    const name = root.querySelector('[data-field="name"]')?.textContent?.trim() || '';
    const website = root.querySelector('[data-field="websiteUrl"]')?.textContent?.trim() || '';
    if (!name || !website || website === '—') return null;
    return { name, website };
  }

  async function loadContext(root) {
    const identity = selectedIdentity(root);
    if (!identity) return null;

    const { data: prospects, error: prospectError } = await db
      .from('prospects')
      .select('id,name,website_url,qualification')
      .eq('name', identity.name)
      .eq('website_url', identity.website)
      .limit(2);
    if (prospectError) throw prospectError;
    if (!Array.isArray(prospects) || prospects.length !== 1) return null;

    const prospect = prospects[0];
    const { data: audits, error: auditError } = await db
      .from('audits')
      .select('id,score,grade,findings,source,source_version,created_at')
      .eq('prospect_id', prospect.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (auditError) throw auditError;

    return {
      prospect,
      audit: audits?.[0] || null,
      opportunity: prospect.qualification?.website_opportunity || null
    };
  }

  function promptAuditEvidence(audit) {
    if (!audit) return 'Geen actuele audit-evidence beschikbaar.';
    const findings = (Array.isArray(audit.findings) ? audit.findings : [])
      .filter((finding) => finding && finding.verified !== false)
      .map((finding) => ({
        key: finding.key,
        severity: finding.severity,
        title: finding.title,
        evidence: Array.isArray(finding.evidence) ? finding.evidence : [],
        business_impact: finding.business_impact || '',
        recommendation: finding.recommendation || ''
      }));
    return JSON.stringify({
      audit_id: audit.id,
      source: [audit.source, audit.source_version].filter(Boolean).join(' / ') || null,
      score: audit.score,
      grade: audit.grade,
      created_at: audit.created_at,
      findings
    }, null, 2);
  }

  function parseReview(raw) {
    let text = String(raw || '').trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    if (!text) throw new Error('Plak eerst het beoordeelde JSON-resultaat.');
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw new Error('Het resultaat is geen geldige JSON.');
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Het resultaat moet één JSON-object zijn.');
    if (!value.source_audit_id || typeof value.source_audit_id !== 'string') throw new Error('source_audit_id ontbreekt.');
    if (!Array.isArray(value.findings)) throw new Error('findings moet een array zijn.');
    return value;
  }

  function currentOpportunity(context) {
    const opportunity = context?.opportunity;
    return opportunity && typeof opportunity === 'object' && Array.isArray(opportunity.findings)
      ? opportunity
      : null;
  }

  function isStale(context) {
    const opportunity = currentOpportunity(context);
    return Boolean(opportunity?.source_audit_id && context?.audit?.id && opportunity.source_audit_id !== context.audit.id);
  }

  function makeFindingList(findings, { includeImpact = true } = {}) {
    const list = document.createElement('ol');
    list.className = 'website-opportunity-list';
    for (const finding of findings) {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = oneLine(finding.title || finding.key || 'Websitekans');
      item.appendChild(title);
      if (includeImpact && oneLine(finding.business_impact)) {
        const impact = document.createElement('div');
        impact.className = 'subtle';
        impact.textContent = oneLine(finding.business_impact);
        item.appendChild(impact);
      }
      list.appendChild(item);
    }
    return list;
  }

  function opportunityPlainText(opportunity) {
    const findings = Array.isArray(opportunity?.findings) ? opportunity.findings : [];
    return findings.map((finding, index) => {
      const evidence = Array.isArray(finding.evidence) ? finding.evidence.map(oneLine).filter(Boolean).join('; ') : '';
      return [
        `${index + 1}. ${oneLine(finding.title || finding.key || 'Websitekans')}`,
        evidence ? `Bewijs: ${evidence}` : '',
        oneLine(finding.business_impact) ? `Waarom dit telt: ${oneLine(finding.business_impact)}` : '',
        oneLine(finding.recommendation) ? `Richting: ${oneLine(finding.recommendation)}` : ''
      ].filter(Boolean).join('\n');
    }).join('\n\n');
  }

  function buildCard() {
    const card = document.createElement('section');
    card.className = 'card website-opportunity-card';
    card.dataset.websiteOpportunityCard = 'true';
    card.innerHTML = `
      <div class="section-heading">
        <div>
          <h3>Websitekansen</h3>
          <p class="subtle">Business-first beoordeling van de huidige website. Dezelfde goedgekeurde kansen sturen Design en Print.</p>
        </div>
      </div>
      <div data-website-opportunity-state></div>
      <div class="save-row">
        <div></div>
        <button type="button" class="primary" data-website-opportunity-copy>Kopieer analyseopdracht</button>
      </div>
      <details data-website-opportunity-import-details>
        <summary>Importeer beoordeeld resultaat</summary>
        <label>Website Opportunity JSON
          <textarea rows="10" data-website-opportunity-json placeholder='{"source_audit_id":"…","findings":[…]}'></textarea>
        </label>
        <div class="save-row">
          <div class="subtle">Alleen dit prospectonderdeel wordt bijgewerkt; audit-evidence blijft ongemoeid.</div>
          <button type="button" class="secondary" data-website-opportunity-import>Importeer resultaat</button>
        </div>
      </details>
      <p class="message" data-website-opportunity-message aria-live="polite"></p>`;
    return card;
  }

  function renderCard(card, context) {
    const state = card.querySelector('[data-website-opportunity-state]');
    const copy = card.querySelector('[data-website-opportunity-copy]');
    state.replaceChildren();

    if (!context.audit) {
      const text = document.createElement('p');
      text.className = 'subtle';
      text.textContent = 'Nog geen actuele website-audit beschikbaar. Rond eerst de bestaande prospectvoorbereiding af.';
      state.appendChild(text);
      copy.disabled = true;
      return;
    }

    copy.disabled = false;
    const opportunity = currentOpportunity(context);
    if (!opportunity) {
      const text = document.createElement('p');
      text.className = 'subtle';
      text.textContent = 'Nog niet inhoudelijk beoordeeld.';
      state.appendChild(text);
      copy.textContent = 'Kopieer analyseopdracht';
      return;
    }

    if (isStale(context)) {
      const warning = document.createElement('p');
      warning.className = 'message error';
      warning.textContent = 'Gebaseerd op eerdere website-evidence. Beoordeel opnieuw voordat je deze kansen extern gebruikt.';
      state.appendChild(warning);
    }

    if (opportunity.findings.length) {
      state.appendChild(makeFindingList(opportunity.findings));
    } else {
      const empty = document.createElement('p');
      empty.className = 'subtle';
      empty.textContent = 'Beoordeeld: geen materiële websitekansen vastgelegd.';
      state.appendChild(empty);
    }
    copy.textContent = 'Opnieuw analyseren';
  }

  function syncPrintProjection(root, context) {
    const mailing = root.querySelector('[data-mailing-design]');
    if (!mailing) return;

    let projection = mailing.querySelector('[data-website-opportunity-print]');
    if (!projection) {
      projection = document.createElement('div');
      projection.dataset.websiteOpportunityPrint = 'true';
      projection.innerHTML = `
        <h4>Websitekansen voor deze mailing</h4>
        <div data-website-opportunity-print-state></div>
        <div class="save-row">
          <p class="subtle">Gebruik echte before/after-beelden en controleer vóór verzending dat QR/link en het getoonde concept overeenkomen.</p>
          <button type="button" class="secondary" data-website-opportunity-print-copy>Kopieer bevindingen</button>
        </div>`;
      const uploadGrid = mailing.querySelector('.mailing-upload-grid');
      if (uploadGrid) mailing.insertBefore(projection, uploadGrid);
      else mailing.appendChild(projection);
    }

    const state = projection.querySelector('[data-website-opportunity-print-state]');
    const copy = projection.querySelector('[data-website-opportunity-print-copy]');
    state.replaceChildren();
    const opportunity = currentOpportunity(context);

    if (!opportunity) {
      state.innerHTML = '<p class="subtle">Nog geen beoordeelde Website Opportunity Review. Maak die eerst in Overzicht.</p>';
      copy.disabled = true;
      return;
    }

    if (isStale(context)) {
      const warning = document.createElement('p');
      warning.className = 'message error';
      warning.textContent = 'Review is gebaseerd op eerdere audit-evidence; herbeoordeel vóór extern gebruik.';
      state.appendChild(warning);
    }

    if (opportunity.findings.length) state.appendChild(makeFindingList(opportunity.findings));
    else state.innerHTML = '<p class="subtle">De review bevat geen materiële bevindingen.</p>';

    copy.disabled = !opportunity.findings.length;
    copy.onclick = async () => {
      try {
        await prompts.writeClipboard(opportunityPlainText(opportunity));
        const mainCard = root.querySelector('[data-website-opportunity-card]');
        setMessage(mainCard, 'Websitekansen voor Print zijn gekopieerd.');
      } catch (error) {
        const mainCard = root.querySelector('[data-website-opportunity-card]');
        setMessage(mainCard, error.message || String(error), true);
      }
    };
  }

  async function copyAssignment(card, context) {
    if (!context.audit) throw new Error('Er is nog geen actuele audit beschikbaar.');
    await prompts.copy(PROMPT_SLUG, {
      prospect_name: context.prospect.name,
      website_url: context.prospect.website_url,
      source_audit_id: context.audit.id,
      audit_evidence: promptAuditEvidence(context.audit),
      operator_focus: ''
    });
    setMessage(card, 'Analyseopdracht gekopieerd voor ChatGPT.');
  }

  async function importReview(root, card, context) {
    const textarea = card.querySelector('[data-website-opportunity-json]');
    const parsed = parseReview(textarea.value);
    const button = card.querySelector('[data-website-opportunity-import]');
    button.disabled = true;
    setMessage(card, 'Beoordeeld resultaat opslaan…');
    try {
      const { data, error } = await db.rpc('operator_set_website_opportunity', {
        p_prospect_id: context.prospect.id,
        p_source_audit_id: parsed.source_audit_id,
        p_findings: parsed.findings
      });
      if (error) throw error;

      context.opportunity = data;
      context.prospect.qualification = {
        ...(context.prospect.qualification && typeof context.prospect.qualification === 'object' ? context.prospect.qualification : {}),
        website_opportunity: data
      };
      textarea.value = '';
      card.querySelector('[data-website-opportunity-import-details]').open = false;
      renderCard(card, context);
      syncPrintProjection(root, context);
      document.dispatchEvent(new CustomEvent('soliddesign:website-opportunity-updated', {
        detail: {
          prospectId: context.prospect.id,
          websiteOpportunity: data
        }
      }));
      document.dispatchEvent(new CustomEvent('soliddesign:prospect-activity-changed', {
        detail: { prospectId: context.prospect.id }
      }));
      setMessage(card, 'Websitekansen opgeslagen en beschikbaar voor Design en Print.');
    } finally {
      button.disabled = false;
    }
  }

  async function bind(root) {
    if (!root) return;
    if (root.dataset.websiteOpportunityBound === 'true') {
      const context = root.__websiteOpportunityContext;
      const mailing = root.querySelector('[data-mailing-design]');
      if (context && mailing && !mailing.querySelector('[data-website-opportunity-print]')) {
        syncPrintProjection(root, context);
      }
      return;
    }

    const overview = root.querySelector('[data-dossier-pane="overview"]');
    if (!overview) return;

    root.dataset.websiteOpportunityBound = 'true';
    try {
      const context = await loadContext(root);
      if (!root.isConnected || !context) {
        delete root.dataset.websiteOpportunityBound;
        return;
      }
      root.__websiteOpportunityContext = context;

      const card = buildCard();
      const summary = overview.querySelector('.dossier-summary-card');
      if (summary) summary.insertAdjacentElement('afterend', card);
      else overview.prepend(card);
      renderCard(card, context);
      syncPrintProjection(root, context);

      card.querySelector('[data-website-opportunity-copy]').addEventListener('click', async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        try {
          await copyAssignment(card, context);
        } catch (error) {
          setMessage(card, error.message || String(error), true);
        } finally {
          button.disabled = !context.audit;
        }
      });

      card.querySelector('[data-website-opportunity-import]').addEventListener('click', async () => {
        try {
          await importReview(root, card, context);
        } catch (error) {
          setMessage(card, error.message || String(error), true);
        }
      });
    } catch (error) {
      delete root.dataset.websiteOpportunityBound;
      console.error('SolidDesign Website Opportunity failed', error);
    }
  }

  function bindCurrent() {
    const root = detailPanel.querySelector('.detail-content');
    if (root) bind(root);
  }

  new MutationObserver(bindCurrent).observe(detailPanel, { childList: true, subtree: true });
  bindCurrent();
})();
