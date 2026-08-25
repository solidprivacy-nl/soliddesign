# Premium Design

## Objective

Upgrade the pre-sale concept from a technically improved page to a materially more attractive, credible and commercially sharper local-service concept **without broadening the architecture**.

The design layer improves sales proof quality. It is not a general website-builder platform.

## Non-negotiable ground rule

> **Solid but simple. Overengineering is a mortal sin.**

If a design improvement requires a new agent, queue, daemon, visual editor, database, provider router, template marketplace or free-form code generator, the default answer is **no**.

## Architecture

```text
VERIFIED FACTS
      +
CONVERSION BRIEF
      ↓
DESIGN PROFILE
      ↓
OPENPAGE-COMPATIBLE SITECONFIG
      ↓
SOLIDDESIGN PREMIUM RENDERER
      ↓
IMPECCABLE DESIGN QA
      ↓
HUMAN 5-SECOND VISUAL GATE
      ↓
STATIC PREVIEW
```

Only one owned design contract exists: `DesignProfile`.

Only one executable design donor exists in CI: `impeccable@3.6.0`.

## Why premium v2 was required

Gate 3 proved that premium-v1 was technically repeatable, but a full-size visual review exposed defects that deterministic QA did not catch:

- long hero copy could overlap the adjacent panel;
- the dark decorative hero panel dominated the page without adding useful information;
- generated headlines and service copy still felt database-like;
- location/direct-contact filler was being presented as if it were proof;
- the final dark CTA repeated the same heavy visual mass;
- a scanner-clean page was therefore not automatically outreach-ready.

Canonical lesson:

```text
DETERMINISTIC QA PASS
!=
VISUAL ACCEPTANCE PASS
```

## Current Phase-1 design recipe

Phase 1 intentionally keeps **one** composition:

```text
authority_service
```

Current recipe:

```text
restrained navbar
→ customer-facing split hero
→ functional light service summary
→ factual proof only when verified proof exists
→ editorial service list
→ light direct-contact CTA
→ minimal footer
```

There is no template-family system.

## Premium v2 corrections

Premium v2 changes craft, not architecture:

- shorter human-readable service labels in hero copy;
- sentence-case service presentation;
- responsive grid columns use `minmax(0, ...)` and content containers use `min-width: 0`;
- headline size is bounded and automatic hyphenation is disabled;
- decorative dark hero panel removed;
- functional service summary replaces decoration;
- fake proof fillers removed;
- muted text contrast strengthened;
- final CTA is light and restrained;
- small sector-aware accent routing is allowed when no verified brand color exists.

Source facts remain unchanged; only their customer-facing presentation is normalized.

## Copy discipline

The concept page is written for the prospect's customer, not for the prospect.

```text
AUDIT / PRINT PACK
= explain the conversion opportunity to the business owner

CONCEPT WEBSITE
= demonstrate how the business can communicate to its customer
```

Do not publish database-like concatenations, audit language or claims about the redesign process as customer copy.

## Proof discipline

Never invent:

- testimonials;
- review scores;
- years active;
- guarantees;
- certifications;
- response times;
- team size;
- project counts;
- service areas;
- awards.

Only proof explicitly allowed by `VerifiedFacts` / reviewed enrichment may appear. If verified proof is absent, omit the proof block rather than filling it with weak facts such as city or the existence of a telephone number.

## Media strategy

Current contract:

```text
verified_company_image_else_editorial_no_photo
```

A clean photo-free composition is preferable to invented employees, projects, vans, offices or customer work.

Verified company imagery may be added later only through a small proven input path; lack of imagery is not justification for an image-generation subsystem.

## Deterministic QA

Pinned donor:

```text
pbakaus/impeccable
reviewed SHA: fcd7622cd2d8e2b09344ba8ede9fcac82cec4e70
CLI: 3.6.0
```

CI requires:

```bash
npx --yes impeccable@3.6.0 detect --json preview.html
```

and the result must be exactly `[]`.

Known findings are fixed in the renderer. Do not suppress findings or build an autonomous critique/retry agent.

## Human 5-second visual gate

Before any concept is used for outreach, review both desktop and mobile.

A concept passes only when all five statements are true:

1. **Attractiveness:** within five seconds it is visibly more attractive and composed than the weak experience it is intended to replace.
2. **Credibility:** it looks plausible and professional for the actual business/sector.
3. **Commercial clarity:** the customer proposition is understandable above the fold.
4. **Action:** the primary CTA is obvious without hunting.
5. **Craft:** there is no overlap, clipping, ugly word break, template filler, fake proof or obvious AI-slop pattern.

A scanner pass does not override a human failure.

When the failure is one-off, fix the content/case. When the same failure recurs across real cases, fix the smallest deterministic renderer rule. Do not create a framework in anticipation of variation.

## Current visual decision

The five Gate-3 prospects were rebuilt with premium-v2 at desktop and mobile widths. The first v2 review still failed because long technical words were hyphenated awkwardly and raw service labels looked database-like. One small correction normalized hero terminology, service casing and sector accents.

The second review passed the five-second gate across all five cases. This is sufficient for the first commercial experiment; it is not evidence that the renderer is a finished production-site design system.

## Explicitly rejected architecture

Do not add without later outcome evidence:

- second website builder;
- autonomous design agent;
- Figma integration;
- template catalogue;
- design database/server;
- image-to-code pipeline;
- autonomous critique loop;
- generated React/HTML;
- multi-agent design team;
- large visual-variation framework.

## Rule for future changes

Commercial evidence outranks aesthetic speculation.

If real outreach later shows that one composition is insufficient, the maximum first extension is **one additional deterministic composition variant** tied to a recurring business context. Do not build a template system before that evidence exists.
