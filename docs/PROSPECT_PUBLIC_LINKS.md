# Prospect public links

## Purpose

Every prospect receives one stable, short, human-readable link to the current LIVE mock-up. The link is a customer-facing delivery address; it is not the identity of the demo version and not an authorization secret.

## Canonical identity

Only the slug is stored as durable prospect-facing identity:

```text
prospects.public_slug = siberg
```

Full URLs are derived from delivery configuration.

## Rollout URL

Until the final brand/domain is selected:

```text
https://soliddesign-cms.pages.dev/prospect/<public_slug>
```

Example:

```text
https://soliddesign-cms.pages.dev/prospect/siberg
```

This `/prospect/` namespace is temporary infrastructure and must not become part of the data model.

## Preferred final URL

After the team selects the public brand:

```text
https://<brand>.nl/<public_slug>
```

with the CMS optionally on:

```text
https://cms.<brand>.nl
```

Example only if Dizein is selected:

```text
https://dizein.nl/siberg
https://cms.dizein.nl
```

Changing hosts requires no migration of prospects, demos, LIVE state, assignments, mailings or engagement history.

## LIVE resolution

The canonical public resolver performs:

```text
public slug
→ prospect
→ current LIVE demo
→ canonical stored artifact
```

The browser stays on the prospect-facing URL. Internal UUID routes such as `/p/<uuid>/` are technical/compatibility routes, not communication addresses.

A new LIVE mock-up changes content but not the prospect's shared URL.

### LIVE artifact rule

New LIVE publication requires an immutable HTML/ZIP artifact stored in the existing `mockup-sites` lifecycle. An external HTTPS preview URL may exist as a DRAFT/review escape hatch but is not a new LIVE delivery source.

This rule is enforced both in the Operator experience and in the database, so future clients cannot accidentally reintroduce external-URL LIVE publication.

### Grandfathered legacy LIVE previews

A small finite set of LIVE records predates the artifact-only rule. Until migrated or retired, the public resolver may serve them through a narrow compatibility path that:

- accepts only explicitly allowlisted historical SolidDesign Cloudflare preview hosts;
- keeps the public prospect URL visible;
- strips internal/source classification parameters before upstream fetches;
- blocks redirects outside the expected legacy origin/path;
- injects the same central engagement telemetry into HTML;
- is not available for newly published external previews.

This is transition debt, not a general reverse-proxy architecture. Do not add arbitrary hosts to make unrelated external sites work; upload a canonical artifact instead.

## Slug lifecycle

The slug is normalized to lowercase ASCII letters, numbers and hyphens and must be unique.

Renaming is an explicit communication change because an already printed/mailed URL may otherwise break. Do not regenerate a slug merely because a prospect name changes.

## CMS placement

The operator sees:

- **Korte prospectlink**
- **Korte naam in prospectlink**
- **Volledige prospectlink**
- **Kopieer link**
- **Test als medewerker**

The full link is always derived from `publicProspectOrigin`, `publicProspectPathPrefix` and the slug rather than stored as business state.

## Internal testing

Normal staff design work uses the internal CMS/preview flow.

When a staff member deliberately opens the public prospect page through **Test als medewerker**, the CMS obtains a short-lived server-signed token bound to that slug. The public engagement endpoint validates it and marks that opening `INTERNAL`.

A guessable `?internal=1` flag and IP allowlists are intentionally not used.

## Engagement

Public pages receive central first-party telemetry at delivery time; individual mock-up bundles do not implement their own analytics.

Minimal signals:

- opening time;
- active visible time;
- maximum scroll;
- broad device type;
- QR/direct source;
- internal/external classification.

The data is keyed to prospect/demo, not to the full URL, so a later custom-domain cutover preserves engagement history.

## Query parameters

Communication may use a minimal source marker such as:

```text
?src=qr
```

Canonical trailing-slash redirects preserve the marker so the telemetry client can classify the opening. Internal classification tokens are never forwarded to legacy upstream previews.

## Public data boundary

The browser receives no general anonymous prospect/demos access. The Data API grants only the specific public resolver columns and RLS restricts rows to the requested slug/current LIVE demo using the resolver request header.

Public resolver data is limited to:

```text
prospects: id, public_slug
demos: prospect_id, status, preview_url, artifact_path
```

`preview_url` remains exposed only because grandfathered legacy LIVE resolution still needs it. Once that compatibility path is removed, revisit whether this public column grant can be reduced further.

Drafts, assignments, contact data, qualification detail and internal CMS capability remain private.

See also:

- `docs/ARCHITECTURE.md`
- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`
- `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`
- `docs/SECURITY.md`
