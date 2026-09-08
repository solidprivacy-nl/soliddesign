const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const DEFAULT_INTERNAL_ORIGIN = 'https://soliddesign-cms.pages.dev';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function configuredInternalOrigin(env) {
  const raw = String(env?.SOLIDDESIGN_INTERNAL_ORIGIN || DEFAULT_INTERNAL_ORIGIN).trim();
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_INTERNAL_ORIGIN;
  }
}

async function activeTeamMember(request) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/operator_is_active_team_member`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  if (!response.ok) return false;
  return (await response.json().catch(() => false)) === true;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (
    context.request.method === 'POST'
    && url.pathname === '/api/prompt-library'
    && url.origin !== configuredInternalOrigin(context.env)
  ) {
    return json({ error: 'Promptwijzigingen zijn alleen toegestaan vanuit de productie-CMS.' }, 403);
  }

  if (!(await activeTeamMember(context.request))) {
    return json({ error: 'Niet geautoriseerd.' }, 401);
  }
  return context.next();
}
