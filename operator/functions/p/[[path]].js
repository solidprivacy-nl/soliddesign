const LEGACY_PREVIEW_ORIGIN = 'https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev';

export async function onRequest({ request }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

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

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}
