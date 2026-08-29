import { withSupabase } from 'npm:@supabase/server@1.4.1';

const ROLE_SET = new Set(['USER', 'KEY_USER']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json(405, { error: 'Alleen POST is toegestaan.' });

    const callerId = ctx.userClaims?.id;
    if (!callerId) return json(401, { error: 'Niet ingelogd.' });

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

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Ongeldige aanvraag.' });
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
      data: {
        display_name: displayName,
        solidDesignMustSetPassword: true,
      },
    });

    const invited = inviteData?.user;
    if (inviteError || !invited?.id) {
      console.error('team-invite auth invite failed', inviteError);
      return json(400, { error: 'Uitnodiging kon niet worden verstuurd. Controleer of het e-mailadres al als account bestaat.' });
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

    // Transitional compatibility: the legacy allowlist remains the access gate until M1 cutover is proven.
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
