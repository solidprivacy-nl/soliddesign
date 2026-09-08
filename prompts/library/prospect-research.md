---
title: "Prospectonderzoek"
category: "Research"
description: "Vind evidence-backed redesignprospects in een sector en locatie en lever een valide CMS-import CSV op."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"sector","label":"Sector","control":"text","placeholder":"Bijv. loodgieter","required":true},{"key":"location","label":"Locatie","control":"text","placeholder":"Bijv. Rotterdam","required":true},{"key":"additional_direction","label":"Aanvullende onderzoeksrichting","control":"textarea","placeholder":"Optioneel","required":false}]}
---
---
title: "Prospectonderzoek"
category: "Research"
description: "Vind evidence-backed redesignprospects in een sector en locatie en lever een valide CMS-import CSV op."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"sector","label":"Sector","control":"text","placeholder":"Bijv. loodgieter","required":true},{"key":"location","label":"Locatie","control":"text","placeholder":"Bijv. Rotterdam","required":true},{"key":"additional_direction","label":"Aanvullende onderzoeksrichting","control":"textarea","placeholder":"Optioneel","required":false}]}
---

# SolidDesign Prospect Design Opportunity Research

**Method version:** 2026-09-08  
**Architecture role:** Discovery Research Triage  
**Basis:** SolidDesign Prospect Design Opportunity Scoring Skill — Evidence-Weighted 2026 Edition.

## Objective

Find commercially credible businesses where the available evidence supports a clear, valuable redesign story.

Do not search for the ugliest websites. Find strong businesses whose current website demonstrably underperforms what the business appears to require.

This prompt performs **Discovery Research Triage only**.

Its purpose is to identify and prioritize credible candidates for the SolidDesign Discovery Inbox. It does **not** perform the canonical commercial qualification and it does **not** assign a final PDOS.

The Prospect Design Opportunity method is a prioritization method, not an aesthetic score.

Decision hierarchy:

```text
business relevance
→ observable website weakness
→ user/conversion impact
→ systemic redesign need
→ commercial prospect relevance
→ evidence confidence
→ research priority
```

Never invent prospect facts, reviews, certifications, demand, staff numbers, revenue, service areas, technical measurements, mobile findings or other evidence.

## Inputs

Use the **Sector** and **Location** from the invocation as the market scope.

Treat an optional **Additional research direction** as a hypothesis or focus point:

- never as verified truth;
- never as permission to fabricate evidence;
- never as permission to narrow the research so far that relevant candidates are missed.

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

For `N` useful shortlisted prospects, aim to discover approximately `3N` plausible candidates before final triage when practical.

Quality is more important than mechanically hitting a quota.

Inspect the real websites of plausible candidates.

## Discovery research method

This prompt performs **Research Triage**, not full commercial qualification.

Check, where evidence is available:

- active business signal;
- first-screen strategic clarity;
- offer/audience recognition;
- primary conversion route / CTA;
- visible relevant trust;
- mobile evidence only when actually inspected;
- technical or broken-site evidence only when actually observed or measured;
- service/project depth where relevant;
- whether weaknesses are localized quick wins or structural redesign opportunities;
- whether a compelling before/after redesign story can be supported without invented facts.

Allowed triage decisions:

- `DEEP_AUDIT` — strong candidate for later deeper assessment;
- `VERIFY_FIRST` — promising but material evidence is still missing or uncertain;
- `LOWER_PRIORITY` — eligible but materially weaker opportunity;
- `REJECT` — does not meet the research eligibility/priority bar.

`eligible_for_pdos=true` means only that the available evidence appears sufficiently promising to justify a later, separate PDOS/deep assessment.

Do **not** calculate WES, RDS, CPF or PDOS as part of this discovery research.

Do not fabricate numeric scores to create artificial precision.

Research priority and rank are evidence for human selection in the Discovery Inbox. They are not authority to promote a candidate into the active Prospect workflow.

## Evidence rules

Prefer atomic evidence:

```text
observation
→ location
→ likely consequence
→ severity/importance
→ recommended structural implication
```

Distinguish clearly between:

### Quick wins

Localized corrections possible without redesigning the overall system.

Examples may include:

- one unclear CTA;
- one missing trust element;
- one isolated copy problem;
- one broken link;
- one local layout issue.

Quick wins alone do not automatically make a strong redesign prospect.

### Structural redesign opportunities

Problems requiring meaningful rethinking of one or more of:

- hierarchy;
- information architecture;
- conversion flow;
- trust architecture;
- responsive composition;
- content structure;
- visual system;
- page relationships;
- service presentation.

A strong SolidDesign redesign candidate should normally have multiple structural opportunities, not merely many small defects.

A useful redesign hypothesis has the form:

> Because `[specific observed problem]` affects `[important visitor/business outcome]` across `[scope/reach]`, a redesign should `[specific structural change]`, verifiable by `[observable improvement criterion]`.

Avoid unsupported language such as “looks dated” as the sole rationale.

## Commercial prospect relevance

Do not confuse a bad site with a good prospect.

Evaluate observable evidence of:

- active business;
- fit with the requested market;
- importance of the owned website to customer acquisition or decision-making;
- signs of commercial maturity;
- practical outreach actionability;
- ability to demonstrate a meaningful redesign before/after.

Do not estimate revenue or demand without evidence.

Do not assume that a technically weak site is commercially weak.

Do not assume that a visually polished site is commercially strong.

## Confidence discipline

Confidence reflects **inspection coverage**, not researcher certainty.

Use:

- `HIGH` — broad direct inspection, including mobile and relevant pages/measurements where claims depend on them;
- `MEDIUM` — useful direct website/business evidence but one or more material checks remain incomplete;
- `LOW` — meaningful uncertainties remain and must be explicit.

Missing evidence must appear in `verification_needed`.

If mobile has not been inspected:

- do not infer a mobile finding;
- do not assign a mobile score;
- mark the missing evidence explicitly.

If technical performance has not been measured:

- do not invent technical performance claims;
- do not infer Lighthouse/Core Web Vitals results;
- record the missing check in `verification_needed` where relevant.

## Ranking discipline

`rank` is research ordering only.

It should reflect the relative quality of the redesign opportunity based on available evidence.

It is **not**:

- a PDOS;
- a commercial qualification score;
- a guarantee that the candidate should become a Prospect;
- permission to override missing evidence.

Use `provisional_priority` only as allowed by the canonical contract.

A candidate may be ranked highly while still requiring `VERIFY_FIRST` if critical evidence is missing.

## Relationship to later qualification

This research is only one evidence layer in the SolidDesign workflow.

The intended downstream flow is:

```text
prospect-research
→ evidence-backed research triage
→ CSV
→ qualification.research
→ CMS deterministic site check
→ qualification.triage
→ Discovery Inbox
→ human Toevoegen / Afwijzen
→ Prospect
→ later commercial qualification / deeper assessment
```

The current canonical commercial qualification is outside the scope of this prompt.

A later PDOS/WES/RDS/CPF assessment may be performed separately when evidence coverage justifies it and when the workflow explicitly asks for it.

Do not collapse discovery research, commercial qualification and experimental deep scoring into one step.

## Human authority

No candidate may be treated as automatically approved because this research ranks it highly.

Research evidence supports the operator decision.

It does not replace the operator decision.

The CMS human decision remains authoritative:

```text
DISCOVERED
→ operator reviews evidence
→ Toevoegen or Afwijzen
```

## Output contract — mandatory

The final deliverable for the CMS research-import workflow is a CSV that follows this exact canonical contract:

https://soliddesign-cms.pages.dev/prompts/contracts/prospect-research-import-v1.json

Read that contract completely before producing the final CSV.

The CSV headers must be exactly the contract's `columns`, in that exact order.

Do not:

- add convenience columns;
- omit required columns;
- rename headers;
- change enum values;
- change the contract separator.

For `source_urls`, join direct evidence URLs using the contract separator:

```text
 | 
```

Boolean values must be unambiguous CSV booleans:

```text
true
false
```

`rank` is research ordering, not a fabricated PDOS score.

`provisional_priority` must use only the contract enum.

`evidence_confidence` must use only the contract enum.

A triage row may have `eligible_for_pdos=true` while still requiring deeper verification before any final PDOS can be assigned.

## Source discipline

Use direct, relevant evidence where practical.

Prefer:

- the business's own website;
- relevant service/project/contact/about pages;
- direct business profiles or credible local business sources where needed to establish active/current status.

Do not rely only on:

- search snippets;
- directory summaries;
- cached fragments;
- inferred reputation.

When a source materially supports a statement, include its direct URL in `source_urls`.

Do not add irrelevant source URLs merely to increase source count.

## Final response

Return the completed CSV as the primary artifact/output.

Keep any narrative summary compact and separate from the CSV.

The CSV must remain independently importable into SolidDesign.

Do not output a full PDOS table unless explicitly requested by a separate downstream deep-audit workflow.

## Governing rule

> Do not search for the worst websites. Find the strongest businesses where the evidence supports the clearest, most valuable redesign story.
