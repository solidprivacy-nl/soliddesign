# Decision — Domain-agnostic public and CMS origins

**Date:** 2026-08-29  
**Status:** ACCEPTED / rollout basis

## Decision

SolidDesign will implement the multi-user/public-delivery architecture without waiting for the final prospect-facing brand/domain decision.

The application treats public and internal origins as delivery configuration, not as prospect data or workflow identity.

Conceptual configuration:

```text
INTERNAL_ORIGIN
PUBLIC_PROSPECT_ORIGIN
PUBLIC_PROSPECT_PATH_PREFIX
```

The prospect identity remains:

```text
prospects.public_slug
```

Full public URLs are derived, never stored as canonical prospect identity.

## Target brand pattern

The final brand is intentionally unspecified. When the team chooses `<brand>.nl`, the preferred hostname model is:

```text
INTERNAL CMS
https://cms.<brand>.nl

PUBLIC PROSPECT DELIVERY
https://<brand>.nl/<public_slug>
```

Example only if Dizein is selected:

```text
https://cms.dizein.nl
https://dizein.nl/siberg
```

The architecture MUST NOT contain `dizein.nl` as a business invariant. It is only one possible configured brand origin.

## Rollout

### Phase A — temporary public route

Until the final public brand/domain is chosen:

```text
INTERNAL_ORIGIN=https://soliddesign-cms.pages.dev
PUBLIC_PROSPECT_ORIGIN=https://soliddesign-cms.pages.dev
PUBLIC_PROSPECT_PATH_PREFIX=/prospect
```

Public prospect delivery uses:

```text
https://soliddesign-cms.pages.dev/prospect/<public_slug>
```

This namespace is temporary infrastructure and must not enter the prospect data model.

A historical one-segment link such as:

```text
https://soliddesign-cms.pages.dev/<slug>
```

is only a compatibility alias on the current Pages host. It redirects to the canonical temporary `/prospect/<slug>/` route and performs no independent database/LIVE resolution. This deliberately prevents a second resolver from drifting or leaking `/p/<uuid>`/legacy preview hosts.

### Phase B — final prospect-facing domain

After the team selects and registers `<brand>.nl`, attach it as a Custom Domain to the **same** Cloudflare Pages project and change delivery configuration:

```text
PUBLIC_PROSPECT_ORIGIN=https://<brand>.nl
PUBLIC_PROSPECT_PATH_PREFIX=
```

Canonical public URLs become:

```text
https://<brand>.nl/<public_slug>
```

This cutover requires an explicit **hostname routing boundary**. The branded public host may expose only the public prospect capability and any intentionally public brand root; internal routes such as `/start-design`, `/brief/...`, `/p/...` and CMS/API surfaces must not become public-brand aliases.

The current root-slug compatibility redirect is **not** the final custom-domain implementation. At cutover, root `/<slug>` requests on the branded host must be served by the same canonical public resolver semantics while the visible browser URL remains `https://<brand>.nl/<slug>` and nested bundle assets continue to resolve correctly.

Do not implement this with a second application or duplicate business resolver. Reuse/refactor the existing public resolver and prove root/nested-asset behavior on the actual custom hostname.

No migration of prospects, assignments, demos, LIVE state, engagement history or mailing/contact state is required.

Temporary `/prospect/<slug>` URLs may redirect to the new canonical root URL during cutover.

### Phase C — branded CMS hostname

The internal CMS may later move to:

```text
INTERNAL_ORIGIN=https://cms.<brand>.nl
```

by attaching `cms.<brand>.nl` to the same Pages project and changing only hostname-dependent configuration such as auth redirects, explicitly allowed origins, CSP and generated links.

No new application, deployment or operational-data migration is required.

The old `soliddesign-cms.pages.dev` hostname may remain temporarily or redirect to `cms.<brand>.nl` after auth/callback smoke tests pass.

## Deployment topology

There is one Cloudflare Pages project.

```text
main              → production deployment
PR branch pr-<n>  → isolated QA preview in the same Pages project
```

PR branch deployments are verification environments, not a second application, state plane or public architecture. They exist so runtime/Functions/CORS behavior can be proven before production merge.

## Invariants

1. Domain names are delivery configuration, not business identity.
2. `public_slug` is the stable prospect-facing key.
3. Engagement is keyed to `prospect_id` / `demo_id`, not a full URL.
4. No second Pages project/application is created merely for branding or QA.
5. Public and internal surfaces may share one deployment but have explicit route/host boundaries.
6. Changing public or internal hostname requires no prospect, demo, assignment or event migration.
7. Hardcoded production origins in business logic are prohibited where configuration is required.
8. There is one canonical public prospect URL at any given time.
9. Preferred final hostname shape is `cms.<brand>.nl` internally and `<brand>.nl/<slug>` externally.
10. The temporary `/prospect/<slug>` path and current root redirect are rollout mechanisms, not permanent public information architecture.
11. Public root routing may not expose UUID routes or external technical preview hosts.
12. The branded public host may not expose internal CMS capability merely because both hostnames share one Pages project.

## Rationale

- first principles: domains serve customer-facing brand/usability, not data identity;
- solid but simple: one application, one Pages project and one operational state plane;
- no overengineering: no separate public app or duplicated resolver;
- proven platform capability: Cloudflare Pages Custom Domains, Functions and preview deployments;
- customer value first: implementation proceeds while the final brand is selected, while keeping the eventual URL short and easy to type.

## Cutover checklist

Before public custom-domain cutover, verify at minimum:

- domain attached through Pages Custom Domains, not only manual DNS;
- root `/<slug>` HTTP 200 without UUID/external-host redirect;
- relative and nested bundle assets under `/<slug>/...`;
- invalid slug 404;
- `noindex, nofollow, noarchive`;
- engagement telemetry + QR source;
- employee-test classification;
- public hostname rejects internal `/start-design`, `/brief`, `/p`, CMS/API routes;
- temporary `/prospect/<slug>` transition behavior.

Before CMS hostname cutover, also verify:

- Supabase Auth Site/redirect URLs;
- invite/password flows;
- absolute internal links;
- CORS/origin checks;
- CSP;
- cookie scope where applicable;
- generated prospect links;
- internal-host behavior;
- old-host redirects;
- representative authenticated browser smoke tests.
