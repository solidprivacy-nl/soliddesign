import { withSupabase } from 'npm:@supabase/server@1.4.1';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_SET = new Set(['DIRECT', 'QR']);
const DEVICE_SET = new Set(['MOBILE', 'TABLET', 'DESKTOP', 'OTHER']);
const INTERNAL_TOKEN_TTL_MS = 5 * 60 * 1000;
const encoder = new TextEncoder();

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function base64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function internalSigningKey() {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!serviceKey) throw new Error('internal signing key unavailable');
  const material = await crypto.subtle.digest('SHA-256', encoder.encode(`soliddesign-internal-preview-v1:${serviceKey}`));
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signInternalPayload(payload: string) {
  const key = await internalSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return base64Url(new Uint8Array(signature));
}

async function mintInternalToken(slug: string) {
  const payload = base64Url(encoder.encode(JSON.stringify({ v: 1, aud: 'internal-preview', slug, exp: Date.now() + INTERNAL_TOKEN_TTL_MS })));
  return `${payload}.${await signInternalPayload(payload)}`;
}

async function validInternalToken(token: string, slug: string) {
  const parts = token.split('.');
  if (parts.length !== 2 || parts[0].length > 512 || parts[1].length > 128) return false;
  try {
    const key = await internalSigningKey();
    const validSignature = await crypto.subtle.verify('HMAC', key, fromBase64Url(parts[1]), encoder.encode(parts[0]));
    if (!validSignature) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    return payload?.v === 1 && payload?.aud === 'internal-preview' && payload?.slug === slug && Number(payload?.exp) >= Date.now();
  } catch {
    return false;
  }
}

function clampInt(value: unknown, min: number, max: number) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

async function liveProspect(ctx: any, slug: string) {
  const { data: prospect, error: prospectError } = await ctx.supabaseAdmin
    .from('prospects')
    .select('id')
    .eq('public_slug', slug)
    .maybeSingle();
  if (prospectError || !prospect?.id) return null;

  const { data: demo, error: demoError } = await ctx.supabaseAdmin
    .from('demos')
    .select('id')
    .eq('prospect_id', prospect.id)
    .eq('status', 'LIVE')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (demoError || !demo?.id) return null;
  return { prospectId: prospect.id, demoId: demo.id };
}

async function authenticatedTeamUser(req: Request, ctx: any) {
  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!jwt) return null;

  const { data: userData, error: userError } = await ctx.supabaseAdmin.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user?.id) return null;

  const { data: member, error: memberError } = await ctx.supabaseAdmin
    .from('team_members')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (memberError || !member?.user_id) return null;
  return user;
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { error: 'Alleen POST is toegestaan.' });

    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return json(400, { error: 'Ongeldige aanvraag.' }); }

    const action = String(body.action || '').toLowerCase();

    if (action === 'mint_internal') {
      const slug = String(body.slug || '').trim().toLowerCase();
      if (!SLUG_RE.test(slug) || slug.length > 63) return json(400, { error: 'Ongeldige prospectlink.' });
      const user = await authenticatedTeamUser(req, ctx);
      if (!user) return json(403, { error: 'Alleen actieve teamleden kunnen een medewerkertest starten.' });
      if (!await liveProspect(ctx, slug)) return json(404, { error: 'Prospectpagina niet beschikbaar.' });
      return json(200, { internal_token: await mintInternalToken(slug), expires_in: INTERNAL_TOKEN_TTL_MS / 1000 });
    }

    if (action === 'start') {
      const slug = String(body.slug || '').trim().toLowerCase();
      const source = SOURCE_SET.has(String(body.source || '').toUpperCase()) ? String(body.source).toUpperCase() : 'DIRECT';
      const device = DEVICE_SET.has(String(body.device_type || '').toUpperCase()) ? String(body.device_type).toUpperCase() : 'OTHER';
      if (!SLUG_RE.test(slug) || slug.length > 63) return json(404, { error: 'Prospectpagina niet beschikbaar.' });

      const internalToken = String(body.internal_token || '');
      let audience = 'EXTERNAL';
      if (internalToken) {
        if (!await validInternalToken(internalToken, slug)) return json(401, { error: 'Medewerkertest is verlopen of ongeldig.' });
        audience = 'INTERNAL';
      }

      const resolved = await liveProspect(ctx, slug);
      if (!resolved) return json(404, { error: 'Prospectpagina niet beschikbaar.' });

      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const token = base64Url(bytes);
      const tokenHash = await hashToken(token);
      const now = new Date().toISOString();

      const { data: visit, error: insertError } = await ctx.supabaseAdmin
        .from('prospect_visits')
        .insert({
          prospect_id: resolved.prospectId,
          demo_id: resolved.demoId,
          audience,
          source,
          device_type: device,
          started_at: now,
          last_seen_at: now,
          active_seconds: 0,
          max_scroll_pct: 0,
          token_hash: tokenHash,
        })
        .select('id')
        .single();
      if (insertError || !visit?.id) {
        console.error('prospect-engagement insert failed', insertError);
        return json(503, { error: 'Engagement kon niet worden geregistreerd.' });
      }

      return json(201, { visit_id: visit.id, token });
    }

    if (action === 'update') {
      const visitId = String(body.visit_id || '');
      const token = String(body.token || '');
      if (!/^[0-9a-f-]{36}$/i.test(visitId) || token.length < 20 || token.length > 100) return json(400, { error: 'Ongeldige visit.' });
      const tokenHash = await hashToken(token);

      const { data: current, error: currentError } = await ctx.supabaseAdmin
        .from('prospect_visits')
        .select('id,active_seconds,max_scroll_pct')
        .eq('id', visitId)
        .eq('token_hash', tokenHash)
        .maybeSingle();
      if (currentError || !current?.id) return json(404, { error: 'Visit niet gevonden.' });

      const activeSeconds = Math.max(Number(current.active_seconds || 0), clampInt(body.active_seconds, 0, 43200));
      const maxScroll = Math.max(Number(current.max_scroll_pct || 0), clampInt(body.max_scroll_pct, 0, 100));
      const { error: updateError } = await ctx.supabaseAdmin
        .from('prospect_visits')
        .update({ active_seconds: activeSeconds, max_scroll_pct: maxScroll, last_seen_at: new Date().toISOString() })
        .eq('id', visitId)
        .eq('token_hash', tokenHash);
      if (updateError) {
        console.error('prospect-engagement update failed', updateError);
        return json(503, { error: 'Engagement kon niet worden bijgewerkt.' });
      }
      return json(200, { ok: true });
    }

    return json(400, { error: 'Onbekende actie.' });
  }),
};
