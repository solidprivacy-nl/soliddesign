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
```

The prospect identity remains:

```text
prospects.public_slug
```

and URLs are always derived from configuration plus the slug. Full public URLs are not stored as the canonical prospect identity.

## Rollout

### Phase A — temporary public route

Until the final public brand/domain is chosen:

```text
INTERNAL_ORIGIN=https://soliddesign-cms.pages.dev
PUBLIC_PROSPECT_ORIGIN=https://soliddesign-cms.pages.dev
```

Public prospect delivery uses the explicit temporary namespace:

```text
https://soliddesign-cms.pages.dev/prospect/<public_slug>
```

Example:

```text
https://soliddesign-cms.pages.dev/prospect/siberg
```

This namespace is temporary infrastructure. It must not become part of the prospect data model.

### Phase B — final prospect-facing domain

After the team selects and registers the public brand/domain, attach that domain to the same Cloudflare Pages project and change only public-origin/routing configuration.

Example if Dizein is selected:

```text
PUBLIC_PROSPECT_ORIGIN=https://dizein.nl
```

Canonical public URLs then become:

```text
https://dizein.nl/<public_slug>
```

Example:

```text
https://dizein.nl/siberg
```

No migration of prospects, assignments, demos, LIVE state, engagement history or mailing/contact state is required.

Temporary legacy URLs may redirect to the new canonical public URL during cutover.

## Future CMS hostname

The internal CMS hostname is also treated as configurable infrastructure.

If the final brand domain is `dizein.nl`, the CMS may later move from:

```text
https://soliddesign-cms.pages.dev
```

to for example:

```text
https://cms.dizein.nl
```

by attaching `cms.dizein.nl` as a custom subdomain to the same Cloudflare Pages project and changing `INTERNAL_ORIGIN` plus any explicitly configured callback/allowed-origin references that actually depend on the hostname.

This does not require a new application or migration of operational data.

During cutover, the old `*.pages.dev` hostname may remain available temporarily or redirect to the new CMS hostname after authentication/callback and operational checks are complete.

## Invariants

1. Domain names are delivery configuration, not business identity.
2. `public_slug` remains the stable prospect-facing key.
3. Prospect engagement is keyed to `prospect_id` / `demo_id`, not to a full URL.
4. No second Pages project is created merely to obtain a temporary public hostname.
5. Public and internal surfaces may share one Pages deployment but have explicit route/host boundaries.
6. Changing public or internal hostname must not require prospect, demo, assignment or event migration.
7. Hardcoded production origins in business logic are prohibited; use the appropriate configured origin/helper.
8. Old URLs may be redirected during cutover, but there is one canonical public prospect URL at any given time.

## Rationale

This preserves the SolidDesign engineering principles:

- first-principles: domains serve brand/usability, not data identity;
- solid but simple: one application and one deployment;
- no overengineering: no temporary second Pages project or branch deployment;
- proven platform capability: Cloudflare Pages Custom Domains and redirects;
- customer value first: development can continue while the team decides the final brand.

## Cloudflare implementation note

A custom subdomain such as `cms.dizein.nl` can be attached to a Cloudflare Pages project through Pages Custom Domains. If DNS is managed in Cloudflare, the CNAME can be created automatically; otherwise the custom subdomain can be configured as a CNAME to the project `*.pages.dev` hostname after first associating the custom domain in the Pages project.

Before any hostname cutover, verify authentication redirect URLs, absolute links, CORS/origin checks, CSP if applicable, cookies, generated links and smoke tests. Only change the configuration that actually depends on the hostname; do not introduce a new deployment solely for the rename.
