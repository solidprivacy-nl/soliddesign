# Workflow 04 — Critique and Acceptance

## Goal

Judge the rendered candidate as a senior web designer, brand designer, UX specialist and MKB digital-strategy consultant before it is shown as finished work.

Never judge the candidate in isolation. Compare:

```text
SOURCE WEBSITE / CURRENT LIVE
→ CURRENT RENDERED CANDIDATE
```

The question is not merely “does it work?” but “is it materially better, coherent as one brand, credible for this business and safe to show as a professional before/after?”

## Review dimensions

### 1. Business fit
Does this look and communicate like the actual business, customer situation and price position?

### 2. Customer clarity
Can a visitor quickly understand the offer and whether it is relevant?

### 3. Trust
Is credibility supported by verified evidence and sensible presentation rather than invented proof or visual theatre?

### 4. Conversion
Is the primary next action obvious and appropriately timed?

### 5. Information hierarchy
Are proposition, services, proof and action prioritized in the right order?

### 6. Logo and brand coherence
Check that:

- the KEEP / REFINE / REDESIGN decision was justified;
- the exact `LOGO_FINAL_01` is used consistently;
- a refined/redesigned logo still preserves valuable recognition;
- logo scale, clear space and contrast work on desktop and mobile;
- the website visibly feels like one coherent identity rather than an unrelated template around a logo.

### 7. Visual craft
Check composition, spacing, typography, contrast, alignment, image treatment, overflow, clipping, awkward line breaks and visual balance.

### 8. Imagery and art direction

Use the governing rule:

> **Real for trust. Generated for polish. Never misleading.**

Check whether every prominent image is professionally usable for its role and still deserves its pre-lock PASS in the rendered page:

- its EVIDENCE / ILLUSTRATIVE classification still makes sense in context;
- EVIDENCE imagery is genuinely verified company-specific material rather than synthetic documentary theatre;
- ILLUSTRATIVE imagery clearly supports service comprehension, atmosphere, craft or premium perception without impersonating proof;
- immediately understandable without needing explanatory copy;
- reinforces the intended brand/service perception rather than an accidental negative signal;
- materially relevant to the proposition or section rather than merely sector-related;
- credible and physically plausible in tools, materials, anatomy, scale and technical relationships where applicable;
- adequate effective resolution at rendered size;
- intentional crop and focal point;
- coherent photographic/illustrative style;
- composition works with adjacent copy on desktop and mobile;
- no enlarged thumbnails;
- no screenshot-like recycled fragments;
- no visibly amateur source photography in dominant roles when grounded replacement is possible;
- no generic filler stock where a prospect-specific or grounded asset is justified;
- no generated image that creates false documentary evidence;
- no image that appears chosen after layout merely because it fit the box.

Also judge the balance of the full page, not only each image individually:

- authentic company imagery should carry identity and trust where useful source material exists;
- generated/illustrative imagery should provide enough visual richness when the proposition benefits from it;
- limited verified photography must not automatically result in a visually under-resolved or unnecessarily sparse page;
- generated imagery must not dominate so strongly that the business starts to feel fictional or generic.

There is no fixed image count. Judge whether the page has the right amount and type of imagery for this specific business and composition.

Temporarily ignore the copy and inspect the page through imagery alone. The visual story should remain clear, credible, sufficiently rich and consistent with the intended proposition.

### 9. Mobile
Check the same commercial story on a small screen: hierarchy, readability, navigation, tap targets, logo treatment, image crop/focal point and CTA visibility.

### 10. AI-slop check
Reject generic patterns that could belong to almost any company: ornamental gradients, repetitive cards, fabricated numbers, empty slogans, decorative dark panels, generic stock-person imagery or unnecessary UI complexity.

Specifically reject **decorative numbering** such as `01 / 02 / 03 / 04` when the numbers do not communicate a real sequence, ranking, date/year, quantity, verified metric or useful numbered reference. Numbering used only to make a short set of services/cards look designed is an AI/template giveaway and is `REVISE`.

Also challenge repetitive badges, chips, pseudo-dashboard elements and identical card patterns when they provide no semantic or interaction value.

### 11. Truth check
No unverified claim may become customer-facing fact. Generated visual context may not be described or visually framed as verified company-specific proof unless it actually is.

### 12. Customer-copy contamination check
The website may never expose the design process. REVISE if customer-facing copy contains audit language, redesign rationale, CMS/SolidDesign terminology or phrases such as:

- “the current/existing website”;
- “in this concept”;
- “we moved / we improved”;
- “this deserves more prominence”;
- internal qualification or design-review language.

## Hard release gates

### Asset integrity

REVISE immediately when any prominent visual contains:

- enlarged low-resolution source imagery;
- amateur or accidental crops;
- inconsistent photographic art direction;
- collage-like source fragments without a compositional reason;
- broken/missing assets;
- obviously weaker imagery than the role requires;
- generated imagery that materially misrepresents company-specific reality;
- an EVIDENCE role filled by generated documentary-looking material;
- a logo approximation different from the locked final logo.

### Visual-balance regression

REVISE when either extreme has occurred:

- **under-resolution:** useful imagery has been removed so aggressively that the page feels sparse, generic or less premium even though truthful ILLUSTRATIVE imagery could materially improve it; or
- **synthetic overreach:** generated imagery has become so prominent or documentary-looking that it weakens authenticity or suggests unverified company-specific reality.

The correct response to weak real source photography is not automatically “remove all imagery”. Return to Workflow 02 and resolve the missing polish role with truthful illustration/generation when that improves the design.

### Image-quality regression

REVISE when the actual render proves that a prominent image should not have passed the Pre-Lock Image Quality Gate, including when:

- the subject/activity is materially ambiguous in context;
- the final crop introduces confusion or hides the meaningful subject;
- deterioration, dirt, damage, emergency-repair character or another unintended signal dominates the desired brand perception;
- the image is merely sector-related but does not support the section's message or customer decision;
- a generated/stock scene is physically or technically implausible;
- the image is aesthetically acceptable in isolation but materially weakens the page composition.

A previous asset lock is not a reason to preserve a bad decision. Return internally to Workflow 02, unlock and replace/re-lock the affected asset, then rebuild and critique again.

### Asset-readiness regression

REVISE if the rendered site otherwise proves that `ASSET_READY` should never have passed, for example because the hero photography, logo, or major service imagery is still visibly under-resolved, the EVIDENCE/ILLUSTRATIVE distinction is violated or the asset set no longer reads as one coherent visual family.

Return internally to Workflow 02, fix/re-lock the affected visual assets, then rebuild and critique again.

### Material improvement

REVISE when the source/current → candidate comparison does not show a clear professional improvement. Being different is not enough.

Technical validity does not override these gates.

## Five-second visual gate

A concept passes only when all are true:

1. visibly more attractive/composed than the weak experience it replaces;
2. plausible and credible for the actual business;
3. proposition understandable above the fold;
4. primary CTA obvious without hunting;
5. logo, imagery and layout feel intentionally designed together;
6. no obvious overlap, clipping, filler, fake proof, process-copy leakage, decorative numbering or AI-template pattern;
7. imagery looks deliberately selected/art-directed rather than mechanically reused;
8. every prominent image remains immediately understandable and supports the desired perception in its final crop;
9. real company imagery provides authenticity where it matters and illustrative imagery provides sufficient polish where useful;
10. the improvement is material enough to justify showing the source and candidate side by side to the prospect.

A deterministic scanner pass does not override a human visual failure.

## Critique output and execution

Internally determine:

- `PASS` or `REVISE`;
- the 1–3 highest-value issues only;
- the smallest coherent changes that resolve them;
- whether correction belongs in visual assets (Workflow 02) or HTML/layout (Workflow 03).

If `REVISE`:

1. make the correction autonomously;
2. re-render desktop/mobile;
3. repeat this critique;
4. continue until `PASS` or a genuine blocker remains.

**Do not deliver a candidate marked `REVISE`.**

Do not make the operator discover that photography, logo treatment, visual richness or layout is weak through multiple chat rounds. Failed intermediate candidates remain internal unless the user explicitly asks to inspect alternatives.

## Final delivery gate

Deliver only when:

- every prominent image still deserves `IMAGE_QUALITY_GATE = PASS` in the actual render;
- every prominent visual still respects its EVIDENCE / ILLUSTRATIVE role;
- the page achieves a credible real-for-trust / generated-for-polish balance without either visual starvation or synthetic overreach;
- `ASSET_READY = PASS` still holds in the actual render;
- critique = `PASS`;
- final HTML uses the exact locked visual assets;
- preview is rendered from that exact HTML;
- desktop and mobile are reasonably verified;
- no known material visual defect is left for the operator to point out.
