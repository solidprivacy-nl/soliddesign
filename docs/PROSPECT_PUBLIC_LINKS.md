# Prospect public links

SolidDesign gives every prospect one stable, human-readable public link to the current LIVE mock-up:

```text
https://soliddesign-cms.pages.dev/<public-slug>
```

Example:

```text
https://soliddesign-cms.pages.dev/jansen-installatiebedrijf
```

## Data ownership

`prospects.public_slug` belongs to the prospect, not to a demo version. This is deliberate: changing which mock-up is LIVE must never change the link already printed, mailed or dictated to a prospect.

The slug is generated automatically when a prospect is created. It is normalized to lowercase ASCII letters, numbers and hyphens, is unique, and is not regenerated when the prospect name changes. Name collisions first use the city and finally a short UUID suffix.

Operators may change the value explicitly. Renaming is therefore treated as a deliberate communication change: previously shared short links stop resolving after a rename.

## Operator placement and wording

The field lives in **Mock-up versies**, immediately beside the current LIVE mock-up. It does not belong in Contactopvolging or discovery/source facts because it is part of the public mock-up presentation layer.

User-facing labels intentionally avoid implementation jargon:

- section: **Korte prospectlink**
- editable field: **Korte naam in prospectlink**
- derived read-only field: **Volledige prospectlink**

The UI explains that the link is public, easy to type, stable across LIVE version changes, and that renaming invalidates an earlier shared short link.

## Routing

The root Pages route resolves the slug to the prospect and current LIVE demo. New immutable-bundle LIVE demos continue through the existing stable UUID route. Older LIVE demos keep using their existing preview target so short links work for legacy prospects as well.

Existing UUID routes remain supported:

```text
/p/<prospect-uuid>/
```

A visitor may enter the short link with or without a trailing slash. Communication material omits the trailing slash because it is shorter and easier to type.

## Public database surface

Anonymous database access is limited to the route metadata required by the Pages resolver. RLS only exposes the prospect and LIVE demo whose slug exactly matches the custom resolver request header. No contact, qualification, discovery or other prospect data is made public by this feature.
