const BUCKET = 'mockup-sites';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PREVIEW_BYTES = 500_000;
const MAX_REPORT_BYTES = 800_000;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function serviceHeaders(serviceKey: string, contentType = 'application/json', prefer?: string) {
  const headers: Record<string, string> = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': contentType,
    Accept: 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function serviceRequest(baseUrl: string, serviceKey: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...serviceHeaders(serviceKey),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!response.ok) {
    console.error('prospect-preparation upstream error', response.status, typeof payload === 'string' ? payload.slice(-800) : payload);
    throw new Error(`upstream ${response.status}`);
  }
  return payload;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function cleanQualification(row: any) {
  return row?.qualification && typeof row.qualification === 'object' ? { ...row.qualification } : {};
}

function preparationFrom(row: any) {
  const qualification = cleanQualification(row);
  return qualification.preparation && typeof qualification.preparation === 'object'
    ? { ...qualification.preparation }
    : {};
}

async function fetchProspect(baseUrl: string, serviceKey: string, prospectId: string) {
  const select = [
    'id','name','category','city','address','website_url','phone','rating','review_count','place_id',
    'discovery_source','discovery_version','source_confidence','operating_status','qualification','state','archived_at'
  ].join(',');
  const rows = await serviceRequest(
    baseUrl,
    serviceKey,
    `/rest/v1/prospects?id=eq.${encodeURIComponent(prospectId)}&select=${encodeURIComponent(select)}`
  );
  return Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
}

async function verifyCapability(baseUrl: string, serviceKey: string, prospectId: string, token: string) {
  if (!UUID_RE.test(prospectId) || typeof token !== 'string' || token.length < 32 || token.length > 256) return null;
  const row = await fetchProspect(baseUrl, serviceKey, prospectId);
  if (!row || row.archived_at || ['DISCOVERED', 'DISQUALIFIED'].includes(row.state)) return null;

  const preparation = preparationFrom(row);
  const expected = String(preparation.token_hash || '');
  const expiresAt = Date.parse(String(preparation.expires_at || ''));
  if (!/^[0-9a-f]{64}$/.test(expected) || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  const actual = await sha256Hex(token);
  if (!constantTimeEqual(actual, expected)) return null;
  return row;
}

async function latestAudit(baseUrl: string, serviceKey: string, prospectId: string) {
  const select = 'id,source,source_version,score,grade,findings,created_at';
  const rows = await serviceRequest(
    baseUrl,
    serviceKey,
    `/rest/v1/audits?prospect_id=eq.${encodeURIComponent(prospectId)}&select=${encodeURIComponent(select)}&order=created_at.desc&limit=1`
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function latestDemo(baseUrl: string, serviceKey: string, prospectId: string) {
  const rows = await serviceRequest(
    baseUrl,
    serviceKey,
    `/rest/v1/demos?prospect_id=eq.${encodeURIComponent(prospectId)}&select=id,status,artifact_path,preview_url,created_at&order=created_at.desc&limit=1`
  );
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function patchProspect(baseUrl: string, serviceKey: string, row: any, status: string, extra: Record<string, unknown> = {}, verifiedFacts?: unknown) {
  const qualification = cleanQualification(row);
  const preparation = preparationFrom(row);
  Object.assign(preparation, extra, { status });
  if (status === 'COMPLETE' || status === 'FAILED') {
    delete preparation.token_hash;
    delete preparation.expires_at;
  }
  qualification.preparation = preparation;
  qualification.stage = status === 'COMPLETE' ? 'first_concept_ready' : 'first_concept_preparation';

  const payload: Record<string, unknown> = { qualification };
  if (verifiedFacts !== undefined) payload.verified_facts = verifiedFacts;
  if (status === 'COMPLETE' && row.state === 'QUALIFIED') payload.state = 'DEMO_READY';

  await serviceRequest(
    baseUrl,
    serviceKey,
    `/rest/v1/prospects?id=eq.${encodeURIComponent(row.id)}`,
    {
      method: 'PATCH',
      headers: serviceHeaders(serviceKey, 'application/json', 'return=minimal'),
      body: JSON.stringify(payload),
    }
  );
}

async function uploadObject(baseUrl: string, serviceKey: string, path: string, body: string, contentType: string) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: 'POST',
    headers: {
      ...serviceHeaders(serviceKey, contentType),
      'x-upsert': 'true',
    },
    body,
  });
  if (!response.ok) {
    console.error('prospect-preparation storage error', response.status, (await response.text()).slice(-800));
    throw new Error(`storage ${response.status}`);
  }
}

function validResult(body: any) {
  if (!['LINKHUB', 'STANDALONE'].includes(body?.site_kind)) return false;
  if (!UUID_RE.test(String(body?.demo_id || ''))) return false;
  if (!body?.audit || typeof body.audit !== 'object') return false;
  if (!body?.verified_facts || typeof body.verified_facts !== 'object') return false;
  if (!body?.site_config || typeof body.site_config !== 'object') return false;
  if (typeof body?.preview_html !== 'string' || !body.preview_html.includes('<!doctype html>')) return false;
  if (new TextEncoder().encode(body.preview_html).byteLength > MAX_PREVIEW_BYTES) return false;
  if (typeof body?.technical_report_md !== 'string' || typeof body?.technical_report_html !== 'string') return false;
  if (new TextEncoder().encode(body.technical_report_html).byteLength > MAX_REPORT_BYTES) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Alleen POST is toegestaan.' });

  const baseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!baseUrl || !serviceKey) return json(500, { error: 'Backendconfiguratie ontbreekt.' });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Ongeldige JSON.' });
  }

  const prospectId = String(body?.prospect_id || '');
  const token = String(body?.token || '');
  const row = await verifyCapability(baseUrl, serviceKey, prospectId, token);
  if (!row) return json(401, { error: 'Ongeldige of verlopen voorbereidingsopdracht.' });

  try {
    if (body.action === 'input') {
      const [audit, demo] = await Promise.all([
        latestAudit(baseUrl, serviceKey, prospectId),
        latestDemo(baseUrl, serviceKey, prospectId),
      ]);
      if (audit && demo) {
        await patchProspect(baseUrl, serviceKey, row, 'COMPLETE', { completed_at: new Date().toISOString(), reused_existing: true });
        return json(200, { already_complete: true });
      }
      await patchProspect(baseUrl, serviceKey, row, 'RUNNING', { started_at: new Date().toISOString() });
      return json(200, {
        already_complete: false,
        prospect: {
          id: row.id,
          name: row.name,
          category: row.category,
          city: row.city,
          address: row.address,
          website_url: row.website_url,
          phone: row.phone,
          rating: row.rating,
          review_count: row.review_count,
          place_id: row.place_id,
          discovery_source: row.discovery_source,
          discovery_version: row.discovery_version,
          source_confidence: row.source_confidence,
          operating_status: row.operating_status,
        },
        existing_audit: audit,
        has_demo: Boolean(demo),
      });
    }

    if (body.action === 'fail') {
      await patchProspect(baseUrl, serviceKey, row, 'FAILED', {
        failed_at: new Date().toISOString(),
        error: String(body?.error || 'Automatische voorbereiding is mislukt.').slice(0, 400),
      });
      return json(200, { status: 'failed' });
    }

    if (body.action !== 'complete' || !validResult(body)) {
      return json(400, { error: 'Ongeldig voorbereidingsresultaat.' });
    }

    const [existingAudit, existingDemo] = await Promise.all([
      latestAudit(baseUrl, serviceKey, prospectId),
      latestDemo(baseUrl, serviceKey, prospectId),
    ]);

    if (!existingAudit) {
      await serviceRequest(baseUrl, serviceKey, '/rest/v1/audits', {
        method: 'POST',
        headers: serviceHeaders(serviceKey, 'application/json', 'return=minimal'),
        body: JSON.stringify({
          prospect_id: prospectId,
          source: body.audit.source || 'first-concept',
          source_version: 'first-concept-v1',
          score: body.audit.score ?? null,
          grade: body.audit.grade ?? null,
          findings: Array.isArray(body.audit.findings) ? body.audit.findings : [],
          technical_report_html: body.technical_report_html,
          technical_report_md: body.technical_report_md,
        }),
      });
    }

    if (!existingDemo) {
      const demoId = String(body.demo_id);
      const artifactPath = `versions/${prospectId}/${demoId}`;
      await uploadObject(baseUrl, serviceKey, `${artifactPath}/index.html`, body.preview_html, 'text/html; charset=utf-8');
      await uploadObject(
        baseUrl,
        serviceKey,
        `live/${prospectId}/manifest.json`,
        JSON.stringify({ artifact_path: artifactPath, demo_id: demoId, published_at: new Date().toISOString() }),
        'application/json; charset=utf-8'
      );

      const siteConfig = { ...body.site_config, _operator: { stable_live: true, source: 'automatic_baseline', site_kind: body.site_kind } };
      await serviceRequest(baseUrl, serviceKey, '/rest/v1/demos', {
        method: 'POST',
        headers: serviceHeaders(serviceKey, 'application/json', 'return=minimal'),
        body: JSON.stringify({
          id: demoId,
          prospect_id: prospectId,
          site_config: siteConfig,
          preview_url: `${baseUrl}/functions/v1/mockup-preview/v/${prospectId}/${demoId}/`,
          status: 'LIVE',
          artifact_path: artifactPath,
          version_note: 'Automatische eerste mock-up',
        }),
      });
    }

    await patchProspect(
      baseUrl,
      serviceKey,
      row,
      'COMPLETE',
      {
        site_kind: body.site_kind,
        audit_source: body.audit.source || 'first-concept',
        completed_at: new Date().toISOString(),
      },
      body.verified_facts
    );
    return json(200, { status: 'complete' });
  } catch (error) {
    console.error('prospect-preparation failed', error);
    return json(502, { error: 'Voorbereidingsresultaat kon niet worden verwerkt.' });
  }
});
