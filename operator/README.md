# SolidDesign Operator

Small internal operator frontend for the human commercial/design workflow.

## Scope

Only:
- active prospect list/search/filter;
- archive + restore, with guarded hard delete for administrative corrections;
- manual discovery runs by location + keyword(s);
- one-URL intake/preflight;
- Discovery inbox for `DISCOVERED` / `DISQUALIFIED` candidates;
- current website link;
- technical report;
- audit + qualification score;
- contact status, note, next action and last-contact timestamp;
- per-prospect ChatGPT design workspace URL and design note;
- two-URL design-project bootstrap;
- mock-up version upload, preview, history and explicit LIVE promotion.

Explicitly not a general CRM or website builder. No pipeline builder, task engine, scheduler, queue, mailer or autonomous design agent.

## Discovery workflow

Discovery and active prospect work are intentionally separated in the UI while remaining one canonical `prospects` model in Supabase.

```text
AREA / URL intake
      ↓
DISCOVERED / DISQUALIFIED
      ↓
Discovery inbox
      ↓ evidence-backed qualification
QUALIFIED and later states
      ↓
Active prospect work queue
```

`DISCOVERED` does **not** mean qualified. Overture presence, website presence and reachability are discovery evidence only. The existing SolidDesign qualification rubric still requires independent demand, economics, conversion-opportunity, execution-fit and competitive-context evidence before promotion to `QUALIFIED`.

### Area discovery

The Operator accepts:
- one Dutch location;
- one or more comma-separated sector/category keywords;
- a small result limit (10/25/50).

One explicit operator action performs:

```text
location
→ cached Nominatim lookup
→ bbox
→ bounded Overture GeoParquet query in DuckDB-Wasm
→ domain dedupe
→ Discovery inbox
```

Nominatim is only used for explicit single-query location-to-bbox conversion. There is no autocomplete, bulk geocoding or background geocoding. The UI includes OpenStreetMap attribution.

Overture remains the canonical Phase-1 business discovery source. The browser query uses the same current Overture Places fields and category semantics as the existing Python CLI; no Google scraping or second discovery model is introduced.

### Specific URL intake

The URL path performs a small authenticated Pages Function preflight:
- HTTP(S) only;
- local/private literal addresses are rejected;
- redirects are bounded and revalidated;
- response reading is bounded;
- title/description are collected only as intake metadata;
- normalized hostname is the cross-source dedupe key.

A clearly unreachable root website may be marked `DISQUALIFIED` on that objective hard gate. A reachable website stays `DISCOVERED`; this preflight does not replace Pitch Doctor or the full commercial qualification rubric.

### Run history

`discovery_runs` stores only a small operator audit trail: input, state, counts, result metadata, timestamps and any error. There is no job scheduler or orchestration layer.

## Active work queue and archive

The normal prospect query exposes only non-archived prospects that have progressed beyond `DISCOVERED` / `DISQUALIFIED`.

Archiving is orthogonal to lifecycle state:

```text
archived_at IS NULL     = active
archived_at IS NOT NULL = archived
```

Archive preserves the original state and history. Restore clears `archived_at`.

Hard delete is intentionally narrow. It is only available for discovery/archived administrative corrections and is blocked when demo or mailing history exists. Real commercial history should be archived, not erased.

## Design project workflow

Each selected prospect has one opaque `design_brief_token` and may store one shared ChatGPT project URL.

The Operator exposes one stable methodological entrypoint:

```text
https://soliddesign-cms.pages.dev/start-design
```

`/start-design` is only a stable pointer. GitHub remains the canonical source of truth for the prompt architecture at `prompts/SOLIDDESIGN_BOOTSTRAP.md` and its required secondary prompts.

The prospect-specific context is published as a small Markdown snapshot under:

```text
https://soliddesign-cms.pages.dev/brief/<opaque-token>
```

`Copy project start` first saves the design note/workspace metadata, refreshes the Markdown brief in the public `design-briefs` Storage bucket, then copies exactly these two URLs:

```text
https://soliddesign-cms.pages.dev/start-design
https://soliddesign-cms.pages.dev/brief/<opaque-token>
```

The design brief deliberately excludes contact workflow state and other CRM noise. It contains the business identity, verified facts, qualification context, latest audit evidence, current mock-up state and the operator's explicit design note. Public read is intentional because ChatGPT must be able to retrieve it without a CMS login; the opaque token is the access boundary. Only allowlisted operators may create or refresh a brief.

After creating the shared ChatGPT customer project, paste its project URL back into the Operator so either human operator can reopen the customer design workspace directly.

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

The browser uses the Supabase publishable key. That key is public by design; access is enforced by RLS and narrow security-definer RPCs that re-check `operator_allowlist`.

1. User creates/signs into a Supabase Auth email/password account.
2. The user's email must also exist as an active row in `public.operator_allowlist`.
3. RLS/RPC checks gate prospect, discovery, demo, design-brief and mock-up operations.
4. Authenticated operators do not receive service-role credentials.
5. Public prospect previews and design briefs are intentionally read-only and reachable without login through opaque URLs.

Authorize an operator through a privileged SQL/admin route:

```sql
insert into public.operator_allowlist(email)
values ('operator@example.nl')
on conflict (email) do update set active = true;
```

Do not expose service-role credentials to this frontend.
