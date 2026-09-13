---
title: "Website redesign"
category: "Design"
description: "End-to-end prospectredesign waarin logo, art direction, imagery en website als één coherent ontwerp worden opgelost vóór oplevering."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"website","label":"Website","control":"url","placeholder":"https://www.bedrijf.nl","required":true},{"key":"design_brief_url","label":"Prospect Design Brief URL","control":"url","placeholder":"Optioneel als er al een CMS-dossier is","required":false},{"key":"logo_url","label":"Logo URL","control":"url","placeholder":"Optioneel; bestaand logo als bronasset","required":false},{"key":"instruction","label":"Aanvullende instructie","control":"textarea","placeholder":"Optioneel","required":false}]}
---
# SolidDesign Redesign

## One assignment

Treat this as one end-to-end design assignment. Do not split normal work into “website-only” versus “logo+website” modes.

Logo, visual identity, imagery and webpage composition are all design inputs. A logo assessment is mandatory; a logo redesign is not. Photography must be solved as part of the design rather than deferred until after the first HTML candidate.

## Canonical method

Do not maintain or invent a second website-design doctrine inside this operator prompt.

Let `SOLIDDESIGN_ORIGIN` be the origin of this prompt URL. Read and follow completely:

1. `/prompts/SOLIDDESIGN_BOOTSTRAP.md`;
2. every **REQUIRED** resource named by that Bootstrap.

Those resources are the canonical SolidDesign redesign method.

## Customer context

Use inputs in this priority:

1. current user instruction;
2. supplied Prospect Design Brief when present;
3. verified facts and reviewed Website Opportunity from that brief;
4. source website and supplied source assets/screenshots;
5. current LIVE/current concept when the brief exposes one;
6. other relevant evidence.

If no Prospect Design Brief is supplied, use Website + optional Logo URL + current instruction as the minimal customer context. Treat source-site content as evidence rather than unquestionable fact, and do not invent missing proof.

## Required execution

Proceed autonomously through the canonical sequence:

```text
diagnose business + opportunity
→ assess logo: KEEP / REFINE / REDESIGN
→ establish art direction
→ define prominent image roles
→ select / edit / generate final imagery
→ lock exact logo + imagery
→ ASSET_READY
→ build semantic HTML/CSS around those assets
→ render desktop + mobile
→ critique source/current → candidate
→ repair material weaknesses internally
→ deliver one final passing candidate
```

Do not wait for the user to point out that source photography is low-resolution, badly cropped, visually inconsistent or unsuitable for the intended layout when this is visible from the evidence. When stronger visual assets are required and generation/editing capability is available, create them before HTML.

Do not redesign the logo merely because it is old. Keep it when it works; refine it when craft limits the website; redesign it only when it materially obstructs a professional result and preserve valuable recognition.

## Asset gate

Do not build prominent image containers first and then fill them with whatever source images happen to exist.

HTML starts only after the canonical `ASSET_READY` gate passes. If a required visual role cannot be resolved with adequate source material, solve it through editing/generation first. If the required capability is genuinely unavailable, state that blocker instead of delivering knowingly weak imagery.

## Customer-facing copy boundary

The resulting website speaks only as the prospect business to its customers. Never expose audit language, redesign rationale, CMS/SolidDesign terminology, “current website”, “in this concept”, “we moved”, “we improved” or similar process commentary in customer-facing copy.

## Deliverables

Return one complete CMS-ready website candidate, not a sequence of weak exploratory versions.

Preferred delivery when practical:

- one self-contained HTML file;
- one preview PNG rendered from that exact HTML;
- the final logo PNG only when the logo was refined/redesigned or the user explicitly asks for it.

Generated/edited imagery may be embedded directly into the self-contained HTML so the operator does not need to manually assemble image files. Provide separate image assets only when requested or operationally useful.

Do not overwrite or promote an existing LIVE version automatically.
