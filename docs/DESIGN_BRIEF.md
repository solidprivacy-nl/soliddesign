# Prospect Design Brief

**Format:** v0.5  
**Purpose:** give a SolidDesign design agent the smallest complete prospect-specific context needed to make the right next design decision.

## First principle

The Design Brief is not a database dump, qualification report or prompt framework. Supabase remains the operational source of truth. The brief is a deterministic design handoff derived from that source.

A field belongs in the brief only when it materially affects design truth, design direction, evaluation of the current website or evaluation of the current mock-up.

## Required order

1. **Design objective** — what the next design pass must accomplish.
2. **Prospect profile** — identity, location, source category, website, phone and site kind.
3. **Verified prospect facts** — customer-facing facts that may safely be used.
4. **Verification gaps** — facts that must not be inferred or invented.
5. **Prioritized website opportunities** — human-reviewed Website Opportunity titles + concrete evidence in stored priority order.
6. **Current website evidence** — compact verified technical/diagnostic audit issues and strengths; no raw audit JSON.
7. **Current design state** — current LIVE version first, plus a newer non-LIVE version only when one exists.
8. **Operator direction** — explicit prospect-specific human direction.
9. **Hard constraints** — no-invention and authority boundaries.

## Prospect-first design boundary

Sector/category information may exist upstream for discovery and classification, but it is not a design instruction.

The brief therefore does **not** contain a canonical sector key, Sector Intelligence lookup, sector template or design preset.

Design context is derived from:

```text
prospect identity
+ verified facts
+ source website/assets/screenshots
+ reviewed Website Opportunity priorities
+ current website evidence
+ current LIVE/concept
+ operator direction
```

This keeps design decisions grounded in the actual business rather than generalized assumptions about its category.

## Website Opportunity projection

`prospects.qualification.website_opportunity` is the one current human-reviewed business-priority layer. The Design Brief does not expose the raw `qualification` object; it projects only the design-relevant subset:

```text
priority order
+ title / observed issue
+ concrete evidence
```

The full `business_impact` sales explanation is not repeated by default. `recommendation` is advisory direction rather than an unquestionable visual instruction; the canonical design method still owns design reasoning.

If the stored `source_audit_id` differs from the latest audit, the brief shows a freshness warning instead of silently presenting the review as current.

`design_brief_note` remains a separate explicit operator instruction and is not used to persist Website Opportunity Review.

## Deliberate exclusions

The brief does not include the raw `qualification` object. Sales qualification, preparation hashes, timestamps and other pipeline internals do not help the designer choose typography, hierarchy, imagery, trust or conversion structure. Relevant technical context such as site kind and reachability is surfaced directly instead.

The brief does not expose `site_config` or other mock-up implementation internals. The actual preview is the design evidence.

The brief does not repeat generic SolidDesign design-method instructions. Those remain in the Design Bootstrap and required prompt resources.

`prospects.category` is source/discovery metadata. It may be shown as concise descriptive context, but it is never automatically treated as approved marketing copy or a design rule.

## Current design rule

When a LIVE mock-up exists, the brief makes it the primary design baseline and provides both:

- the stable public prospect URL;
- the immutable version preview.

A later DRAFT may also be shown, but never replaces the LIVE baseline implicitly.

## Evidence rule

Website Opportunity Review supplies human-reviewed business priority, but does not replace evidence. The brief therefore shows its prioritized title + evidence projection and keeps the technical/diagnostic audit evidence separately visible.

Audit findings are reduced to verified evidence only. Generic audit recommendations and verbose business-impact prose are not copied into the technical evidence section. Positive findings are included alongside issues so a redesign can preserve what already works.

The design agent must distinguish visual/UX opportunities from hosting, security, legal and infrastructure work and may not claim that a visual concept fixes the latter.

## Authority

```text
current user instruction
↓
SolidDesign design method
↓
Prospect Design Brief / verified prospect facts / operator direction
↓
human-reviewed Website Opportunity priority + source website/current design evidence
↓
other external evidence
```

No classification layer may override verified prospect facts or direct visual evidence.

## Presentation

The public brief endpoint keeps the source as plain Markdown so both humans and design agents receive the same deterministic artifact. The page only adds lightweight wrapping and typography for readability; it does not introduce a second renderer, content model or Markdown-processing dependency.
