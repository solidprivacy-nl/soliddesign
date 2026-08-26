const BUCKET = 'mockup-sites';
const FUNCTION_NAME = 'mockup-preview';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MIME_TYPES = {
  html: 'text/html;charset=utf-8',
  htm: 'text/html;charset=utf-8',
  css: 'text/css;charset=utf-8',
  js: 'application/javascript;charset=utf-8',
  mjs: 'application/javascript;charset=utf-8',
  json: 'application/json;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  xml: 'application/xml;charset=utf-8',
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
  webm: 'video/webm',
};

function text(status, message) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

function decodePath(pathname) {
  try {
    return pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
}

function safeAssetPath(parts, directoryRequest) {
  const assetParts = [...parts];
  if (!assetParts.length || directoryRequest) assetParts.push('index.html');
  if (assetParts.some((part) => !part || part === '.' || part === '..' || part.includes('/') || part.includes('\\') || part.includes('\0'))) {
    return null;
  }
  return assetParts.join('/');
}

function storageUrl(baseUrl, path) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

function extension(path) {
  const name = path.split('/').at(-1) || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

async function fetchStorage(baseUrl, path, cacheControl, method) {
  const upstream = await fetch(storageUrl(baseUrl, path), { cache: 'no-store' });
  if (!upstream.ok) return text(upstream.status === 404 ? 404 : 502, upstream.status === 404 ? 'Niet gevonden.' : 'Preview kon niet worden geladen.');

  const headers = new Headers();
  headers.set('Content-Type', MIME_TYPES[extension(path)] || upstream.headers.get('Content-Type') || 'application/octet-stream');
  headers.set('Cache-Control', cacheControl);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  const length = upstream.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);

  return new Response(method === 'HEAD' ? null : upstream.body, { status: 200, headers });
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return text(405, 'Alleen GET en HEAD zijn toegestaan.');

  const baseUrl = Deno.env.get('SUPABASE_URL');
  if (!baseUrl) return text(500, 'Previewconfiguratie ontbreekt.');

  const url = new URL(req.url);
  const segments = decodePath(url.pathname);
  if (!segments) return text(400, 'Ongeldig pad.');
  const fnIndex = segments.lastIndexOf(FUNCTION_NAME);
  if (fnIndex < 0) return text(404, 'Niet gevonden.');
  const route = segments.slice(fnIndex + 1);
  const directoryRequest = url.pathname.endsWith('/');

  if (route[0] === 'v') {
    const prospectId = route[1];
    const demoId = route[2];
    if (!UUID_RE.test(prospectId || '') || !UUID_RE.test(demoId || '')) return text(404, 'Niet gevonden.');
    const asset = safeAssetPath(route.slice(3), directoryRequest);
    if (!asset) return text(400, 'Ongeldig assetpad.');
    return fetchStorage(baseUrl, `versions/${prospectId}/${demoId}/${asset}`, 'public, max-age=31536000, immutable', req.method);
  }

  if (route[0] === 'p') {
    const prospectId = route[1];
    if (!UUID_RE.test(prospectId || '')) return text(404, 'Niet gevonden.');

    const manifestResponse = await fetch(`${storageUrl(baseUrl, `live/${prospectId}/manifest.json`)}?v=${Date.now()}`, { cache: 'no-store' });
    if (!manifestResponse.ok) return text(404, 'Nog geen live mock-up.');

    let manifest;
    try {
      manifest = await manifestResponse.json();
    } catch {
      return text(502, 'Live previewmanifest is ongeldig.');
    }

    if (manifest.external_url) {
      let target;
      try {
        target = new URL(manifest.external_url);
      } catch {
        return text(502, 'Live previewmanifest is ongeldig.');
      }
      if (target.protocol !== 'https:') return text(502, 'Live previewmanifest is ongeldig.');
      if (route.length > 2) return text(404, 'Niet gevonden.');
      return new Response(null, {
        status: 302,
        headers: {
          Location: target.toString(),
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'Referrer-Policy': 'no-referrer',
        },
      });
    }

    const expectedPrefix = `versions/${prospectId}/`;
    if (!manifest.artifact_path || !manifest.artifact_path.startsWith(expectedPrefix)) return text(502, 'Live previewmanifest is ongeldig.');
    const demoId = manifest.artifact_path.slice(expectedPrefix.length);
    if (!UUID_RE.test(demoId) || manifest.artifact_path !== `${expectedPrefix}${demoId}`) return text(502, 'Live previewmanifest is ongeldig.');

    const asset = safeAssetPath(route.slice(2), directoryRequest);
    if (!asset) return text(400, 'Ongeldig assetpad.');
    return fetchStorage(baseUrl, `${manifest.artifact_path}/${asset}`, 'no-store', req.method);
  }

  return text(404, 'Niet gevonden.');
});
