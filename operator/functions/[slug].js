const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(['api', 'brief', 'p', 'prospect', 'start-design']);

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();

  const slug = String(params.slug || '').toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length > 63 || RESERVED.has(slug)) return context.next();

  const incoming = new URL(request.url);
  const target = new URL(`/prospect/${encodeURIComponent(slug)}/`, incoming.origin);
  target.search = incoming.search;

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
