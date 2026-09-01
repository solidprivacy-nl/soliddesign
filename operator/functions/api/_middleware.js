const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
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
  if (!(await activeTeamMember(context.request))) {
    return json({ error: 'Niet geautoriseerd.' }, 401);
  }
  return context.next();
}
