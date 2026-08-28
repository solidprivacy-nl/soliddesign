const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(['api', 'brief', 'p', 'start-design']);

function plain(status, message) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

async function apiRows(path, slug, params) {
  const endpoint = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  for (const [name, value] of Object.entries(params)) endpoint.searchParams.set(name, value);
  const response = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'x-soliddesign-prospect-slug': slug,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`${path} lookup failed (${response.status})`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows : [];
}

async function resolveRoute(slug, origin) {
  const prospects = await apiRows('prospects', slug, {
    select: 'id',
    public_slug: `eq.${slug}`,
    limit: '1'
  });
  if (prospects.length !== 1 || !prospects[0]?.id) return null;

  const prospectId = prospects[0].id;
  const demos = await apiRows('demos', slug, {
    select: 'preview_url,artifact_path',
    prospect_id: `eq.${prospectId}`,
    status: 'eq.LIVE',
    limit: '1'
  });
  if (demos.length !== 1) return null;

  const live = demos[0];
  if (live.artifact_path) return `${origin}/p/${prospectId}/`;
  if (!live.preview_url) return null;

  let legacy;
  try {
    legacy = new URL(live.preview_url);
  } catch {
    return null;
  }
  return legacy.protocol === 'https:' ? legacy.toString() : null;
}

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();

  const slug = String(params.slug || '').toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length > 63 || RESERVED.has(slug)) return context.next();

  const incoming = new URL(request.url);
  let target;
  try {
    target = await resolveRoute(slug, incoming.origin);
  } catch (error) {
    console.error(error);
    return plain(502, 'Prospectlink kon niet worden geladen.');
  }
  if (!target) return context.next();

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer'
    }
  });
}
