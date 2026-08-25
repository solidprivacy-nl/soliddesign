# Premium Design v1

## Objective

Upgrade the pre-sale concept from a technically improved generic page to a materially more premium, persuasive local-service concept **without broadening the architecture**.

The design layer exists to improve sales proof quality. It is not a general website-builder platform.

## Non-negotiable ground rule

> **Solid but simple. Overengineering is a mortal sin.**

If a design improvement requires a new agent, queue, daemon, visual editor, database, provider router, template marketplace or free-form code generator, the default answer is **no**.

## Root problem

Gate 2 proved discovery, audit, qualification, proof assembly and deployment. The remaining weakness was the last-mile concept quality.

The original renderer had a fixed generic composition:

```text
split hero
→ equal feature cards
→ stats bar
→ generic CTA
```

with Inter-like typography, large rounding and a decorative gradient placeholder.

That was structurally correct but commercially weak.

## v1 architecture

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
HUMAN VISUAL ACCEPTANCE
      ↓
STATIC PREVIEW
```

Only one new owned contract is introduced: `DesignProfile`.

Only one new executable donor is introduced: `impeccable@3.6.0` in CI.

## DesignProfile

`DesignProfile` is deliberately small and deterministic.

It contains:

```text
page_type
 tone
 palette
 font_display
 font_body
 radius
 hero_variant
 services_variant
 trust_variant
 cta_variant
 media_strategy
 motion_level
 anti_patterns
```

It does **not** contain:

- generated HTML;
- generated React;
- prompts;
- agent state;
- arbitrary CSS;
- template source code;
- a component marketplace.

## Current Phase-1 design recipe

Phase 1 intentionally supports one strong composition:

```text
authority_service
```

This is appropriate for local service businesses where trust, clarity and direct contact matter more than visual novelty.

Current block recipe:

```text
restrained navbar
→ authority hero
→ verified proof band when facts exist
→ editorial service list
→ contrast CTA
→ minimal footer
```

This is one recipe, not a template family system.

## Design intelligence

Design decisions are inspired by the reviewed UI/UX Pro Max patterns, but its runtime/database is not imported.

Current deterministic routing is intentionally narrow:

- verified brand color wins when safe;
- otherwise category signals select a restrained accent;
- typography and layout stay consistent;
- no per-sector template proliferation.

Only broaden routing when repeated Gate-3 evidence shows one composition is materially wrong for a recurring business class.

## Copy discipline

The concept page is written for the prospect's customer, not for the prospect.

Separate purposes:

```text
AUDIT / PRINT PACK
= explain the conversion opportunity to the business owner

CONCEPT WEBSITE
= show what the business could say to its customer
```

The customer-facing concept must not say things such as:

- "conversion-oriented redesign";
- "audit finding";
- "we improved your CTA".

It should present verified services, location and contact clearly.

All factual claims remain constrained by `VerifiedFacts`.

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

The renderer may only display proof already allowed by `VerifiedFacts` / reviewed enrichment.

## Visual principles

Premium v1 means:

- clear hierarchy;
- strong typography;
- deliberate whitespace;
- restrained color;
- low visual noise;
- direct CTA;
- editorial rhythm rather than repeated cards;
- limited rounding;
- no decorative glow;
- no generic AI gradient aesthetic;
- no unnecessary motion.

Premium does **not** mean maximal creativity.

For local-service concepts, trust and clarity outrank novelty.

## Media strategy

Current contract:

```text
verified_company_image_else_editorial_no_photo
```

Until a verified image pipeline exists, the renderer prefers an intentional photo-free editorial composition over fake or misleading imagery.

Future order, only if justified:

1. verified company imagery;
2. licensed relevant stock imagery;
3. editorial photo-free design;
4. generated concept-support imagery only after economics and claim-safety are proven.

Do not generate fake employees, projects, vans, offices or customer work.

## Impeccable QA

Pinned donor:

```text
pbakaus/impeccable
reviewed SHA: fcd7622cd2d8e2b09344ba8ede9fcac82cec4e70
CLI: 3.6.0
```

CI runs:

```bash
npx --yes impeccable@3.6.0 detect --json preview.html
```

The tool is advisory in premium-v1 while Gate 3 establishes which findings correlate with actual visual acceptance.

Hard local CI invariants already reject known unwanted patterns such as decorative gradients and forms.

Do not build an automated critique/retry agent around Impeccable.

## Human acceptance gate

For Gate 3, one short visual acceptance remains human.

Questions:

1. Is the new concept obviously stronger than the current website?
2. Does it feel credible and premium for this business category?
3. Is the customer proposition understandable above the fold?
4. Is the primary CTA obvious?
5. Does anything look generic, fake or AI-generated?

Record repeated failures. Automate only repeated observed failure modes.

## Explicitly rejected architecture

Do not add in premium-v1:

- Onlook;
- Loupe application/runtime;
- Open Design daemon;
- Taste Skill runtime;
- Figma integration;
- multi-agent design team;
- autonomous critique loop;
- image-to-code pipeline;
- 50-template library;
- free-form generated HTML/React;
- design database/server;
- second website builder.

## Exit criterion for premium-v1 spike

Premium-v1 is sufficient to enter Gate 3 when the existing Gate-2 prospect can be regenerated such that:

- all existing safety invariants remain green;
- the `DesignProfile` is recorded in artifacts;
- Impeccable runs successfully and produces machine-readable output;
- browser rendering is valid on desktop and mobile;
- the new concept is materially stronger in human visual review than the old concept;
- no new operational service is required.

If that condition is met, the five-prospect Gate-3 run uses this renderer.
