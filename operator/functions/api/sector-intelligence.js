const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const REPO = 'solidprivacy-nl/soliddesign';
const ROOT = 'sector-intelligence';

async function authorize(request) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY
    }
  });
  return response.ok;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function validKey(value) {
  const key = String(value || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,62}$/.test(key) ? key : null;
}

async function github(path, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SolidDesign-Operator',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers,
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`GitHub kon Sector Intelligence niet laden (${response.status}).`);
  return response.json();
}

export async function onRequestGet(context) {
  if (!(await authorize(context.request))) return json({ error: 'Niet geautoriseerd.' }, 401);

  const token = context.env?.GITHUB_SECTOR_INTELLIGENCE_TOKEN || '';
  try {
    const [files, pulls] = await Promise.all([
      github(`/contents/${ROOT}?ref=main`, token),
      github('/pulls?state=open&per_page=100', token)
    ]);

    const rows = new Map();
    for (const file of Array.isArray(files) ? files : []) {
      const match = String(file?.name || '').match(/^([a-z0-9][a-z0-9_-]{0,62})\.md$/);
      if (!match || match[1] === 'README') continue;
      const key = validKey(match[1]);
      if (!key) continue;
      rows.set(key, {
        canonical_sector_key: key,
        status: 'PUBLISHED',
        source_url: file.html_url || null,
        review_url: null
      });
    }

    for (const pull of Array.isArray(pulls) ? pulls : []) {
      const match = String(pull?.title || '').match(/^Sector Intelligence:\s*([a-z0-9][a-z0-9_-]{0,62})$/i);
      const key = validKey(match?.[1]);
      if (!key) continue;
      const current = rows.get(key);
      rows.set(key, {
        canonical_sector_key: key,
        status: current ? 'UPDATE_IN_REVIEW' : 'IN_REVIEW',
        source_url: current?.source_url || null,
        review_url: pull.html_url || null
      });
    }

    return json({
      sectors: [...rows.values()].sort((a, b) => a.canonical_sector_key.localeCompare(b.canonical_sector_key))
    });
  } catch (error) {
    return json({ error: error.message || String(error) }, 502);
  }
}
