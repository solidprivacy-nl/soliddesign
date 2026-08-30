const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEGACY_PREVIEW_HOSTS = new Map([
  ['gate3-v1.soliddesign-cms.pages.dev', 'gate3-v1.soliddesign-previews-solidprivacy.pages.dev'],
  ['soliddesign-previews-solidprivacy.pages.dev', 'soliddesign-previews-solidprivacy.pages.dev'],
  ['gate3-v1.soliddesign-previews-solidprivacy.pages.dev', 'gate3-v1.soliddesign-previews-solidprivacy.pages.dev']
]);

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

async function resolveLive(slug) {
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
  return { prospectId, live: demos[0] };
}

function filteredSearch(incoming) {
  const params = new URLSearchParams(incoming.search);
  params.delete('src');
  params.delete('__sd_staff');
  const value = params.toString();
  return value ? `?${value}` : '';
}

function legacyBase(previewUrl) {
  if (!previewUrl) return null;
  let url;
  try { url = new URL(previewUrl); }
  catch { return null; }
  const upstreamHost = LEGACY_PREVIEW_HOSTS.get(url.hostname);
  if (url.protocol !== 'https:' || !upstreamHost) return null;

  // Some historical records were rewritten to the shortened soliddesign-cms alias.
  // Proxying that alias would call the current Pages project again. Normalize it to
  // the original immutable legacy preview host instead.
  url.hostname = upstreamHost;
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  url.search = '';
  url.hash = '';
  return url;
}

function publicHeaders(upstreamHeaders) {
  const headers = new Headers(upstreamHeaders);
  headers.delete('set-cookie');
  headers.delete('content-length');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  return headers;
}

function injectTelemetry(response, slug) {
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

async function serveStored(request, incoming, slug, prospectId, rest) {
  const assetPath = rest.map(encodeURIComponent).join('/');
  const suffix = assetPath ? `/${assetPath}` : '/';
  const target = new URL(`/p/${prospectId}${suffix}`, incoming.origin);
  target.search = filteredSearch(incoming);

  const upstream = await fetch(target, {
    method: request.method,
    redirect: 'manual',
    headers: { Accept: request.headers.get('Accept') || '*/*' },
    cache: 'no-store'
  });
  const headers = publicHeaders(upstream.headers);

  const location = headers.get('Location');
  if (location?.startsWith(`${incoming.origin}/p/${prospectId}`)) {
    headers.set('Location', location.replace(`${incoming.origin}/p/${prospectId}`, `${incoming.origin}/prospect/${slug}`));
  } else if (location) {
    return plain(502, 'Deze pagina is momenteel niet beschikbaar.');
  }

  const response = new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
  const isHtml = request.method === 'GET' && upstream.ok && (headers.get('Content-Type') || '').toLowerCase().includes('text/html');
  return isHtml ? injectTelemetry(response, slug) : response;
}

async function serveLegacy(request, incoming, slug, previewUrl, rest) {
  const base = legacyBase(previewUrl);
  if (!base) return plain(503, 'Deze pagina is momenteel niet beschikbaar.');

  const relative = rest.map(encodeURIComponent).join('/');
  const target = relative ? new URL(relative, base) : new URL(base);
  target.search = filteredSearch(incoming);
  const upstream = await fetch(target, {
    method: request.method,
    redirect: 'manual',
    headers: { Accept: request.headers.get('Accept') || '*/*' },
    cache: 'no-store'
  });
  const headers = publicHeaders(upstream.headers);

  const location = headers.get('Location');
  if (location) {
    let redirected;
    try { redirected = new URL(location, target); }
    catch { return plain(502, 'Deze pagina is momenteel niet beschikbaar.'); }
    if (redirected.origin !== base.origin || !redirected.pathname.startsWith(base.pathname)) {
      return plain(502, 'Deze pagina is momenteel niet beschikbaar.');
    }
    const suffix = redirected.pathname.slice(base.pathname.length);
    headers.set('Location', `${incoming.origin}/prospect/${encodeURIComponent(slug)}/${suffix}${redirected.search}`);
  }

  const response = new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
  const isHtml = request.method === 'GET' && upstream.ok && (headers.get('Content-Type') || '').toLowerCase().includes('text/html');
  return isHtml ? injectTelemetry(response, slug) : response;
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
        Location: `${incoming.origin}/prospect/${encodeURIComponent(slug)}/${incoming.search}`,
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Referrer-Policy': 'no-referrer'
      }
    });
  }

  let resolved;
  try { resolved = await resolveLive(slug); }
  catch (error) {
    console.error(error);
    return plain(502, 'Deze pagina is momenteel niet beschikbaar.');
  }
  if (!resolved) return plain(404, 'Deze pagina is momenteel niet beschikbaar.');

  if (resolved.live.artifact_path) {
    return serveStored(request, incoming, slug, resolved.prospectId, rest);
  }
  return serveLegacy(request, incoming, slug, resolved.live.preview_url, rest);
}
