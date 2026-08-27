const SUPABASE_URL = 'https://grderdhnjkeucaaehgqy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh';
const TAXONOMY_URL = 'https://raw.githubusercontent.com/OvertureMaps/schema/main/docs/schema/concepts/by-theme/places/overture_categories.csv';
const MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
const MAX_TERMS = 12;
const MAX_TERM_LENGTH = 80;

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

function normalizeCode(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 _-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function loadTaxonomy() {
  const cache = caches.default;
  const cacheKey = new Request('https://soliddesign.internal/cache/overture-place-categories-v1');
  let response = await cache.match(cacheKey);

  if (!response) {
    const upstream = await fetch(TAXONOMY_URL, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(10000)
    });
    if (!upstream.ok) throw new Error(`Overture-taxonomie niet bereikbaar (${upstream.status}).`);
    const text = await upstream.text();
    response = new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400'
      }
    });
    await cache.put(cacheKey, response.clone());
  }

  const text = await response.text();
  const codes = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, '').trim();
    if (!line || line.startsWith('Category code;')) continue;
    const code = normalizeCode(line.split(';', 1)[0]);
    if (code) codes.add(code);
  }
  if (!codes.size) throw new Error('Overture-taxonomie kon niet worden gelezen.');
  return codes;
}

function parseAiResponse(result) {
  const response = result?.response;
  if (response && typeof response === 'object') return response;
  if (typeof response === 'string') return JSON.parse(response);
  throw new Error('Sectorresolver gaf geen bruikbaar antwoord.');
}

async function resolveWithAi(ai, terms) {
  const schema = {
    type: 'object',
    properties: {
      resolutions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'integer' },
            candidates: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 3
            }
          },
          required: ['index', 'candidates']
        }
      }
    },
    required: ['resolutions']
  };

  const numberedTerms = terms.map((term, index) => `${index}: ${term}`).join('\n');
  const result = await ai.run(MODEL, {
    messages: [
      {
        role: 'system',
        content: 'Map Dutch or English local-business search terms to likely Overture Maps Places category codes. Return lowercase English snake_case category-code candidates only. Prefer the business/profession category, not a broad parent. Examples: stukadoor -> plasterer; bakker -> bakery; loodgieter -> plumber. The caller validates every candidate against the official Overture taxonomy, so never add explanations.'
      },
      {
        role: 'user',
        content: `Resolve these terms. Preserve the numeric index and return up to three best category-code candidates per term, best first:\n${numberedTerms}`
      }
    ],
    temperature: 0,
    max_tokens: 320,
    response_format: {
      type: 'json_schema',
      json_schema: schema
    }
  });

  return parseAiResponse(result);
}

export async function onRequestPost(context) {
  if (!(await authorize(context.request))) return json({ error: 'Niet geautoriseerd.' }, 401);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Ongeldige JSON.' }, 400);
  }

  const rawTerms = Array.isArray(body?.terms) ? body.terms : [];
  const terms = rawTerms
    .map((term) => String(term || '').trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  if (!terms.length || terms.length > MAX_TERMS) {
    return json({ error: `Gebruik 1–${MAX_TERMS} sector-termen.` }, 400);
  }
  if (terms.some((term) => term.length > MAX_TERM_LENGTH)) {
    return json({ error: `Een sector-term mag maximaal ${MAX_TERM_LENGTH} tekens bevatten.` }, 400);
  }

  let taxonomy;
  try {
    taxonomy = await loadTaxonomy();
  } catch (error) {
    return json({ error: error.message || String(error) }, 502);
  }

  const resolutions = [];
  const pending = [];
  terms.forEach((term, index) => {
    const exact = normalizeCode(term);
    if (taxonomy.has(exact)) {
      resolutions.push({ term, code: exact, method: 'overture_exact' });
    } else {
      pending.push({ term, index });
    }
  });

  if (pending.length) {
    if (!context.env?.AI) {
      return json({ error: 'Automatische sectorresolutie is tijdelijk niet beschikbaar.' }, 503);
    }

    let aiPayload;
    try {
      aiPayload = await resolveWithAi(context.env.AI, pending.map((item) => item.term));
    } catch (error) {
      return json({ error: `Automatische sectorresolutie mislukt: ${error.message || error}` }, 502);
    }

    const byIndex = new Map();
    for (const item of Array.isArray(aiPayload?.resolutions) ? aiPayload.resolutions : []) {
      if (Number.isInteger(item?.index)) byIndex.set(item.index, item);
    }

    for (let localIndex = 0; localIndex < pending.length; localIndex += 1) {
      const item = pending[localIndex];
      const candidates = Array.isArray(byIndex.get(localIndex)?.candidates)
        ? byIndex.get(localIndex).candidates
        : [];
      const valid = candidates.map(normalizeCode).find((code) => taxonomy.has(code));
      if (valid) resolutions.push({ term: item.term, code: valid, method: 'workers_ai_validated' });
    }
  }

  const resolvedTerms = new Set(resolutions.map((item) => item.term));
  const unresolved = terms.filter((term) => !resolvedTerms.has(term));

  return json({
    resolutions,
    unresolved,
    model: pending.length ? MODEL : null,
    taxonomy_source: 'OvertureMaps/schema main'
  });
}
