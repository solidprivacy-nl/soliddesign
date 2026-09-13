---
title: "Logo + website design"
category: "Design"
description: "Verbeter eerst het bestaande logo en redesign daarna de prospectwebsite met exact dat gelockte logo en dezelfde canonieke SolidDesign-websitemethodiek."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"website","label":"Website","control":"url","placeholder":"https://www.bedrijf.nl","required":true},{"key":"design_brief_url","label":"Prospect Design Brief URL","control":"url","placeholder":"Optioneel als er al een CMS-dossier is","required":false},{"key":"logo_url","label":"Bestaand logo URL","control":"url","placeholder":"Optioneel als het logo betrouwbaar uit de website is te halen","required":false},{"key":"instruction","label":"Aanvullende instructie","control":"textarea","placeholder":"Optioneel","required":false}]}
---
# SolidDesign Logo + Website Design — LOGO_AND_WEBSITE

## Mode

This invocation is **LOGO_AND_WEBSITE**.

The required order is:

```text
logo diagnosis/redesign
→ lock one exact final logo
→ canonical SolidDesign website redesign
```

Do not maintain a second website-design doctrine in this prompt.

## Canonical resources

Let `SOLIDDESIGN_ORIGIN` be the origin of this prompt URL.

Read and follow completely:

1. `/prompts/workflow/00_LOGO.md` — optional logo workflow used by this mode;
2. `/prompts/SOLIDDESIGN_BOOTSTRAP.md` — canonical website root;
3. every **REQUIRED** website resource named by the Bootstrap.

## Customer context

Use inputs in this priority:

1. current user instruction;
2. supplied Prospect Design Brief when present;
3. verified facts from that brief;
4. source website and supplied logo/assets/screenshots;
5. current LIVE/current concept when the brief exposes one;
6. other relevant evidence.

If no Prospect Design Brief is supplied, use the Website + existing Logo URL + current instruction as the minimal customer context. Do not invent missing business proof.

## Logo phase

Execute Workflow 00 first. Create and lock exactly one final logo asset:

**`LOGO_FINAL_01`**

Do not proceed to final website implementation until that exact logo is selected and passes the logo acceptance gate.

## Website phase

After `LOGO_FINAL_01` is locked, execute the canonical Website Design Bootstrap exactly as normal, treating `LOGO_FINAL_01` as the approved/locked primary logo.

Use the same website rules, image-role planning, truth boundary, HTML fidelity, mobile checks and critique gates as WEBSITE_ONLY work. Do not copy or fork those rules here.

## Deliverables

Return exactly these core artifacts unless the current user asks for more:

1. the exact final logo PNG (`LOGO_FINAL_01`);
2. one CMS-ready website HTML file (or ZIP only when necessary);
3. one website preview PNG rendered from that exact HTML.

The website must use the exact locked logo and exact locked imagery. Do not overwrite or promote an existing LIVE version automatically.
