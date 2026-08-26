const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const MAX_REQUEST_BYTES = 4096;
const MAX_RESPONSE_BYTES = 262144;
const MAX_REDIRECTS = 5;

async function authorize(request) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_PUBLISHABLE_KEY
    }
  });
  return response.ok;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split('.').map(Number);
    if (parts.some((part) => part < 0 || part > 255)) return true;
    const [a, b] = parts;
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (host.includes(':')) {
    return (
      host === '::1' ||
      host === '::' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe8') ||
      host.startsWith('fe9') ||
      host.startsWith('fea') ||
      host.startsWith('feb')
    );
  }
  return false;
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.length > 2048) throw new Error('Gebruik een geldige website-URL.');
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Alleen http:// en https:// zijn toegestaan.');
  if (url.username || url.password) throw new Error('URL-credentials zijn niet toegestaan.');
  if (isBlockedHostname(url.hostname)) throw new Error('Lokale of private adressen zijn niet toegestaan.');
  url.hash = '';
  return url;
}

function websiteKey(url) {
  return url.hostname.toLowerCase().replace(/^www\./, '');
}

async function readBoundedText(response) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        const keep = value.byteLength - (total - MAX_RESPONSE_BYTES);
        if (keep > 0) chunks.push(value.slice(0, keep));
        break;
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const size = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function extractMeta(html) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta\b[^>]*(?:name=["']description["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*name=["']description["'])[^>]*>/i);
  const clean = (value) => value
    ? value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)
    : null;
  return {
    title: clean(titleMatch?.[1]),
    description: clean(descriptionMatch?.[1] || descriptionMatch?.[2])
  };
}

async function fetchWebsite(initialUrl) {
  let url = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          'User-Agent': 'SolidDesign-Website-Preflight/0.1'
        },
        signal: AbortSignal.timeout(15000)
      });
    } catch (error) {
      return {
        input_url: initialUrl.toString(),
        final_url: url.toString(),
        website_key: websiteKey(url),
        status: null,
        reachable: false,
        title: null,
        description: null,
        content_type: null,
        checked_at: new Date().toISOString(),
        error: `Fetch mislukt: ${error.message || error}`
      };
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('Location');
      await response.body?.cancel().catch(() => {});
      if (!location) break;
      url = normalizeUrl(new URL(location, url).toString());
      continue;
    }

    const contentType = response.headers.get('Content-Type') || '';
    const html = contentType.toLowerCase().includes('html') ? await readBoundedText(response) : '';
    if (!html) await response.body?.cancel().catch(() => {});
    const meta = extractMeta(html);
    const reachable = (
      (response.status >= 200 && response.status < 400) ||
      response.status === 401 ||
      response.status === 403 ||
      response.status === 429
    );
    return {
      input_url: initialUrl.toString(),
      final_url: url.toString(),
      website_key: websiteKey(url),
      status: response.status,
      reachable,
      title: meta.title,
      description: meta.description,
      content_type: contentType || null,
      checked_at: new Date().toISOString(),
      error: reachable ? null : `Website gaf HTTP ${response.status}.`
    };
  }

  return {
    input_url: initialUrl.toString(),
    final_url: url.toString(),
    website_key: websiteKey(url),
    status: null,
    reachable: false,
    title: null,
    description: null,
    content_type: null,
    checked_at: new Date().toISOString(),
    error: 'Te veel of ongeldige redirects.'
  };
}

export async function onRequestPost(context) {
  if (!(await authorize(context.request))) return json({ error: 'Niet geautoriseerd.' }, 401);

  const length = Number(context.request.headers.get('Content-Length') || 0);
  if (length > MAX_REQUEST_BYTES) return json({ error: 'Request is te groot.' }, 413);

  let text;
  try {
    text = await context.request.text();
  } catch {
    return json({ error: 'Request kon niet worden gelezen.' }, 400);
  }
  if (text.length > MAX_REQUEST_BYTES) return json({ error: 'Request is te groot.' }, 413);

  let input;
  try {
    input = JSON.parse(text);
  } catch {
    return json({ error: 'Ongeldige JSON.' }, 400);
  }

  let url;
  try {
    url = normalizeUrl(input?.url);
  } catch (error) {
    return json({ error: error.message || String(error) }, 400);
  }

  const result = await fetchWebsite(url);
  return json(result);
}
