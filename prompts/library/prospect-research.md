---
title: "Prospectonderzoek"
category: "Research"
description: "Vind evidence-backed redesignprospects in een sector en locatie en lever een valide CMS-import CSV op."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"sector","label":"Sector","control":"text","placeholder":"Bijv. loodgieter","required":true},{"key":"location","label":"Locatie","control":"text","placeholder":"Bijv. Rotterdam","required":true},{"key":"additional_direction","label":"Aanvullende onderzoeksrichting","control":"textarea","placeholder":"Optioneel","required":false}]}
---
# SolidDesign Prospect Design Opportunity Research

**Method version:** 2026-09-08  
**Basis:** SolidDesign Prospect Design Opportunity Scoring Skill — Evidence-Weighted 2026 Edition.

## Objective

Find commercially credible businesses where the available evidence supports a clear, valuable redesign story. Do not search for the ugliest websites. Find strong businesses whose current website demonstrably underperforms what the business appears to require.

The Prospect Design Opportunity method is a prioritization method, not an aesthetic score.

Decision hierarchy:

```text
business relevance
→ observable website weakness
→ user/conversion impact
→ systemic redesign need
→ commercial prospect fit
→ evidence confidence
→ priority
```

Never invent prospect facts, reviews, certifications, demand, staff numbers, revenue, service areas, technical measurements, mobile findings or other evidence.

## Inputs

Use the Sector and Location from the invocation as the market scope. Treat an optional Additional research direction as a hypothesis or focus point, never as verified truth and never as permission to narrow the research so far that relevant candidates are missed.

## Eligibility

A candidate should normally satisfy all of these before it is prioritized:

- active or credibly current business evidence;
- correct requested sector and geography;
- own functioning business website;
- actual website inspected, not only search snippets;
- no obvious excluded chain/corporate mismatch for the local SolidDesign acquisition model;
- enough evidence to make a defensible triage decision.

A business appearing in search results or a directory does not by itself prove commercial attractiveness.

## Search discipline

The candidate set itself can be biased. Do not merely assess the first search-result page.

Use multiple query families where useful:

- sector + city;
- main service + city;
- sector + neighborhoods;
- sector + surrounding towns where consistent with the requested market;
- sector synonyms;
- suitable local directories/maps/business sources.

For `N` useful shortlisted prospects, aim to discover approximately `3N` plausible candidates before final triage when practical. Quality is more important than mechanically hitting a quota.

Inspect the real websites of plausible candidates.

## Two-stage method

### Stage 1 — Research triage

Use this for the broad candidate set. It is intentionally cheaper than a full PDOS assessment.

Check, where evidence is available:

- active business signal;
- first-screen strategic clarity;
- offer/audience recognition;
- primary conversion route / CTA;
- visible relevant trust;
- obvious mobile evidence only when actually inspected;
- obvious technical or broken-site evidence only when actually observed/measured;
- service/project depth where relevant;
- whether the weakness is a localized quick win or a structural redesign opportunity;
- whether a compelling before/after redesign story can be supported without invented facts.

Allowed triage decisions:

- `DEEP_AUDIT` — strong candidate for deeper assessment;
- `VERIFY_FIRST` — promising but material evidence is still missing or uncertain;
- `LOWER_PRIORITY` — eligible but materially weaker opportunity;
- `REJECT` — does not meet the research eligibility/priority bar.

### Stage 2 — Deep audit

Only perform full scoring when the evidence coverage justifies it.

The Evidence-Weighted 2026 method separates:

- **WES — Website Effectiveness Score, 0–100, higher is better current website**;
- **RDS — Redesign Depth Score, 0–100, higher is more systemic redesign need**;
- **CPF — Commercial Prospect Fit, 0–100, higher is a stronger SolidDesign prospect**;
- **Evidence Confidence — HIGH / MEDIUM / LOW**.

For a fully evidenced deep assessment:

```text
Headroom = 100 - WES
PDOS_raw = (Headroom × 0.40) + (CPF × 0.45) + (RDS × 0.15)
PDOS = PDOS_raw × confidence_multiplier
```

Confidence multiplier:

```text
HIGH   = 1.00
MEDIUM = 0.90
LOW    = 0.75
```

Priority guidance for a valid full PDOS:

```text
75+       Tier A
62–74.9   Tier B
50–61.9   Tier C
<50       do not prioritize
```

LOW confidence may not be treated as Tier A.

Do not fabricate a full PDOS merely because a numeric ranking would be convenient. If mobile has not been inspected, do not invent a mobile score. If technical performance has not been measured, do not invent a technical score.

## Evidence rules

Prefer atomic evidence:

```text
observation
→ location
→ likely consequence
→ severity/importance
→ recommended structural implication
```

Distinguish:

### Quick wins

Localized corrections possible without redesigning the overall system.

### Structural redesign opportunities

Problems requiring meaningful rethinking of hierarchy, information architecture, conversion flow, trust architecture, responsive composition, content structure or visual system.

A strong SolidDesign redesign candidate should normally have multiple structural opportunities, not merely many small defects.

A useful redesign hypothesis has the form:

> Because `[specific observed problem]` affects `[important visitor/business outcome]` across `[scope/reach]`, a redesign should `[specific structural change]`, verifiable by `[observable improvement criterion]`.

Avoid unsupported language such as “looks dated” as the sole rationale.

## Commercial Prospect Fit discipline

Do not confuse a bad site with a good prospect. Evaluate observable evidence of:

- active business;
- fit with the requested market;
- importance of the owned website to customer acquisition/decision-making;
- signs of commercial maturity;
- practical outreach actionability;
- ability to demonstrate a meaningful redesign before/after.

Do not estimate revenue or demand without evidence.

## Confidence discipline

Confidence reflects inspection coverage, not researcher certainty.

- `HIGH`: broad direct inspection, including mobile and relevant pages/measurements where claims depend on them;
- `MEDIUM`: useful direct website/business evidence but one or more material checks remain incomplete;
- `LOW`: meaningful uncertainties remain and must be explicit.

Missing evidence must appear in `verification_needed`.

## Output contract — mandatory

The final deliverable for the CMS research-import workflow is a CSV that follows this exact canonical contract:

https://soliddesign-cms.pages.dev/prompts/contracts/prospect-research-import-v1.json

Read that contract completely before producing the final CSV.

The CSV headers must be exactly the contract's `columns`, in that exact order. Do not add convenience columns and do not omit required columns.

For `source_urls`, join direct evidence URLs using the contract separator ` | `.

Boolean values must be unambiguous CSV booleans (`true` or `false`).

`rank` is research ordering, not a fabricated PDOS score.

`provisional_priority` must use only the contract enum.

`evidence_confidence` must use only the contract enum.

A triage row may have `eligible_for_pdos=true` while still requiring deeper verification before any final PDOS can be assigned.

## Final response

Return the completed CSV as the primary artifact/output. Keep any narrative summary compact and separate from the CSV. The CSV must remain independently importable into SolidDesign.

## Governing rule

> Do not search for the worst websites. Find the strongest businesses where the evidence supports the clearest, most valuable redesign story.
