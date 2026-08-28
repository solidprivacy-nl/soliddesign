const DESIGN_BRIEF_STORAGE_ORIGIN = 'https://grderdhnjkeucaaehgqy.supabase.co/storage/v1/object/public/design-briefs';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_RE = /https?:\/\/[^\s<>"']+/g;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function linkifyPlainText(value) {
  let result = '';
  let offset = 0;

  for (const match of value.matchAll(URL_RE)) {
    const index = match.index ?? 0;
    const url = match[0];
    result += escapeHtml(value.slice(offset, index));
    result += `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`;
    offset = index + url.length;
  }

  return result + escapeHtml(value.slice(offset));
}

function responseHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  };
}

export async function onRequest({ request, params }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const token = String(params.token || '');
  if (!UUID_RE.test(token)) return new Response('Not found', { status: 404 });

  const target = `${DESIGN_BRIEF_STORAGE_ORIGIN}/${encodeURIComponent(token)}.md`;
  const upstream = await fetch(target, { method: request.method, redirect: 'manual', cache: 'no-store' });
  if (upstream.status === 404) return new Response('Design brief not published', { status: 404 });
  if (!upstream.ok) return new Response('Design brief unavailable', { status: 502 });

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: responseHeaders('text/html; charset=utf-8')
    });
  }

  const brief = await upstream.text();
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>SolidDesign Prospect Design Brief</title><style>html{background:#f6f4ef;color:#1d2822}body{margin:0}main{max-width:1040px;margin:0 auto;padding:40px 24px 64px}pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}a{color:#315e57;text-decoration-thickness:1px;text-underline-offset:2px}@media(max-width:640px){main{padding:24px 16px}pre{font-size:13px}}</style></head><body><main><pre>${linkifyPlainText(brief)}</pre></main></body></html>`;

  return new Response(body, {
    status: 200,
    headers: responseHeaders('text/html; charset=utf-8')
  });
}
