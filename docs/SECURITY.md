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

## Authentication and authorization

Supabase Auth is the identity provider. Durable application membership is `team_members` keyed by the Auth UUID.

Roles:

```text
ADMIN
KEY_USER
USER
```

Authorization truth is:

```text
auth.uid()
→ active team_members row
→ role-aware RLS / RPC / server capability
```

`operator_is_active_team_member()` is the common Operator membership predicate. `operator_assert_allowed()`, the browser bootstrap and Operator/storage RLS all use active UUID membership.

The historical `operator_allowlist` compatibility model was removed from production on 2026-08-30 by `20260830_operator_allowlist_retirement_v01.sql`. Verified post-cutover state:

```text
operator_allowlist table = absent
RLS references = 0
database function references = 0
```

Do not recreate a parallel e-mail allowlist or other second membership authority.

Rules:

- routine onboarding is invite-only;
- Admin may invite/manage Users and Key users;
- Key user may invite/manage normal Users only;
- at least one active Admin must remain;
- deactivation is blocked while active responsibilities remain;
- browser code receives only the Supabase publishable key;
- service/secret credentials never enter browser code;
- privileged mutations re-check authenticated UUID membership and role server-side.

## Human team identity

`team_members.display_name` is the canonical visible person identity. E-mail is login/account metadata, not the normal assignment/activity label.

The UI derives an initials avatar from `display_name`; no avatar upload or Storage subsystem exists.

Display-name correction is Admin-only and actor-aware. Stable Auth UUIDs remain the relational identity behind assignments/events.

## Deactivation and permanent deletion

Deactivation is normal offboarding and preserves historical attribution.

Permanent deletion exists only for mistaken/test/history-free accounts and is server-side. It must reject deletion when:

- caller is not an active Admin;
- target is the caller;
- target has active `prospect_assignments`;
- target has prospect-linked business history;
- deleting the target would remove the last active Admin.

Users with business history are deactivated, not hard-deleted merely to tidy the Team list.

## Invite lifecycle and redirect boundary

Invitation metadata such as `solidDesignMustSetPassword` is onboarding UI state, not authorization authority.

`team-invite` always passes an explicit server-validated `redirectTo`. Allowed destinations are limited to:

- current internal production origin;
- isolated `pr-<number>` Pages previews;
- explicitly configured future `SOLIDDESIGN_INTERNAL_ORIGIN`.

Arbitrary origins are rejected. Hosted Supabase **Authentication → URL Configuration** must allow the same origins. `http://localhost:3000` is not a hosted production fallback.

Exact configuration is maintained in `docs/AUTH_REDIRECTS.md`.

Do not introduce a custom token broker/account service for ordinary Supabase Auth redirects.

## Password and Auth mail security

Use Supabase's built-in password controls rather than a custom password-strength/breach service.

Before the operational pilot:

- minimum password length at least 8, with stronger practical policy for the small internal team;
- configure a proven custom SMTP provider through Supabase Auth for invitations/password recovery;
- verify sender/domain, invite delivery and password-recovery delivery;
- enable Supabase Leaked Password Protection if the selected plan supports it.

The built-in default SMTP service is bounded test infrastructure and is strongly rate-limited. The current security advisor still reports Leaked Password Protection as disabled; this remains platform-configuration debt, not application architecture.

## Public/internal surface separation

Preferred final hosts:

```text
cms.<brand>.nl       = authenticated CMS
<brand>.nl/<slug>    = public prospect surface
```

Temporary public delivery is `/prospect/<slug>` on the existing Pages project.

A public slug is an address, not an authorization secret. Public delivery receives only the capability needed to resolve/serve the current LIVE mock-up. Drafts and internal dossier capability remain inaccessible.

Every prospect page remains `noindex, nofollow, noarchive` during the pre-sale workflow.

PR previews are isolated verification environments. Their prospect links deliberately stay on the same `pr-<number>` origin so browser acceptance executes the code under test rather than production code.

The deployment workflow smoke-tests both preview and production delivery, including the active-team membership bootstrap, public resolver, telemetry asset and Edge Function CORS.

## LIVE artifact and legacy-delivery boundary

New LIVE publication requires a canonical stored artifact. External HTTPS previews are review/DRAFT inputs only.

Six grandfathered LIVE records predate this invariant. Their compatibility path is finite:

- only explicitly known historical SolidDesign preview hosts may be fetched;
- the old shortened CMS alias is normalized to the original legacy preview host to avoid self-recursion;
- redirects must stay inside the expected legacy origin/path;
- the prospect-facing slug URL remains visible;
- the path may shrink only and must never become a general reverse proxy.

When the historical count reaches zero, remove the compatibility path and reconsider the remaining public `demos.preview_url` access.

## Prospect engagement privacy boundary

`prospect_visits` measures response to the prospect-specific link, not personal identity.

Stored MVP signals:

- prospect/demo;
- internal/external opening;
- QR/direct source;
- broad device type;
- first/last telemetry time;
- active visible seconds;
- maximum scroll percentage.

Explicitly not stored:

- raw IP;
- IP hash;
- fingerprint;
- persistent visitor/browser ID;
- session replay;
- heatmap/clickstream.

One row represents one measured opening, not one human. Browser telemetry is fail-open: measurement failure never blocks the prospect page.

A plain HTTP GET is not commercial engagement; a short visible browser dwell is required before registration.

## Internal QA traffic

**Test als medewerker** mints a short-lived server-signed token bound to the prospect slug. The public telemetry endpoint validates it before classifying an opening as `INTERNAL`.

Do not use IP allowlists, a guessable internal query flag or cross-domain cookie assumptions as the primary employee distinction.

## Public telemetry endpoint

`prospect-engagement` intentionally accepts public start/update telemetry using a random per-opening capability token. It exposes no general database write surface.

The separate internal-token mint action authenticates the requesting team member and verifies active membership server-side.

CORS/preflight support is required because the public browser calls the Edge Function directly.

`prospect_visits` has no direct `anon` or `authenticated` table grants. Operational reads use authorization-checking RPCs. RLS-with-no-policy advisor INFO for this table is therefore intentional: direct Data API access is not its interface.

For stateful browser features, UI appearance alone is not acceptance evidence: verify authoritative rows and Edge Function requests.

## Database access boundary

The public resolver uses the publishable key with narrow grants plus RLS. Resolver failures must not be solved by broadening anonymous table access when the requested data is unnecessary.

Database evolution is:

```text
supabase/schema.sql       # bootstrap baseline
→ supabase/migrations/*   # ordered canonical evolution
→ current production schema
```

Do not maintain a second manually synchronized current schema.

Authenticated `SECURITY DEFINER` Operator RPCs are intentional UI capabilities only when the function itself re-checks active membership/role. Do not blindly revoke them merely to silence the generic advisor warning.

## URL / SSRF rules

Network fetchers must reject or guard:

- non-HTTP(S) schemes;
- credentials in URLs;
- localhost/loopback;
- private RFC1918 ranges;
- link-local addresses;
- cloud metadata endpoints;
- redirects into blocked ranges.

Historical compatibility does not exempt a fetcher from finite origin/path restrictions.

## Verified-fact boundary

Prospect-facing designs may use only facts directly evidenced, validated from the official site or explicitly supplied/approved by a human.

No invented testimonials, services, awards, opening hours or commercial claims.

## Repository and dependency rules

Because the repository can be public:

- no `.env` or secrets;
- no raw private prospect/customer datasets;
- no privileged API keys;
- dependencies pinned/recorded where practical;
- every dependency must earn its operational complexity.

## Security review rule

After schema/Auth/RLS/function changes:

1. run CI and relevant deployed runtime smokes;
2. run Supabase security advisors;
3. distinguish new regressions from intentional capabilities/configuration debt;
4. fix cheap correct hardening at the source;
5. never broaden permissions or add `SECURITY DEFINER` merely to silence a warning.
