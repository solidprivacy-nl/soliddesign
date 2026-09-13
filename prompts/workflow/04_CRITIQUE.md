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
Check whether every prominent image is professionally usable for its role:

- adequate effective resolution at rendered size;
- intentional crop and focal point;
- coherent photographic/illustrative style;
- no enlarged thumbnails;
- no screenshot-like recycled fragments;
- no visibly amateur source photography in dominant roles when grounded replacement is possible;
- no generic filler stock where a prospect-specific or grounded asset is justified;
- no generated image that creates false documentary evidence;
- no image that appears chosen after layout merely because it fit the box.

### 9. Mobile
Check the same commercial story on a small screen: hierarchy, readability, navigation, tap targets, logo treatment, image crop/focal point and CTA visibility.

### 10. AI-slop check
Reject generic patterns that could belong to almost any company: ornamental gradients, repetitive cards, fabricated numbers, empty slogans, decorative dark panels, generic stock-person imagery or unnecessary UI complexity.

### 11. Truth check
No unverified claim may become customer-facing fact. Generated visual context may not be described as verified company-specific proof unless it actually is.

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
- a logo approximation different from the locked final logo.

### Asset-readiness regression

REVISE if the rendered site proves that `ASSET_READY` should never have passed, for example because the hero photography, logo, or major service imagery is still visibly under-resolved.

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
6. no obvious overlap, clipping, filler, fake proof, process-copy leakage or AI-template pattern;
7. imagery looks deliberately selected/art-directed rather than mechanically reused;
8. the improvement is material enough to justify showing the source and candidate side by side to the prospect.

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

Do not make the operator discover that photography, logo treatment or layout is weak through multiple chat rounds. Failed intermediate candidates remain internal unless the user explicitly asks to inspect alternatives.

## Final delivery gate

Deliver only when:

- `ASSET_READY = PASS` still holds in the actual render;
- critique = `PASS`;
- final HTML uses the exact locked visual assets;
- preview is rendered from that exact HTML;
- desktop and mobile are reasonably verified;
- no known material visual defect is left for the operator to point out.
