---
title: "Website redesign"
category: "Design"
description: "End-to-end prospectredesign op basis van de canonical SolidDesign Combined Skill."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"website","label":"Website","control":"url","placeholder":"https://www.bedrijf.nl","required":true},{"key":"design_brief_url","label":"Prospect Design Brief URL","control":"url","placeholder":"Optioneel als er al een CMS-dossier is","required":false},{"key":"logo_url","label":"Logo URL","control":"url","placeholder":"Optioneel; bestaand logo als bronasset","required":false},{"key":"instruction","label":"Aanvullende instructie","control":"textarea","placeholder":"Optioneel","required":false}]}
---
# SolidDesign Redesign

Treat this as one end-to-end design assignment.

## Canonical method

Let `SOLIDDESIGN_ORIGIN` be the origin of this prompt URL. Read and follow completely:

1. `/prompts/SOLIDDESIGN_BOOTSTRAP.md`;
2. `/prompts/SOLIDDESIGN_COMBINED_SKILL.md`.

Do not invent, merge in or stack a second redesign doctrine. The Combined Skill is the canonical method.

## Customer context

Use, in priority order:

1. current user instruction;
2. supplied Prospect Design Brief when present;
3. verified facts and reviewed Website Opportunity from that brief;
4. source website and supplied source assets/screenshots;
5. current LIVE/current concept when the brief exposes one;
6. other relevant evidence.

If no Prospect Design Brief is supplied, use Website + optional Logo URL + current instruction as the minimum customer context.

## Required execution

Proceed autonomously through the complete Combined Skill:

```text
diagnose business + brand
→ assess logo KEEP / REFINE / REDESIGN
→ lock exact final logo
→ derive visual direction
→ art-direct and lock imagery
→ build semantic responsive HTML
→ render desktop + mobile
→ critique actual render
→ refine until no material improvement remains
→ deliver final candidate
```

The design should be visually ambitious where appropriate, but factual claims and company-specific proof must remain grounded.

Do not redesign a usable logo merely because it looks old. Do not use decorative numbering without semantic meaning. Do not leak redesign/audit/CMS/SolidDesign process language into customer-facing copy.

## Deliverables

Return the final website HTML and a preview PNG rendered from that exact HTML. Return a separate final logo PNG when the logo was REFINE / REDESIGN or when a clean production logo asset was required.

Prefer one self-contained uploadable HTML file when practical. Use the exact locked logo and imagery in the HTML.

Do not overwrite or promote an existing LIVE version automatically.
