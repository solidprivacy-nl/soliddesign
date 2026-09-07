const FUNCTION_NAME = 'mockup-preview';
const PAGES_PREVIEW_ORIGIN = 'https://soliddesign-cms.pages.dev';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function safeParts(parts) {
  return !parts.some((part) => !part || part === '.' || part === '..' || part.includes('/') || part.includes('\\') || part.includes('\0'));
}

function pagesTarget(path, search) {
  const target = new URL(path, PAGES_PREVIEW_ORIGIN);
  target.search = search;
  return target.toString();
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

Deno.serve((req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return text(405, 'Alleen GET en HEAD zijn toegestaan.');

  const url = new URL(req.url);
  const segments = decodePath(url.pathname);
  if (!segments) return text(400, 'Ongeldig pad.');
  const fnIndex = segments.lastIndexOf(FUNCTION_NAME);
  if (fnIndex < 0) return text(404, 'Niet gevonden.');
  const route = segments.slice(fnIndex + 1);
  const trailingSlash = url.pathname.endsWith('/');

  if (route[0] === 'v') {
    const prospectId = route[1];
    const demoId = route[2];
    const rest = route.slice(3);
    if (!UUID_RE.test(prospectId || '') || !UUID_RE.test(demoId || '') || !safeParts(rest)) return text(404, 'Niet gevonden.');

    let path = `/p/${encodeURIComponent(prospectId)}/v/${encodeURIComponent(demoId)}`;
    if (rest.length) path += `/${rest.map(encodeURIComponent).join('/')}`;
    if (!rest.length || trailingSlash) path += '/';
    return redirect(pagesTarget(path, url.search));
  }

  if (route[0] === 'p') {
    const prospectId = route[1];
    const rest = route.slice(2);
    if (!UUID_RE.test(prospectId || '') || !safeParts(rest)) return text(404, 'Niet gevonden.');

    let path = `/p/${encodeURIComponent(prospectId)}`;
    if (rest.length) path += `/${rest.map(encodeURIComponent).join('/')}`;
    if (!rest.length || trailingSlash) path += '/';
    return redirect(pagesTarget(path, url.search));
  }

  return text(404, 'Niet gevonden.');
});
