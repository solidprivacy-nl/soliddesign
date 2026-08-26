# SolidDesign Operator

Small internal operator frontend for the second human worker in the commercial workflow.

## Scope

Only:
- prospect list/search/filter;
- current website link;
- live premium mock-up link;
- technical report;
- audit + qualification score;
- contact status, note, next action and last-contact timestamp.

Explicitly not a general CRM. No pipelines, automations, task engine, dashboards, mailer or AI agent.

## Access

The browser uses the Supabase publishable key. That key is public by design; access is enforced by RLS.

1. User creates/signs into a Supabase Auth email/password account.
2. The user's email must also exist as an active row in `public.operator_allowlist`.
3. `operator_is_allowed()` is used by all Operator RLS policies.
4. Authenticated users can update only the contact fields on `prospects`.

Authorize an operator through a privileged SQL/admin route:

```sql
insert into public.operator_allowlist(email)
values ('operator@example.nl')
on conflict (email) do update set active = true;
```

Do not expose service-role credentials to this frontend.
