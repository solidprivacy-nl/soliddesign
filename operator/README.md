# SolidDesign Operator

Small internal operator frontend for the human commercial/design workflow.

## Scope

Only:
- prospect list/search/filter;
- current website link;
- technical report;
- audit + qualification score;
- contact status, note, next action and last-contact timestamp;
- mock-up version upload, preview, history and explicit LIVE promotion.

Explicitly not a general CRM or website builder. No pipelines, task engine, dashboards, mailer or autonomous design agent.

## Mock-up workflow

Each upload creates a new immutable DRAFT demo record.

Accepted input:
- one standalone `.html` file; or
- one `.zip` static-site bundle.

ZIP contract:
- `index.html` at the root (one wrapper folder is tolerated and stripped);
- relative paths for local CSS/JS/images;
- common static assets only;
- no server-side code;
- `file://` references are rejected.

Files are stored under the public `mockup-sites` Supabase Storage bucket at an opaque version path. Public read is intentional for prospect previews; upload/update/delete remain protected by Operator RLS.

`Maak live` writes one stable public redirect at:

```text
live/<prospect-id>/index.html
```

That stable URL points to the selected immutable version. Old versions remain available and become `ARCHIVED`. This keeps future QR/print URLs stable while preserving design history.

An external HTTPS preview can also be added as a DRAFT version as a simple escape hatch.

## Access

The browser uses the Supabase publishable key. That key is public by design; access is enforced by RLS.

1. User creates/signs into a Supabase Auth email/password account.
2. The user's email must also exist as an active row in `public.operator_allowlist`.
3. RLS policies check that allowlist for prospect, demo and mock-up artifact writes.
4. Authenticated operators can update contact fields and manage demo versions; they do not receive service-role credentials.

Authorize an operator through a privileged SQL/admin route:

```sql
insert into public.operator_allowlist(email)
values ('operator@example.nl')
on conflict (email) do update set active = true;
```

Do not expose service-role credentials to this frontend.
