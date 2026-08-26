const DESIGN_BRIEF_STORAGE_ORIGIN = 'https://grderdhnjkeucaaehgqy.supabase.co/storage/v1/object/public/design-briefs';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequest({ request, params }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const token = String(params.token || '');
  if (!UUID_RE.test(token)) return new Response('Not found', { status: 404 });

  const target = `${DESIGN_BRIEF_STORAGE_ORIGIN}/${encodeURIComponent(token)}.md`;
  const upstream = await fetch(target, { method: request.method, redirect: 'manual' });
  if (upstream.status === 404) return new Response('Design brief not published', { status: 404 });

  const headers = new Headers(upstream.headers);
  headers.delete('set-cookie');
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}
