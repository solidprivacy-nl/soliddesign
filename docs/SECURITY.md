# Security Baseline

Security is part of the operating design, not a later subsystem. The canonical system model is `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`; documentation precedence is defined in `docs/ARCHITECTURE.md`.

## Primary trust boundaries

SolidDesign processes third-party place data, public websites, AI output, authenticated team actions and public prospect-page engagement.

```text
EXTERNAL DATA / WEBSITE
→ untrusted input
→ extraction + validation
→ VERIFIED FACTS
→ design / communication
```

Raw external content cannot choose tools, request secrets, authorize publication or trigger outbound communication.

## Authentication and internal authorization

Supabase Auth is the identity provider. Durable application membership is `team_members` using the Auth user UUID.

Roles:

```text
ADMIN
KEY_USER
USER
```

Rules:

- routine onboarding is invite-only;
- Admin may invite/manage Users and Key users;
- Key user may invite/manage normal Users only;
- at least one active Admin must remain;
- deactivation is blocked while active prospect responsibilities remain;
- browser code receives only a Supabase publishable key;
- privileged/service credentials never enter browser code;
- sensitive mutations use RLS or narrow server/RPC capabilities that re-check the authenticated user and role.

`operator_allowlist` is transitional compatibility during rollout, not the target user-management model. It still gates a finite set of older Operator RLS/functions, so it must not be deleted piecemeal or extended with new semantics. After the invite/role browser gate is proven, cut the remaining access checks over to active `team_members` in one explicit migration/change set and then remove the compatibility path.

### Invite lifecycle state

Invitation metadata such as `solidDesignMustSetPassword` supports onboarding UI/lifecycle behavior only. User-editable metadata is not authorization authority. Roles and access remain derived from authenticated identity plus server/RLS-controlled membership state.

## Password security

Use Supabase Auth's built-in password controls rather than creating a custom password-strength or breached-password service.

Current verification checklist before the multi-user operational pilot:

- minimum password length must be at least 8 characters; prefer a stronger practical setting for this small internal team;
- use Supabase's built-in required-character policy where operationally appropriate;
- if the project plan supports it, enable Supabase **Leaked Password Protection** so known-compromised passwords are rejected through the platform's HaveIBeenPwned integration;
- do not implement a second password database, custom breach API or home-grown password checker merely to replace a platform capability.

The Supabase security advisor currently reports leaked-password protection as disabled. Supabase documents this protection as available on Pro Plan and above. This is a configuration hardening item, not an application-architecture requirement.

Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Public/internal surface separation

Preferred final hosts:

```text
cms.<brand>.nl       = authenticated CMS
<brand>.nl/<slug>    = public prospect surface
```

Temporary public delivery is `/prospect/<slug>` on the existing Pages host.

The public hostname is never an alias for the CMS. A public slug is an address, not an authorization secret.

Public delivery resolves only the information required to serve the current LIVE mock-up. Drafts and internal dossier capability remain inaccessible.

Every prospect page remains `noindex, nofollow, noarchive` during the pre-sale workflow.

## LIVE artifact and legacy-delivery boundary

New LIVE publication requires a canonical stored artifact. External HTTPS previews are review/DRAFT inputs only.

Six grandfathered LIVE records predate that rule. Their compatibility route is deliberately finite:

- only explicitly allowlisted historical SolidDesign Cloudflare preview hosts may be fetched;
- the shortened historical `gate3-v1.soliddesign-cms.pages.dev` alias is normalized server-side to its original legacy preview host so the current Pages project cannot recursively call itself;
- redirects are allowed only inside the expected legacy origin/path;
- the prospect-facing URL remains visible;
- this path must shrink as those records are migrated/retired and must never become a general external reverse proxy.

## Prospect engagement privacy boundary

Engagement exists to answer operational questions such as whether a prospect opened and seriously viewed the concept. It is not intended to identify an individual visitor.

Stored MVP signals:

- prospect/demo;
- internal/external opening;
- QR/direct source;
- broad device type;
- first/last telemetry time;
- active visible seconds;
- maximum scroll percentage.

Explicitly not stored:

- raw IP address;
- IP hash;
- fingerprint;
- persistent visitor/browser identifier;
- session replay;
- heatmap.

One `prospect_visits` row represents one measured opening, not one human identity.

Browser telemetry is fail-open: if measurement fails, the public mock-up still loads.

## Internal QA traffic

Employee/public-page testing must not be confused with prospect response.

The CMS therefore requests a short-lived, server-signed internal-preview token bound to the prospect slug. The public telemetry endpoint validates that token before classifying an opening as `INTERNAL`.

Do not use:

- IP allowlists as the primary employee distinction;
- a guessable `?internal=1` flag;
- cross-domain cookie assumptions between CMS and public hosts.

## Public telemetry endpoint

The prospect-engagement Edge Function intentionally accepts public start/update telemetry. It uses short random per-opening capability tokens for updates and exposes no general database write surface.

Browser invocation requires explicit CORS/preflight handling. The internal-preview token minting action separately authenticates the requesting team member using the supplied Supabase Auth access token and verifies active membership server-side.

## Database access boundary

The public resolver uses the publishable key with narrow column grants plus RLS. Do not solve resolver failures by broadening anonymous table access when the requested column is not actually necessary.

`prospect_visits` has no direct `anon` or `authenticated` table grants. Operational reads go through authenticated, authorization-checking RPCs; public writes go through the bounded Edge Function.

Database evolution follows `supabase/schema.sql` as bootstrap baseline plus ordered `supabase/migrations/` as canonical post-bootstrap evolution. See `supabase/README.md`.

## URL / SSRF rules

Network fetchers must reject or guard:

- non-HTTP(S) schemes;
- credentials in URLs;
- localhost/loopback;
- private RFC1918 ranges;
- link-local addresses;
- cloud metadata endpoints;
- redirects into blocked ranges.

A compatibility proxy is not exempt from these principles merely because its targets are historical; its allowed origin/path set must remain explicit and finite.

## Verified facts

Prospect-facing designs may only use business facts that are directly evidenced, validated from the official site, or explicitly supplied/approved by a human.

No invented testimonials, services, awards, opening hours or commercial claims.

## Repository and dependency rules

Because the repository can be public:

- no `.env` or secrets;
- no raw private prospect/customer datasets;
- no privileged API keys;
- dependencies are pinned/recorded where practical;
- every imported dependency must earn its operational complexity.

## Security review rule

After schema/auth/RLS/function changes:

1. run CI and relevant deployed runtime smokes;
2. run Supabase security advisors;
3. distinguish new regressions from intentional capabilities or explicitly tracked configuration debt;
4. fix cheap, correct hardening at the source rather than silencing the advisor;
5. do not broaden permissions or add `SECURITY DEFINER` merely to make a warning disappear.

The `website_key_from_url` helper now pins its `search_path` through migration, removing the previous mutable-search-path warning without changing its capability.
