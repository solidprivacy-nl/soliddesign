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

Example only if Dizein were selected:

```text
https://dizein.nl/siberg
https://cms.dizein.nl
```

Changing hosts requires no migration of prospects, demos, LIVE state, assignments, mailings or engagement history.

## LIVE resolution

The public resolver performs one simple mapping:

```text
public slug
→ prospect
→ current LIVE demo
→ existing static artifact / LIVE manifest
```

The browser stays on the public URL. Internal UUID routes such as `/p/<uuid>/` remain implementation/compatibility routes, not customer-facing addresses.

A new LIVE mock-up therefore changes content but not the prospect's shared URL.

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

The full link is always derived from `publicProspectOrigin`, `publicProspectPathPrefix` and the slug rather than hardcoded business logic.

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

The data is keyed to prospect/demo, not to the full URL, so a later custom-domain cutover preserves the complete engagement history.

## Query parameters

Communication may use a minimal source marker such as:

```text
?src=qr
```

Canonical trailing-slash redirects preserve the query before the telemetry client consumes/removes it from the displayed URL.

## Public data boundary

Anonymous clients do not receive general prospect-table access. The public route may resolve only the narrow prospect/LIVE metadata required to serve the requested slug. Drafts, assignments, contact data, qualification detail and internal CMS capability remain private.

See also:

- `docs/INTEGRATED_OPERATING_ARCHITECTURE.md`
- `docs/decisions/20260829_DOMAIN_AGNOSTIC_PUBLIC_AND_CMS_ORIGINS.md`
- `docs/SECURITY.md`
