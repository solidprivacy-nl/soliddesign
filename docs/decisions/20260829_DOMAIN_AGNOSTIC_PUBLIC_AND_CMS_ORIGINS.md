# Decision — Domain-agnostic public and CMS origins

**Date:** 2026-08-29  
**Status:** ACCEPTED / rollout basis

## Decision

SolidDesign will implement the new multi-user architecture without waiting for the final prospect-facing brand/domain decision.

The application treats public and internal origins as configuration, not as prospect data or workflow identity.

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

Full public URLs are derived, never stored as the canonical prospect identity.

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

### Phase B — final prospect-facing domain

After the team selects and registers `<brand>.nl`, attach it to the same Cloudflare Pages project and change delivery configuration:

```text
PUBLIC_PROSPECT_ORIGIN=https://<brand>.nl
PUBLIC_PROSPECT_PATH_PREFIX=
```

Canonical public URLs become:

```text
https://<brand>.nl/<public_slug>
```

No migration of prospects, assignments, demos, LIVE state, engagement history or mailing/contact state is required.

Temporary URLs may redirect to the new canonical URL during cutover.

### Phase C — branded CMS hostname

The internal CMS may later move to:

```text
INTERNAL_ORIGIN=https://cms.<brand>.nl
```

by attaching `cms.<brand>.nl` as a custom subdomain to the same Pages project and changing only hostname-dependent configuration such as auth redirects, explicitly allowed origins, CSP and generated links.

No new application, deployment or operational-data migration is required.

The old `soliddesign-cms.pages.dev` hostname may remain temporarily or redirect to `cms.<brand>.nl` after auth/callback smoke tests pass.

## Invariants

1. Domain names are delivery configuration, not business identity.
2. `public_slug` is the stable prospect-facing key.
3. Engagement is keyed to `prospect_id` / `demo_id`, not a full URL.
4. No second Pages project is created merely for a temporary hostname.
5. Public and internal surfaces may share one deployment but have explicit route/host boundaries.
6. Changing public or internal hostname requires no prospect, demo, assignment or event migration.
7. Hardcoded production origins in business logic are prohibited; use configured origins/helpers.
8. There is one canonical public prospect URL at any given time.
9. Preferred final hostname shape is `cms.<brand>.nl` internally and `<brand>.nl/<slug>` externally.
10. The temporary `/prospect/<slug>` path is a rollout mechanism, not a permanent public information architecture requirement.

## Rationale

- first principles: domains serve brand/usability, not data identity;
- solid but simple: one application and one deployment;
- no overengineering: no temporary second Pages project or branch deployment;
- proven platform capability: Cloudflare Pages Custom Domains and redirects;
- customer value first: implementation proceeds while the team chooses the final brand.

## Cutover checklist

Before either public or CMS hostname cutover, verify:

- Supabase Auth redirect URLs;
- invite/password flows;
- absolute links;
- CORS/origin checks;
- CSP;
- cookie scope where applicable;
- generated prospect links;
- public host allowlist;
- internal host behavior;
- old-host redirects;
- representative browser smoke tests.
