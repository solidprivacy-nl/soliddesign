# Security Baseline

Security is part of the operating design, not a later subsystem. The canonical system model is `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`.

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

`operator_allowlist` is transitional compatibility during rollout, not the target user-management model.

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

## URL / SSRF rules

Network fetchers must reject or guard:

- non-HTTP(S) schemes;
- credentials in URLs;
- localhost/loopback;
- private RFC1918 ranges;
- link-local addresses;
- cloud metadata endpoints;
- redirects into blocked ranges.

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

After schema/auth/RLS/function changes, run Supabase security advisors and distinguish new regressions from known legacy lint. Do not silence warnings by broadening permissions or adding `SECURITY DEFINER`; authorization must remain explicit.
