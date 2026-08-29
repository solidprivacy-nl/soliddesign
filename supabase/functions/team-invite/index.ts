import { withSupabase } from 'npm:@supabase/server@1.4.1';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors';

const ROLE_SET = new Set(['USER', 'KEY_USER']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_INTERNAL_ORIGIN = 'https://soliddesign-cms.pages.dev';
const PR_PREVIEW_ORIGIN_RE = /^https:\/\/pr-\d+\.soliddesign-cms\.pages\.dev$/;

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

function configuredInternalOrigin() {
  const configured = String(Deno.env.get('SOLIDDESIGN_INTERNAL_ORIGIN') || DEFAULT_INTERNAL_ORIGIN).trim();
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || url.username || url.password) return DEFAULT_INTERNAL_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_INTERNAL_ORIGIN;
  }
}

function allowedInternalOrigin(raw: unknown, configured: string) {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const origin = url.origin;
    return origin === DEFAULT_INTERNAL_ORIGIN
      || origin === configured
      || PR_PREVIEW_ORIGIN_RE.test(origin)
      ? origin
      : null;
  } catch {
    return null;
  }
}

function inviteRedirectFor(req: Request, requestedOrigin: unknown) {
  const configured = configuredInternalOrigin();
  const explicitOrigin = allowedInternalOrigin(requestedOrigin, configured);
  if (!explicitOrigin) return null;

  const rawHeaderOrigin = String(req.headers.get('Origin') || '').trim();
  const headerOrigin = rawHeaderOrigin ? allowedInternalOrigin(rawHeaderOrigin, configured) : null;
  if (rawHeaderOrigin && !headerOrigin) return null;
  if (headerOrigin && headerOrigin !== explicitOrigin) return null;

  return `${explicitOrigin}/`;
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { error: 'Alleen POST is toegestaan.' });

    const callerId = ctx.userClaims?.id;
    if (!callerId) return json(401, { error: 'Niet ingelogd.' });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Ongeldige aanvraag.' });
    }

    const redirectTo = inviteRedirectFor(req, body.invite_origin);
    if (!redirectTo) {
      return json(400, { error: 'Deze SolidDesign-omgeving is niet toegestaan als uitnodigingsbestemming.' });
    }
    const activationOrigin = new URL(redirectTo).origin;
    console.info('team-invite activation origin selected', { activation_origin: activationOrigin });

    const { data: caller, error: callerError } = await ctx.supabaseAdmin
      .from('team_members')
      .select('user_id,role,active')
      .eq('user_id', callerId)
      .maybeSingle();

    if (callerError) {
      console.error('team-invite caller lookup failed', callerError);
      return json(502, { error: 'Teamrechten konden niet worden gecontroleerd.' });
    }
    if (!caller?.active || !['ADMIN', 'KEY_USER'].includes(caller.role)) {
      return json(403, { error: 'Je mag geen gebruikers uitnodigen.' });
    }

    const email = String(body.email || '').trim().toLowerCase();
    const displayName = String(body.display_name || '').trim().replace(/\s+/g, ' ');
    const requestedRole = String(body.role || 'USER').toUpperCase();
    const role = caller.role === 'KEY_USER' ? 'USER' : requestedRole;

    if (!EMAIL_RE.test(email) || email.length > 254) return json(400, { error: 'Vul een geldig e-mailadres in.' });
    if (displayName.length < 2 || displayName.length > 100) return json(400, { error: 'Vul een naam van 2 tot 100 tekens in.' });
    if (!ROLE_SET.has(role)) return json(400, { error: 'Kies User of Key user.' });
    if (caller.role === 'KEY_USER' && requestedRole !== 'USER') return json(403, { error: 'Een Key user kan alleen Users uitnodigen.' });

    const { data: existing, error: existingError } = await ctx.supabaseAdmin
      .from('team_members')
      .select('user_id,active,role')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('team-invite existing lookup failed', existingError);
      return json(502, { error: 'Gebruiker kon niet worden gecontroleerd.' });
    }
    if (existing) {
      return json(409, { error: existing.active ? 'Deze gebruiker maakt al deel uit van het team.' : 'Deze gebruiker bestaat al maar is inactief. Activeer het bestaande account.' });
    }

    const { data: inviteData, error: inviteError } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        display_name: displayName,
        solidDesignMustSetPassword: true,
      },
    });

    const invited = inviteData?.user;
    if (inviteError || !invited?.id) {
      console.error('team-invite auth invite failed', inviteError);
      return json(400, { error: 'Uitnodiging kon niet worden verstuurd. Controleer het e-mailadres en de toegestane Auth-redirects.' });
    }

    const now = new Date().toISOString();
    const { error: memberError } = await ctx.supabaseAdmin.from('team_members').insert({
      user_id: invited.id,
      email,
      display_name: displayName,
      role,
      active: true,
      invited_at: now,
      joined_at: null,
      deactivated_at: null,
      created_at: now,
      updated_at: now,
    });

    if (memberError) {
      console.error('team-invite membership insert failed', memberError);
      await ctx.supabaseAdmin.auth.admin.deleteUser(invited.id).catch((error) => console.error('team-invite cleanup failed', error));
      return json(502, { error: 'Teamlid kon niet worden aangemaakt.' });
    }

    const { error: allowlistError } = await ctx.supabaseAdmin
      .from('operator_allowlist')
      .upsert({ email, active: true }, { onConflict: 'email' });

    if (allowlistError) {
      console.error('team-invite allowlist compatibility failed', allowlistError);
      await ctx.supabaseAdmin.from('team_members').delete().eq('user_id', invited.id);
      await ctx.supabaseAdmin.auth.admin.deleteUser(invited.id).catch((error) => console.error('team-invite cleanup failed', error));
      return json(502, { error: 'Toegang kon niet worden voorbereid.' });
    }

    const { error: eventError } = await ctx.supabaseAdmin.from('events').insert({
      event_type: 'user_invited',
      actor_user_id: callerId,
      metadata: { target_user_id: invited.id, role },
    });
    if (eventError) console.error('team-invite event write failed', eventError);

    return json(201, {
      activation_origin: activationOrigin,
      user: {
        user_id: invited.id,
        email,
        display_name: displayName,
        role,
        active: true,
        joined_at: null,
      },
    });
  }),
};
