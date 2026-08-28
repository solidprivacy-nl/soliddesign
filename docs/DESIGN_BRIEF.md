# Prospect Design Brief

**Format:** v0.3  
**Purpose:** give a SolidDesign design agent the smallest complete customer-specific context needed to make the right next design decision.

## First principle

The Design Brief is not a database dump, qualification report or prompt framework. Supabase remains the operational source of truth. The brief is a deterministic design handoff derived from that source.

A field belongs in the brief only when it materially affects design truth, design direction, evaluation of the current site or evaluation of the current mock-up.

## Required order

1. **Design objective** — what the next design pass must accomplish.
2. **Prospect profile** — identity, location, source category, canonical sector key, website, phone and site kind.
3. **Verified prospect facts** — customer-facing facts that may safely be used.
4. **Verification gaps** — facts that must not be inferred or invented.
5. **Current website evidence** — compact verified audit issues and strengths; no raw audit JSON.
6. **Current design state** — current LIVE version first, plus a newer non-LIVE version only when one exists.
7. **Sector Intelligence** — canonical lookup identity and advisory-only authority rule.
8. **Operator direction** — explicit prospect-specific human direction.
9. **Hard constraints** — no-invention and authority boundaries.

## Deliberate exclusions

The brief does not include the raw `qualification` object. Sales qualification, preparation hashes, timestamps and other pipeline internals do not help the designer choose typography, hierarchy, imagery, trust or conversion structure. Relevant technical context such as site kind and reachability is surfaced directly instead.

The brief does not expose `site_config` or other mock-up implementation internals. The actual preview is the design evidence.

The brief does not repeat generic SolidDesign design-method instructions. Those remain in the Design Bootstrap and required prompt resources.

## Taxonomy rule

`prospects.category` is source taxonomy metadata and is never automatically treated as approved marketing copy.

The **Canonical sector key** is derived from the prospect's discovery-run sector identity when exactly one safe key is available. It exists only to locate optional published Sector Intelligence. It must not be used as a customer-facing service claim unless separately verified.

This prevents broad source categories such as `home service` from becoming copy such as “Home service in Amsterdam.”

## Current design rule

When a LIVE mock-up exists, the brief makes it the primary design baseline and provides both:

- the stable public prospect URL;
- the immutable version preview.

A later DRAFT may also be shown, but never replaces the LIVE baseline implicitly.

## Evidence rule

Audit findings are reduced to verified evidence only. Generic audit recommendations and verbose business-impact prose are not copied into the brief. Positive findings are included alongside issues so a redesign can preserve what already works.

The design agent must distinguish visual/UX opportunities from hosting, security, legal and infrastructure work and may not claim that a visual concept fixes the latter.

## Authority

```text
current user instruction
↓
SolidDesign design method
↓
Prospect Design Brief / verified prospect facts / operator direction
↓
Sector Intelligence
↓
other external evidence
```

Sector Intelligence may raise the quality bar but cannot create prospect facts or justify copying another site's distinctive design.

## Presentation

The public brief endpoint keeps the source as plain Markdown so both humans and design agents receive the same deterministic artifact. The page only adds lightweight wrapping and typography for readability; it does not introduce a second renderer, content model or Markdown-processing dependency.
