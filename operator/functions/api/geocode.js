const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MAX_LONGITUDE_SPAN = 2;
const MAX_LATITUDE_SPAN = 1.5;

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

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

export async function onRequestGet(context) {
  if (!(await authorize(context.request))) return json({ error: 'Niet geautoriseerd.' }, 401);

  const url = new URL(context.request.url);
  const query = (url.searchParams.get('q') || '').trim().replace(/\s+/g, ' ');
  if (!query || query.length > 120) return json({ error: 'Gebruik een locatie van 1–120 tekens.' }, 400);

  const cacheKey = new Request(`${url.origin}/api/geocode-cache?q=${encodeURIComponent(query.toLowerCase())}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      status: cached.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'private, max-age=0',
        'X-SolidDesign-Cache': 'HIT'
      }
    });
  }

  const upstream = new URL(NOMINATIM_URL);
  upstream.searchParams.set('format', 'jsonv2');
  upstream.searchParams.set('limit', '1');
  upstream.searchParams.set('countrycodes', 'nl');
  upstream.searchParams.set('q', query);

  let response;
  try {
    response = await fetch(upstream, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'nl,en;q=0.8',
        Referer: 'https://soliddesign-cms.pages.dev/',
        'User-Agent': 'SolidDesign/0.1 (+https://soliddesign-cms.pages.dev)'
      },
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    return json({ error: `Locatieservice niet bereikbaar: ${error.message || error}` }, 502);
  }
  if (!response.ok) return json({ error: `Locatieservice gaf HTTP ${response.status}.` }, 502);

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  const bbox = row?.boundingbox;
  if (!row || !Array.isArray(bbox) || bbox.length !== 4) {
    return json({ error: 'Locatie niet gevonden in Nederland.' }, 404);
  }

  const [south, north, west, east] = bbox.map(Number);
  if (![south, north, west, east].every(Number.isFinite) || west >= east || south >= north) {
    return json({ error: 'Locatieservice gaf een ongeldige bounding box.' }, 502);
  }
  if ((east - west) > MAX_LONGITUDE_SPAN || (north - south) > MAX_LATITUDE_SPAN) {
    return json({ error: 'Locatie is te groot voor een handmatige discovery-run. Gebruik een stad, gemeente of kleiner gebied.' }, 400);
  }

  const payload = {
    display_name: row.display_name || query,
    west,
    south,
    east,
    north
  };
  const cacheResponse = json(payload, 200, { 'Cache-Control': 'public, max-age=604800' });
  context.waitUntil(cache.put(cacheKey, cacheResponse.clone()));

  return json(payload, 200, { 'X-SolidDesign-Cache': 'MISS' });
}
