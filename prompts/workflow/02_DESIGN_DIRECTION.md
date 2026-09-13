# Workflow 02 — Design Direction + Visual Asset Production

## Goal

Translate diagnosis into one coherent prospect-specific visual direction and resolve the actual logo + imagery needed to build it professionally.

This workflow is not complete when it only describes a direction. It owns visual asset readiness before HTML.

## Phase A — establish the design direction

Decide explicitly:

- core customer proposition above the fold;
- primary CTA and any justified secondary CTA;
- navigation and page hierarchy;
- hero structure and message density;
- trust/proof architecture using verified evidence only;
- service grouping and naming in customer language;
- visual personality appropriate to the actual business;
- typography, spacing, contrast and content density;
- mobile hierarchy and action placement;
- what will deliberately be omitted.

Prefer one coherent visual idea over a stack of unrelated fashionable sections.

## Phase B — finalize the logo decision

Use the diagnosis to choose exactly one:

### KEEP

Use the current logo exactly, or create a clean production-ready extraction only when needed for implementation. Preserve its identity.

### REFINE

Improve the existing logo's craft while preserving its recognizable concept/equity. Typical permitted corrections include:

- spacing and kerning;
- proportion and balance;
- geometry/stroke consistency;
- small-size legibility;
- transparent-background cleanup;
- a controlled digital lockup for header use.

### REDESIGN

Use only when the current logo materially limits the intended result. Preserve valuable recognition wherever possible and prefer evolutionary redesign over unrelated replacement.

When image-generation/editing capability is available and REFINE/REDESIGN is required, produce the logo asset as part of this workflow rather than leaving a future placeholder.

Lock the exact final website logo as:

**`LOGO_FINAL_01`**

`LOGO_FINAL_01` may be the existing logo when KEEP is correct. Once locked, do not redraw or approximate it differently inside HTML.

If changing the logo would require an irreversible identity decision that cannot be responsibly inferred from evidence, KEEP is safer than speculative rebranding. Do not block the whole redesign merely to chase marginal logo improvement.

## Phase C — define the image roles

For every prominent visual role, define before asset selection/generation:

- purpose — what must the image communicate?
- subject — what verified or generic subject is appropriate?
- whether it is evidence, atmosphere, service explanation or brand recognition;
- aspect ratio;
- focal point;
- intended crop/object-position;
- visual prominence;
- desktop behavior;
- mobile behavior.

Typical roles may include hero, one or more service images, company/about imagery or project imagery. Do not create image slots merely to fill a grid.

## Phase D — produce the actual imagery

Resolve every prominent role to an exact asset before HTML.

Choose the strongest truthful solution in this order:

1. strong real company/project image already suitable for the role;
2. real source image improved by crop/edit/cleanup when quality permits;
3. grounded art-directed visualization based on verified reality;
4. authentic service/sector-relevant photography;
5. high-quality generated image;
6. generic stock only as a last resort.

Weak source photography does not gain preservation rights merely because it is authentic. Preserve useful subject matter or visual truth; improve the pixels/presentation when the existing asset materially limits design quality.

When a required visual role lacks an adequate asset and generation/editing tools are available, **create or edit the asset now**. Do not build the site first and wait for the user to complain about photography later.

Do not ask the user to choose camera angle, crop, lighting or image style when those are normal art-direction decisions that can be made from the brief and composition.

## Truth boundary for generated visuals

Generated or reconstructed imagery may communicate service, atmosphere, craft or context, but may not fabricate documentary proof.

Do not present as real company evidence unless verified:

- a specific employee/person;
- company premises;
- vehicle/fleet;
- project/client location;
- completed installation;
- certification or product partnership.

If a generated visual is illustrative, ensure the surrounding copy does not imply it documents a verified company-specific fact.

## Phase E — lock the asset set

Assign stable internal identities to every final prominent asset, for example:

```text
LOGO_FINAL_01
IMG_HERO_01
IMG_SERVICE_PLUMBING_01
IMG_SERVICE_HEATING_01
IMG_ABOUT_01
```

For each image lock:

- exact asset identity;
- aspect ratio;
- focal point;
- desktop crop/object-position;
- mobile crop/object-position;
- evidence vs illustrative role.

Do not generate different imagery later merely because implementation starts.

## `ASSET_READY` hard gate

Set `ASSET_READY = PASS` only when all are true:

- final logo decision is KEEP / REFINE / REDESIGN and `LOGO_FINAL_01` exists;
- every prominent image role has a final exact asset;
- no dominant image knowingly relies on inadequate resolution, accidental crop or amateur source treatment;
- the set looks like one art-directed family rather than mismatched fragments;
- desktop/mobile crop intent is known;
- generated visuals remain grounded and non-misleading.

If any condition fails, remain in this workflow and resolve it. **Do not start Workflow 03.**

If adequate source imagery does not exist and required generation/editing capability is unavailable, that is a genuine blocker. State it precisely rather than producing knowingly weak HTML.

## Decision rules

1. Every major visual must serve comprehension, trust, action or genuine brand recognition.
2. Do not add generic statistics, testimonials, badges or logo strips without verified content and a commercial reason.
3. Use customer language rather than database labels, audit terminology or internal jargon.
4. Do not force the same layout on businesses with materially different buying behavior.
5. Preserve identity; improve execution.
6. Prefer bespoke coherent art direction over collage-like reuse of mismatched source fragments.
7. Keep the asset set as small as the design actually needs.
8. Do not expose exploratory weak variants to the operator merely because they were generated.

## Output/handoff

Handoff to Workflow 03 only with:

- design thesis;
- page/section order;
- hero proposition + CTA strategy;
- trust/content strategy;
- visual direction;
- `LOGO_FINAL_01` decision + exact asset;
- final image-role manifest with exact locked assets/crops;
- mobile-specific decisions;
- `ASSET_READY = PASS`.

The handoff is an implementation contract, not a speculative design-system document.
