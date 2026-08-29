import { withSupabase } from 'npm:@supabase/server@1.4.1';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors';

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

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { error: 'Alleen POST is toegestaan.' });

    const callerId = ctx.userClaims?.id;
    if (!callerId) return json(401, { error: 'Niet ingelogd.' });

    const { data: caller, error: callerError } = await ctx.supabaseAdmin
      .from('team_members')
      .select('user_id,role,active')
      .eq('user_id', callerId)
      .maybeSingle();

    if (callerError) {
      console.error('team-member-admin caller lookup failed', callerError);
      return json(502, { error: 'Teamrechten konden niet worden gecontroleerd.' });
    }
    if (!caller?.active || caller.role !== 'ADMIN') {
      return json(403, { error: 'Alleen een Admin kan een gebruiker definitief verwijderen.' });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Ongeldige aanvraag.' });
    }

    const action = String(body.action || '').toLowerCase();
    const targetUserId = String(body.user_id || '').trim();
    if (action !== 'delete' || !targetUserId) return json(400, { error: 'Ongeldige beheeractie.' });
    if (targetUserId === callerId) return json(409, { error: 'Je kunt je eigen account niet verwijderen.' });

    const { data: target, error: targetError } = await ctx.supabaseAdmin
      .from('team_members')
      .select('user_id,email,display_name,role,active')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (targetError) {
      console.error('team-member-admin target lookup failed', targetError);
      return json(502, { error: 'Gebruiker kon niet worden gecontroleerd.' });
    }
    if (!target) return json(404, { error: 'Gebruiker bestaat niet meer.' });

    const { count: assignmentCount, error: assignmentError } = await ctx.supabaseAdmin
      .from('prospect_assignments')
      .select('prospect_id', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    if (assignmentError) {
      console.error('team-member-admin assignment lookup failed', assignmentError);
      return json(502, { error: 'Verantwoordelijkheden konden niet worden gecontroleerd.' });
    }
    if ((assignmentCount || 0) > 0) {
      return json(409, { error: 'Deze gebruiker heeft nog actieve verantwoordelijkheden. Draag die eerst over.' });
    }

    const { count: businessEventCount, error: eventError } = await ctx.supabaseAdmin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('actor_user_id', targetUserId)
      .not('prospect_id', 'is', null);

    if (eventError) {
      console.error('team-member-admin event lookup failed', eventError);
      return json(502, { error: 'Dossierhistorie kon niet worden gecontroleerd.' });
    }
    if ((businessEventCount || 0) > 0) {
      return json(409, { error: 'Deze gebruiker heeft dossierhistorie en kan daarom niet definitief worden verwijderd. Deactiveer het account.' });
    }

    if (target.role === 'ADMIN' && target.active) {
      const { count: activeAdminCount, error: adminCountError } = await ctx.supabaseAdmin
        .from('team_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('active', true)
        .eq('role', 'ADMIN');
      if (adminCountError) return json(502, { error: 'Adminbezetting kon niet worden gecontroleerd.' });
      if ((activeAdminCount || 0) <= 1) return json(409, { error: 'Er moet minimaal één actieve Admin overblijven.' });
    }

    const { error: allowlistError } = await ctx.supabaseAdmin
      .from('operator_allowlist')
      .delete()
      .eq('email', target.email);
    if (allowlistError) {
      console.error('team-member-admin allowlist cleanup failed', allowlistError);
      return json(502, { error: 'Toegang kon niet veilig worden verwijderd.' });
    }

    const { error: authDeleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (authDeleteError) {
      console.error('team-member-admin auth delete failed', authDeleteError);
      await ctx.supabaseAdmin.from('operator_allowlist').upsert(
        { email: target.email, active: target.active },
        { onConflict: 'email' },
      );
      return json(502, { error: 'Account kon niet definitief worden verwijderd.' });
    }

    const { error: auditError } = await ctx.supabaseAdmin.from('events').insert({
      event_type: 'user_deleted',
      actor_user_id: callerId,
      metadata: {
        target_user_id: targetUserId,
        display_name: target.display_name,
        email: target.email,
        role: target.role,
      },
    });
    if (auditError) console.error('team-member-admin audit write failed', auditError);

    return json(200, { deleted: true, user_id: targetUserId });
  }),
};
