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

async function resolveProspectId(slug) {
  const endpoint = new URL(`${SUPABASE_URL}/rest/v1/prospects`);
  endpoint.searchParams.set('select', 'id');
  endpoint.searchParams.set('public_slug', `eq.${slug}`);
  endpoint.searchParams.set('limit', '1');

  const response = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'x-soliddesign-prospect-slug': slug,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`slug lookup failed (${response.status})`);

  const rows = await response.json();
  return Array.isArray(rows) && rows.length === 1 ? rows[0]?.id || null : null;
}

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();

  const slug = String(params.slug || '').toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length > 63 || RESERVED.has(slug)) return context.next();

  let prospectId;
  try {
    prospectId = await resolveProspectId(slug);
  } catch (error) {
    console.error(error);
    return plain(502, 'Prospectlink kon niet worden geladen.');
  }
  if (!prospectId) return context.next();

  const incoming = new URL(request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${incoming.origin}/p/${prospectId}/`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer'
    }
  });
}
