const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const GITHUB_REPO = 'solidprivacy-nl/soliddesign';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function validProspectId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

async function authorizeAndLoadProspect(request, prospectId) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return null;

  const membershipResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/operator_is_active_team_member`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  if (!membershipResponse.ok) return null;
  const activeMember = await membershipResponse.json().catch(() => false);
  if (activeMember !== true) return null;

  const prospectResponse = await fetch(`${SUPABASE_URL}/rest/v1/prospects?id=eq.${encodeURIComponent(prospectId)}&select=id,state&limit=1`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Accept: 'application/json'
    }
  });
  if (!prospectResponse.ok) return null;
  const rows = await prospectResponse.json().catch(() => []);
  return Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function queuePreparation(request, prospectId, tokenHash) {
  const authorization = request.headers.get('Authorization') || '';
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/operator_queue_first_concept`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_id: prospectId, p_token_hash: tokenHash })
  });
  if (!response.ok) throw new Error(`Queue RPC failed (${response.status}).`);
  return Boolean(await response.json().catch(() => false));
}

async function dispatch(githubToken, prospectId, preparationToken) {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SolidDesign-CMS',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({
      event_type: 'prepare_prospect',
      client_payload: {
        prospect_id: prospectId,
        preparation_token: preparationToken
      }
    })
  });
  if (!response.ok) {
    const error = new Error(`GitHub dispatch failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Ongeldige JSON.' }, 400);
  }

  const prospectId = String(body?.prospect_id || '').trim();
  if (!validProspectId(prospectId)) return json({ error: 'Ongeldig prospect-id.' }, 400);

  const prospect = await authorizeAndLoadProspect(context.request, prospectId);
  if (!prospect) return json({ error: 'Niet geautoriseerd.' }, 401);
  if (['DISCOVERED', 'DISQUALIFIED'].includes(prospect.state)) {
    return json({ error: 'Voeg het bedrijf eerst toe aan Prospects.' }, 409);
  }

  const githubToken = context.env?.GITHUB_AUTOMATION_TOKEN || context.env?.GITHUB_SECTOR_INTELLIGENCE_TOKEN;
  if (!githubToken) return json({ error: 'Automatische voorbereiding is nog niet geconfigureerd.' }, 503);

  const preparationToken = randomToken();
  const tokenHash = await sha256Hex(preparationToken);

  try {
    const queued = await queuePreparation(context.request, prospectId, tokenHash);
    if (!queued) return json({ error: 'Prospect kon niet voor voorbereiding worden klaargezet.' }, 409);
    await dispatch(githubToken, prospectId, preparationToken);
    return json({ status: 'queued' });
  } catch (error) {
    console.error('Prospect preparation dispatch failed', error?.status || '', error);
    return json({ error: 'Automatische voorbereiding kon niet worden gestart. Probeer het vanuit Prospects opnieuw.' }, 502);
  }
}
