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

Files are stored under the public `mockup-sites` Supabase Storage bucket at an opaque immutable version path. Public read is intentional for prospect previews; upload/update/delete remain protected by Operator RLS.

Supabase Storage intentionally does not render uploaded HTML as a website. One small public read-only Edge Function, `mockup-preview`, therefore serves the static artifacts with the correct content type. It has no write capability and no service-role credential.

Immutable version preview:

```text
/functions/v1/mockup-preview/v/<prospect-id>/<demo-id>/
```

Stable prospect URL after `Maak live`:

```text
/functions/v1/mockup-preview/p/<prospect-id>/
```

`Maak live` only replaces `live/<prospect-id>/manifest.json`, which points to the selected immutable artifact bundle (or an external HTTPS preview). Previous versions remain untouched and become `ARCHIVED`. The public prospect URL therefore stays stable for future QR codes and print packs.

An external HTTPS preview can also be added as a DRAFT version as a simple escape hatch.

## Access

The browser uses the Supabase publishable key. That key is public by design; access is enforced by RLS.

1. User creates/signs into a Supabase Auth email/password account.
2. The user's email must also exist as an active row in `public.operator_allowlist`.
3. RLS policies check that allowlist for prospect, demo and mock-up artifact writes.
4. Authenticated operators can update contact fields and manage demo versions; they do not receive service-role credentials.
5. The preview Edge Function is intentionally public and read-only because the resulting prospect preview must be reachable from a QR/URL without login.

Authorize an operator through a privileged SQL/admin route:

```sql
insert into public.operator_allowlist(email)
values ('operator@example.nl')
on conflict (email) do update set active = true;
```

Do not expose service-role credentials to this frontend.
