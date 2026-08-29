const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

async function prospectId(slug) {
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
  if (!response.ok) throw new Error(`prospect lookup failed (${response.status})`);
  const rows = await response.json();
  return Array.isArray(rows) && rows.length === 1 ? rows[0]?.id || null : null;
}

export async function onRequest({ request }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const incoming = new URL(request.url);
  let parts;
  try {
    parts = incoming.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return plain(400, 'Ongeldig pad.');
  }

  if (parts[0] !== 'prospect') return plain(404, 'Niet gevonden.');
  const slug = String(parts[1] || '').toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length > 63) return plain(404, 'Deze pagina is momenteel niet beschikbaar.');

  const rest = parts.slice(2);
  if (!rest.length && !incoming.pathname.endsWith('/')) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${incoming.origin}/prospect/${encodeURIComponent(slug)}/`,
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      }
    });
  }

  let id;
  try {
    id = await prospectId(slug);
  } catch (error) {
    console.error(error);
    return plain(502, 'Deze pagina is momenteel niet beschikbaar.');
  }
  if (!id) return plain(404, 'Deze pagina is momenteel niet beschikbaar.');

  const assetPath = rest.map(encodeURIComponent).join('/');
  const suffix = assetPath ? `/${assetPath}` : '/';
  const target = new URL(`/p/${id}${suffix}`, incoming.origin);
  target.search = incoming.search;

  const upstream = await fetch(target, {
    method: request.method,
    redirect: 'manual',
    headers: { Accept: request.headers.get('Accept') || '*/*' },
    cache: 'no-store'
  });

  const headers = new Headers(upstream.headers);
  headers.delete('set-cookie');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Referrer-Policy', 'no-referrer');

  const location = headers.get('Location');
  if (location?.startsWith(`${incoming.origin}/p/${id}`)) {
    headers.set('Location', location.replace(`${incoming.origin}/p/${id}`, `${incoming.origin}/prospect/${slug}`));
  }

  const response = new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });

  const isHtml = request.method === 'GET' && upstream.ok && (headers.get('Content-Type') || '').toLowerCase().includes('text/html');
  if (!isHtml) return response;

  const telemetryEndpoint = `${SUPABASE_URL}/functions/v1/prospect-engagement`;
  return new HTMLRewriter()
    .on('body', {
      element(element) {
        element.append(
          `<script id="soliddesignProspectEngagement" src="/prospect-engagement.js" data-slug="${slug}" data-endpoint="${telemetryEndpoint}"></script>`,
          { html: true }
        );
      }
    })
    .transform(response);
}
