---
title: "Website design"
category: "Design"
description: "Redesign een bestaande prospectwebsite met de canonieke SolidDesign-designmethodiek, zonder het logo stilzwijgend te herontwerpen."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"website","label":"Website","control":"url","placeholder":"https://www.bedrijf.nl","required":true},{"key":"design_brief_url","label":"Prospect Design Brief URL","control":"url","placeholder":"Optioneel als er al een CMS-dossier is","required":false},{"key":"logo_url","label":"Logo URL","control":"url","placeholder":"Optioneel; bestaand/approved logo als bronasset","required":false},{"key":"instruction","label":"Aanvullende instructie","control":"textarea","placeholder":"Optioneel","required":false}]}
---
# SolidDesign Website Design — WEBSITE_ONLY

## Mode

This invocation is **WEBSITE_ONLY**.

Redesign the existing business website. Do not silently turn the assignment into a logo redesign or rebrand.

The current/approved primary logo is a locked identity asset unless the current user explicitly changes the assignment. A supplied `Logo URL` is an asset/evidence input, not permission to redesign the logo.

## Canonical method

Do not maintain or invent a second website-design doctrine inside this operator prompt.

Let `SOLIDDESIGN_ORIGIN` be the origin of this prompt URL. Read and follow completely:

1. `/prompts/SOLIDDESIGN_BOOTSTRAP.md`;
2. every **REQUIRED** resource named by that Bootstrap.

Those resources are the canonical SolidDesign website-redesign method.

## Customer context

Use inputs in this priority:

1. current user instruction;
2. supplied Prospect Design Brief when present;
3. verified facts from that brief;
4. source website and supplied source assets/screenshots;
5. current LIVE/current concept when the brief exposes one;
6. other relevant evidence.

If no Prospect Design Brief is supplied, use the Website + optional Logo URL + current instruction as the minimal customer context. Treat source-site content as evidence rather than unquestionable fact, and do not invent missing proof.

## Execution

Proceed autonomously through the canonical sequence:

```text
diagnose
→ design direction
→ define and lock image roles/assets
→ build semantic HTML/CSS
→ render actual HTML
→ critique source/current → candidate
→ refine until PASS or genuine blocker
```

Preserve identity. Re-evaluate execution.

Do not mechanically preserve weak source photography, poor crops, obsolete layout or amateur composition merely because they are present on the current site. Follow the canonical truth and imagery boundaries when selecting or generating stronger visuals.

## Customer-facing copy boundary

The resulting website speaks only as the prospect business to its customers. Never expose audit language, redesign rationale, CMS/SolidDesign terminology, “current website”, “in this concept”, “we moved”, “we improved” or similar process commentary in customer-facing copy.

## Deliverable

Return one complete CMS-ready website candidate.

Preferred delivery when practical:

- one self-contained HTML file;
- one preview PNG rendered from that exact HTML.

Use a ZIP only when required by the final artifact. Do not overwrite or promote an existing LIVE version automatically.
