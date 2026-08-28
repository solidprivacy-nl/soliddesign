const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const BUCKET = 'mockup-sites';
const LEGACY_PREVIEW_ORIGIN = 'https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MIME_TYPES = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  mjs: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm'
};

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

function storageUrl(path) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

function extension(path) {
  const name = path.split('/').at(-1) || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function safeAsset(parts, directoryRequest) {
  const clean = [...parts];
  if (!clean.length || directoryRequest) clean.push('index.html');
  if (clean.some((part) => !part || part === '.' || part === '..' || part.includes('/') || part.includes('\\') || part.includes('\0'))) return null;
  return clean.join('/');
}

async function storedAsset(request, path, cacheControl) {
  const upstream = await fetch(storageUrl(path), { cache: 'no-store' });
  if (!upstream.ok) return plain(upstream.status === 404 ? 404 : 502, upstream.status === 404 ? 'Niet gevonden.' : 'Preview kon niet worden geladen.');

  const headers = new Headers();
  headers.set('Content-Type', MIME_TYPES[extension(path)] || upstream.headers.get('Content-Type') || 'application/octet-stream');
  headers.set('Content-Disposition', 'inline');
  headers.set('Cache-Control', cacheControl);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: 200,
    headers
  });
}

async function legacy(request) {
  const incoming = new URL(request.url);
  const target = `${LEGACY_PREVIEW_ORIGIN}${incoming.pathname}${incoming.search}`;
  const upstream = await fetch(target, { method: request.method, redirect: 'manual' });
  const headers = new Headers(upstream.headers);
  headers.delete('set-cookie');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  const location = headers.get('location');
  if (location?.startsWith(LEGACY_PREVIEW_ORIGIN)) {
    headers.set('location', `${incoming.origin}${location.slice(LEGACY_PREVIEW_ORIGIN.length)}`);
  }
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
}

export async function onRequest({ request }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const url = new URL(request.url);
  let segments;
  try {
    segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return plain(400, 'Ongeldig pad.');
  }

  if (segments[0] !== 'p' || !UUID_RE.test(segments[1] || '')) return plain(404, 'Niet gevonden.');
  const prospectId = segments[1];
  const rest = segments.slice(2);
  const directoryRequest = url.pathname.endsWith('/');

  // Immutable version preview: /p/<prospect>/v/<demo>/...
  if (rest[0] === 'v') {
    const demoId = rest[1];
    if (!UUID_RE.test(demoId || '')) return plain(404, 'Niet gevonden.');
    const asset = safeAsset(rest.slice(2), directoryRequest);
    if (!asset) return plain(400, 'Ongeldig assetpad.');
    return storedAsset(request, `versions/${prospectId}/${demoId}/${asset}`, 'public, max-age=31536000, immutable');
  }

  // Stable live preview: /p/<prospect>/...
  const manifestResponse = await fetch(`${storageUrl(`live/${prospectId}/manifest.json`)}?v=${Date.now()}`, { cache: 'no-store' });
  if (!manifestResponse.ok) return legacy(request);

  let manifest;
  try {
    manifest = await manifestResponse.json();
  } catch {
    return plain(502, 'Live previewmanifest is ongeldig.');
  }

  if (manifest.external_url) {
    if (rest.length) return plain(404, 'Niet gevonden.');
    let target;
    try {
      target = new URL(manifest.external_url);
    } catch {
      return plain(502, 'Live previewmanifest is ongeldig.');
    }
    if (target.protocol !== 'https:') return plain(502, 'Live previewmanifest is ongeldig.');
    return new Response(null, {
      status: 302,
      headers: {
        Location: target.toString(),
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Referrer-Policy': 'no-referrer'
      }
    });
  }

  const expectedPrefix = `versions/${prospectId}/`;
  if (!manifest.artifact_path || !manifest.artifact_path.startsWith(expectedPrefix)) return plain(502, 'Live previewmanifest is ongeldig.');
  const demoId = manifest.artifact_path.slice(expectedPrefix.length);
  if (!UUID_RE.test(demoId) || manifest.artifact_path !== `${expectedPrefix}${demoId}`) return plain(502, 'Live previewmanifest is ongeldig.');

  const asset = safeAsset(rest, directoryRequest);
  if (!asset) return plain(400, 'Ongeldig assetpad.');
  return storedAsset(request, `${manifest.artifact_path}/${asset}`, 'no-store');
}
