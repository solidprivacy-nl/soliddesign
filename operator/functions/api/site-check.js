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

function cleanText(value, max = 240) {
  return value
    ? value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : null;
}

function extractMeta(html) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta\b[^>]*(?:name=["']description["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*name=["']description["'])[^>]*>/i);
  return {
    title: cleanText(titleMatch?.[1]),
    description: cleanText(descriptionMatch?.[1] || descriptionMatch?.[2])
  };
}

function htmlSignals(html) {
  const lower = html.toLowerCase();
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const actionText = text.toLowerCase();

  const hasViewport = /<meta\b[^>]*name=["']viewport["']/i.test(html);
  const hasDescription = /<meta\b[^>]*name=["']description["']/i.test(html);
  const hasH1 = /<h1\b/i.test(html);
  const hasTel = /href\s*=\s*["']tel:/i.test(html);
  const hasMailto = /href\s*=\s*["']mailto:/i.test(html);
  const hasForm = /<form\b/i.test(html);
  const hasCta = /(contact|offerte|afspraak|bel\s|bellen|boek|boeken|reserveer|reserveren|plan\s|maak een afspraak|get a quote|book now|contact us|call now)/i.test(actionText);
  const hasEcommerce = /(shopify|woocommerce|\/cart\b|\/checkout\b|winkelmand|shopping cart|add to cart)/i.test(lower);
  const hasPortal = /(\/login\b|\/signin\b|client portal|customer portal|mijn account|dashboard)/i.test(lower);
  const hasExternalBooking = /(treatwell|salonized|fresha|calendly|simplybook|booksy|shore\.com|timify)/i.test(lower);
  const scriptCount = (html.match(/<script\b/gi) || []).length;
  const renderingLimited = text.length < 350 && scriptCount >= 4;

  return {
    has_viewport: hasViewport,
    has_meta_description: hasDescription,
    has_h1: hasH1,
    has_tel: hasTel,
    has_mailto: hasMailto,
    has_form: hasForm,
    has_cta_language: hasCta,
    has_ecommerce: hasEcommerce,
    has_portal: hasPortal,
    has_external_booking: hasExternalBooking,
    rendering_limited: renderingLimited,
    visible_text_chars: Math.min(text.length, 100000),
    script_count: scriptCount
  };
}

function buildTriage({ reachable, contentType, finalUrl, html, error, status }) {
  const checkedAt = new Date().toISOString();
  const htmlResponse = Boolean(contentType?.toLowerCase().includes('html') && html);
  const hardGates = {
    website_reachable: Boolean(reachable),
    html_response: htmlResponse
  };

  if (!reachable || !htmlResponse) {
    return {
      version: 'discovery-triage-v1',
      verdict: 'WEAK',
      checked_at: checkedAt,
      hard_gates: hardGates,
      conversion_opportunity: { score: null, evidence: [] },
      execution_fit: { score: null, evidence: [] },
      unknown_factors: ['customer_economics', 'existing_demand', 'competitive_context'],
      evidence: [error || `Website gaf geen bruikbare HTML-response (${status || 'onbekend'}).`]
    };
  }

  const signals = htmlSignals(html);
  if (signals.rendering_limited) {
    return {
      version: 'discovery-triage-v1',
      verdict: 'POSSIBLE',
      checked_at: checkedAt,
      hard_gates: hardGates,
      conversion_opportunity: {
        score: null,
        evidence: ['Server-HTML bevat te weinig zichtbare inhoud voor betrouwbare lichte beoordeling.']
      },
      execution_fit: {
        score: signals.has_ecommerce || signals.has_portal ? 2 : 4,
        evidence: [signals.has_ecommerce || signals.has_portal ? 'Complexe commerce/portal-signalen aangetroffen.' : 'Geen duidelijke complexe commerce/portal-signalen aangetroffen.']
      },
      unknown_factors: ['customer_economics', 'existing_demand', 'competitive_context'],
      signals
    };
  }

  const issues = [];
  if (!signals.has_viewport) issues.push('Geen viewport-meta aangetroffen.');
  if (!signals.has_meta_description) issues.push('Geen meta description aangetroffen.');
  if (!signals.has_h1) issues.push('Geen H1 aangetroffen.');
  if (!signals.has_cta_language) issues.push('Geen duidelijke CTA-taal aangetroffen.');
  if (!(signals.has_tel || signals.has_mailto || signals.has_form || signals.has_external_booking)) {
    issues.push('Geen direct contact-, formulier- of boekingspad aangetroffen.');
  }

  const opportunityScore = issues.length >= 4 ? 5 : issues.length === 3 ? 4 : issues.length === 2 ? 3 : issues.length === 1 ? 2 : 1;
  let executionScore = 5;
  const executionEvidence = [];
  if (signals.has_ecommerce && signals.has_portal) {
    executionScore = 1;
    executionEvidence.push('Commerce én portal/login-signalen wijzen op hoge uitvoeringscomplexiteit.');
  } else if (signals.has_ecommerce || signals.has_portal) {
    executionScore = 2;
    executionEvidence.push(signals.has_ecommerce ? 'Commerce-signalen wijzen op integratiecomplexiteit.' : 'Portal/login-signalen wijzen op integratiecomplexiteit.');
  } else if (signals.has_external_booking) {
    executionScore = 4;
    executionEvidence.push('Externe boekingsdienst aangetroffen; doorgaans eenvoudig als link/embeddable flow te behouden.');
  } else {
    executionEvidence.push('Geen duidelijke commerce-, portal- of complexe app-signalen aangetroffen.');
  }

  let verdict = 'POSSIBLE';
  if (executionScore <= 2 || opportunityScore <= 1) verdict = 'WEAK';
  else if (opportunityScore >= 3 && executionScore >= 3) verdict = 'STRONG';

  return {
    version: 'discovery-triage-v1',
    verdict,
    checked_at: checkedAt,
    hard_gates: hardGates,
    conversion_opportunity: {
      score: opportunityScore,
      evidence: issues.length ? issues : ['Basale on-page conversiesignalen zijn aanwezig; lichte preflight ziet weinig evidente frictie.']
    },
    execution_fit: {
      score: executionScore,
      evidence: executionEvidence
    },
    unknown_factors: ['customer_economics', 'existing_demand', 'competitive_context'],
    evidence: [`HTTP ${status} op ${finalUrl}`],
    signals
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
          'User-Agent': 'SolidDesign-Website-Preflight/0.2'
        },
        signal: AbortSignal.timeout(15000)
      });
    } catch (error) {
      const result = {
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
      return { ...result, triage: buildTriage({ ...result, finalUrl: result.final_url, contentType: result.content_type, html: '' }) };
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
    const result = {
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
    return {
      ...result,
      triage: buildTriage({
        reachable,
        contentType,
        finalUrl: result.final_url,
        html,
        error: result.error,
        status: response.status
      })
    };
  }

  const result = {
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
  return { ...result, triage: buildTriage({ ...result, finalUrl: result.final_url, contentType: result.content_type, html: '' }) };
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
