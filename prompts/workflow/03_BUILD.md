# Workflow 03 — Build and Iterate

## Goal

Build the smallest complete website concept that proves the chosen design direction using the exact logo and imagery already resolved by Workflow 02.

## Entry gate

Workflow 03 may start only when:

**`ASSET_READY = PASS`**

Required handoff:

- final page/section direction;
- exact `LOGO_FINAL_01`;
- exact final image-role manifest, including EVIDENCE / ILLUSTRATIVE classification;
- locked aspect ratios, focal points and desktop/mobile crop intent;
- verified prospect facts and Website Opportunity priorities.

If these are incomplete, return to Workflow 02 and solve them first. Do not compensate with placeholders, enlarged source thumbnails or “temporary” images.

## Mandatory production order

1. confirm `ASSET_READY = PASS`;
2. establish the semantic information architecture from the approved direction;
3. build semantic HTML/CSS around the **exact locked logo and imagery**;
4. make responsive behavior intentional;
5. render the actual HTML at representative desktop and mobile widths;
6. inspect asset fidelity, crops, hierarchy, commercial clarity and the real-for-trust / generated-for-polish balance in the render;
7. compare source/current concept → rendered candidate;
8. refine layout/code as needed;
9. if a locked asset itself proves materially unsuitable in the real render, return internally to Workflow 02, replace/re-lock that asset, then rebuild/re-render;
10. continue until further changes produce no material improvement.

Do not expose the failed intermediate candidate to the user merely to request another image-generation round.

## Build rules

1. Build from the diagnosed prospect and locked design direction; do not restart from generic template defaults.
2. Use verified prospect facts. If content is missing, write neutral structural copy or omit the block rather than inventing proof.
3. Use the exact `LOGO_FINAL_01`; never approximate, redraw or silently revert to the old logo after a refinement/redesign decision.
4. Use the exact locked imagery and crop intent. Do not substitute visually weaker “equivalent” images during implementation.
5. Preserve each image role's EVIDENCE / ILLUSTRATIVE classification. EVIDENCE must remain verified company-specific material; ILLUSTRATIVE imagery may provide service explanation, atmosphere, craft and premium polish without impersonating proof.
6. Do not respond to limited verified photography by stripping useful illustrative imagery from a design that clearly benefits from it. Conversely, do not add generated imagery merely to fill space.
7. Keep hierarchy obvious: proposition → relevant proof/context → services/content → action.
8. Treat mobile as a real layout, not a compressed desktop version.
9. Avoid unnecessary components, animation, libraries and architectural changes.
10. Prefer a complete static HTML/CSS/JS bundle that can be uploaded to the SolidDesign CMS when the task allows it.
11. When one self-contained HTML file is practical, embed critical logo/imagery so the intended design survives CMS upload without source-site hotlinks or relative-path failures.
12. Do not enlarge low-resolution imagery into dominant visual roles.
13. Keep generated imagery grounded: use it for presentation, not as fabricated documentary evidence.
14. The prospect website speaks only as the prospect business to its customers. Never include design commentary, audit terminology, “current website”, “this concept”, “we moved”, SolidDesign/CMS language or redesign rationale in customer-facing copy.
15. Do not create a reusable template/framework to solve one customer's design issue.
16. Do not introduce new image-generation tasks during HTML merely for decoration. The prominent asset set was already deliberately chosen; add only when a real design problem requires it.
17. Keep the final artifact visually coherent with the locked art direction rather than mechanically reflecting the source site's section structure.
18. **No decorative numbering.** Do not add `01 / 02 / 03 / 04`, numbered cards or other ordinal labels merely to create visual structure. Numbers are allowed only when they carry real semantic meaning, such as an actual sequence/process, ranking, date/year, quantity, verified metric or numbered reference the visitor benefits from understanding.
19. Avoid repeated cards, badges, chips or pseudo-UI patterns when typography, composition, imagery and spacing can communicate the same structure more naturally.

## HTML fidelity rule

The HTML is the website design when HTML is the deliverable.

Do not create a polished standalone mock-up and then rebuild a weaker generic approximation. Render the final HTML and judge that actual result.

## Internal iteration discipline

For each meaningful revision:

- identify the specific problem being solved;
- change the smallest coherent set of elements that addresses it;
- preserve improvements already accepted;
- inspect actual image quality and crop, not just semantic relevance;
- verify that trust-critical visuals remain genuine and illustrative visuals still provide enough visual richness where useful;
- re-check desktop and mobile consequences;
- reject a revision that is merely different rather than materially better.

If the correction requires different imagery or logo treatment, route back to Workflow 02, re-lock the affected asset and continue automatically.

Do not make the user orchestrate that loop.

## Candidate visibility rule

Only a candidate that has completed Workflow 04 with `PASS` is a deliverable.

Do not present v1/v2/v3-style failed experiments as if the operator must choose or diagnose them. Version history may exist in the CMS, but the ChatGPT design run should deliver the strongest passing candidate unless the user explicitly requests alternatives.

## Version note format

Keep any required version note short and factual, for example:

```text
Hero hierarchy rebuilt; service imagery replaced with locked art-directed assets; mobile CTA simplified.
```

Do not use version notes as a design diary.
