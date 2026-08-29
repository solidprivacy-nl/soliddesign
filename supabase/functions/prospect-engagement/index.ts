import { withSupabase } from 'npm:@supabase/server@1.4.1';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_SET = new Set(['DIRECT', 'QR']);
const DEVICE_SET = new Set(['MOBILE', 'TABLET', 'DESKTOP', 'OTHER']);

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

function base64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function clampInt(value: unknown, min: number, max: number) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return json(405, { error: 'Alleen POST is toegestaan.' });

    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return json(400, { error: 'Ongeldige aanvraag.' }); }

    const action = String(body.action || '').toLowerCase();

    if (action === 'start') {
      const slug = String(body.slug || '').trim().toLowerCase();
      const source = SOURCE_SET.has(String(body.source || '').toUpperCase()) ? String(body.source).toUpperCase() : 'DIRECT';
      const device = DEVICE_SET.has(String(body.device_type || '').toUpperCase()) ? String(body.device_type).toUpperCase() : 'OTHER';
      const audience = body.internal === true ? 'INTERNAL' : 'EXTERNAL';
      if (!SLUG_RE.test(slug) || slug.length > 63) return json(404, { error: 'Prospectpagina niet beschikbaar.' });

      const { data: prospect, error: prospectError } = await ctx.supabaseAdmin
        .from('prospects')
        .select('id')
        .eq('public_slug', slug)
        .maybeSingle();
      if (prospectError || !prospect?.id) return json(404, { error: 'Prospectpagina niet beschikbaar.' });

      const { data: demo, error: demoError } = await ctx.supabaseAdmin
        .from('demos')
        .select('id')
        .eq('prospect_id', prospect.id)
        .eq('status', 'LIVE')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (demoError || !demo?.id) return json(404, { error: 'Prospectpagina niet beschikbaar.' });

      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const token = base64Url(bytes);
      const tokenHash = await hashToken(token);
      const now = new Date().toISOString();

      const { data: visit, error: insertError } = await ctx.supabaseAdmin
        .from('prospect_visits')
        .insert({
          prospect_id: prospect.id,
          demo_id: demo.id,
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
