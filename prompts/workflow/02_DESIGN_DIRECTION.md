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
- role class — **EVIDENCE** or **ILLUSTRATIVE**;
- aspect ratio;
- focal point;
- intended crop/object-position;
- visual prominence;
- desktop behavior;
- mobile behavior.

Typical roles may include hero, one or more service images, company/about imagery or project imagery. Do not create image slots merely to fill a grid.

## Visual evidence / polish balance

Use this as the governing visual rule:

> **Real for trust. Generated for polish. Never misleading.**

Do not collapse all imagery into one truth standard. The correct asset source depends on the role.

### EVIDENCE roles

An image has an **EVIDENCE** role when a normal visitor could reasonably read it as proof of company-specific reality or identity, for example:

- company premises;
- team/staff;
- vehicle/fleet;
- a real project or completed installation;
- a specific client/location;
- certification, partnership or owned equipment;
- historical company material.

For EVIDENCE roles, use verified real source material. Editing, crop, cleanup and restoration are allowed when they preserve the underlying truth. Do not replace missing evidence with generated documentary-looking imagery.

### ILLUSTRATIVE roles

An image has an **ILLUSTRATIVE** role when it supports comprehension, atmosphere, service explanation, material quality, craft or premium perception without claiming to document the prospect itself.

For ILLUSTRATIVE roles, high-quality generated imagery is explicitly allowed and should be used when it materially improves the design. Typical uses include:

- clean service-detail photography;
- materials, tools or technical context;
- premium interior/work-detail imagery;
- atmospheric craft imagery;
- compositions that support visual rhythm or clarify a service.

Generated people may be used only when the context remains clearly illustrative. Do not use a generated person in a role where a normal visitor is likely to infer “this is their employee/customer/team member”.

### Balance rule

The truth boundary is **not** a reason to remove useful imagery by default.

Do not solve uncertainty by making the page unnecessarily sparse. If supporting imagery materially improves comprehension, perceived quality, visual rhythm or premium character, resolve suitable ILLUSTRATIVE imagery instead of omitting it merely because verified company photography is limited.

Conversely, do not add generated imagery simply to fill empty space. The number of images follows the composition and business need; there is no fixed image quota.

A strong result usually combines:

- verified real assets where identity/trust must be proven; and
- carefully art-directed illustrative assets where visual polish or service communication benefits from them.

## Phase D — produce the actual imagery

Resolve every prominent role to an exact candidate asset before HTML.

Choose the strongest truthful solution in this order, while respecting the role class above:

1. strong real company/project image already suitable for the role;
2. real source image improved by crop/edit/cleanup when quality permits;
3. grounded art-directed visualization based on verified reality;
4. authentic service/sector-relevant photography;
5. high-quality generated image for an ILLUSTRATIVE role;
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

If a generated visual is illustrative, ensure the surrounding copy and placement do not imply it documents a verified company-specific fact.

## Phase E — pre-lock image quality gate

Topical relevance is not sufficient. Before any prominent candidate image receives a locked asset identity, inspect the **actual candidate in its intended role and crop** and require:

**`IMAGE_QUALITY_GATE = PASS`**

Evaluate all six dimensions:

### 1. Immediate clarity

Within approximately two seconds, can a normal visitor understand what the image depicts and why it belongs on this page?

FAIL when the subject, activity or technical scene is materially ambiguous, visually confusing or requires explanation before it becomes meaningful.

### 2. Desired perception

What does the image communicate emotionally and commercially before the visitor reads the copy?

It must reinforce the intended perception — for example professionalism, workmanship, cleanliness, reliability, expertise, care or quality — rather than an accidental negative signal.

A defect, worn component or damaged object may be shown when diagnosis, repair or a before-state is explicitly the message. It must not become the unintended dominant brand impression.

### 3. Business and message relevance

The exact image must materially support the proposition, section purpose or customer decision. Sector similarity alone is insufficient.

“Something related to plumbing”, “something electrical” or another generic category match is not an adequate selection rationale.

### 4. Credibility and physical plausibility

The depicted situation must make sense. Check where applicable:

- tools and materials;
- connections and equipment;
- human anatomy and posture;
- scale and spatial relationships;
- construction/installation logic;
- working environment.

Reject impossible, uncanny or technically incoherent imagery even when visually attractive. Preserve the generated-visual truth boundary above.

### 5. Composition fit

Judge the image in the intended page composition, not only as a standalone picture. Check focal point, subject placement, negative space, crop, direction of action/gaze, relation to adjacent copy, rendered visual weight and desktop/mobile treatment.

A good photograph that performs poorly in the actual role is not a passing asset.

### 6. Visual craft

The image must meet the quality level of the intended redesign. Check lighting, clarity, tonal quality, photographic coherence, distracting artifacts, visual noise, cheap/generic stock character and consistency with the page's photographic language.

### Hard decision rule

A material failure on **any** dimension is `IMAGE_QUALITY_GATE = FAIL`.

Do not average away a serious weakness with strengths elsewhere and do not create a numeric image-quality score. A failed candidate is not locked. Select, edit or generate another candidate and repeat the gate.

If no candidate meets the required quality level, prefer a strong no-image composition over knowingly using weak imagery. This is an exception for a failed role, not a default reaction to limited verified photography; first consider whether a truthful ILLUSTRATIVE asset can solve the role.

The selection question is not merely:

> Is this image related to the sector?

It is:

> Does this exact image, in this exact role and crop, make the business clearer, more credible and more desirable without misleading the visitor?

## Phase F — lock the asset set

Only assets with `IMAGE_QUALITY_GATE = PASS` may be locked for prominent image roles.

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
- role class: EVIDENCE or ILLUSTRATIVE;
- aspect ratio;
- focal point;
- desktop crop/object-position;
- mobile crop/object-position.

Do not generate different imagery later merely because implementation starts.

## `ASSET_READY` hard gate

Set `ASSET_READY = PASS` only when all are true:

- final logo decision is KEEP / REFINE / REDESIGN and `LOGO_FINAL_01` exists;
- every prominent image role has a final exact asset;
- every prominent image has `IMAGE_QUALITY_GATE = PASS`;
- every prominent image is explicitly classified EVIDENCE or ILLUSTRATIVE;
- EVIDENCE roles use verified real material and are not replaced by generated documentary-looking proof;
- ILLUSTRATIVE imagery is present where it materially improves comprehension or premium visual quality, rather than being omitted merely because verified company photography is limited;
- no dominant image knowingly relies on inadequate resolution, accidental crop, amateur source treatment, material ambiguity or unintended negative brand perception;
- the set looks like one art-directed family rather than mismatched fragments;
- desktop/mobile crop intent is known;
- generated visuals remain grounded and non-misleading.

If any condition fails, remain in this workflow and resolve it. **Do not start Workflow 03.**

If adequate source imagery does not exist and required generation/editing capability is unavailable, that is a genuine blocker. State it precisely rather than producing knowingly weak HTML.

## Decision rules

1. Every major visual must serve comprehension, trust, action, premium perception or genuine brand recognition.
2. Real company imagery is preferred for trust/evidence; generated imagery is valid for illustration/polish when it does not impersonate evidence.
3. Do not add generic statistics, testimonials, badges or logo strips without verified content and a commercial reason.
4. Use customer language rather than database labels, audit terminology or internal jargon.
5. Do not force the same layout on businesses with materially different buying behavior.
6. Preserve identity; improve execution.
7. Prefer bespoke coherent art direction over collage-like reuse of mismatched source fragments.
8. Keep the asset set as small as the design actually needs, but do not confuse minimalism with visual under-resolution.
9. Do not expose exploratory weak variants to the operator merely because they were generated.

## Output/handoff

Handoff to Workflow 03 only with:

- design thesis;
- page/section order;
- hero proposition + CTA strategy;
- trust/content strategy;
- visual direction;
- `LOGO_FINAL_01` decision + exact asset;
- final image-role manifest with exact locked assets/crops and EVIDENCE/ILLUSTRATIVE classification;
- `IMAGE_QUALITY_GATE = PASS` for every prominent image;
- mobile-specific decisions;
- `ASSET_READY = PASS`.

The handoff is an implementation contract, not a speculative design-system document.
