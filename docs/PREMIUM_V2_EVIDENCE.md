# Premium v2 visual acceptance evidence

Date: 2026-08-25
PR: #11 — Premium v2: fix concept quality before outreach
Branch: `design/premium-v2`

## Purpose

Record the bounded human visual acceptance performed before promoting premium v2. This is evidence for the release decision, not a new runtime subsystem.

Ground rule:

> Solid but simple. No overengineering.

## Comparison set

The review reused the same five frozen Gate-3 prospect/audit/score inputs:

- Koppen Electro Techniek
- E-Install Elektrotechniek
- Energiek Installaties
- Jansen Installatiebedrijf
- AKTA

Only the customer-facing brief/design/rendering layer changed.

## Acceptance method

Each prospect was rebuilt from the frozen Gate-3 evidence, scanned with pinned `impeccable@3.6.0`, and rendered at:

- desktop: 1440 × 1000
- mobile: 390 × 844

The human five-second gate asked:

1. Is the concept immediately more attractive/professional than the prior concept?
2. Does it feel credible for the business category?
3. Is the customer proposition understandable above the fold?
4. Is the primary CTA obvious?
5. Is it free of visible overlap, clipping, ugly word breaks, fake proof, placeholder copy and obvious AI/template slop?

Deterministic QA PASS does not by itself equal visual acceptance PASS.

## Iteration 1 — rejected by human review

Review workflow run: `32902936736`
Artifact: `9583786973`

All five concepts rebuilt successfully and all five Impeccable scans were clean. The human visual review still rejected the result because long technical service names could break unattractively and some service labels still read like raw database values.

No gate was weakened. The renderer/copy layer was corrected instead.

## Iteration 2 — accepted

Accepted renderer/test commit: `756cb4ae1c82130883aaa4431facc6a4a37c221b`
Review workflow run: `32903455968`
Artifact: `9583958595`
Artifact digest: `sha256:c3c30098a4cb08ee40af1d06374531e0d89c6b5de164defa7f19927f841b5761`

Results:

- 5/5 frozen prospects rebuilt successfully;
- 5/5 Impeccable scans returned clean;
- 10/10 screenshots produced successfully;
- desktop and mobile human visual review passed the five-second gate.

Observed improvements versus the rejected result:

- no hero overlap or clipping;
- no decorative empty dark hero panel;
- shorter, human-readable customer headlines;
- no automatic ugly hyphenation of technical service names;
- service labels displayed as customer-facing text rather than raw lowercase/database copy;
- proof shown only when actually verified;
- clear primary CTA on desktop and mobile;
- restrained photo-free editorial composition when verified company imagery is unavailable.

## Permanent design decision

Premium v2 remains deliberately narrow:

```text
VerifiedFacts + ConversionBrief
        ↓
small deterministic DesignProfile
        ↓
one authority-service composition
        ↓
static renderer
        ↓
strict deterministic QA
        ↓
human visual acceptance before outreach
```

No new agent, autonomous critique loop, template catalogue, design database, Figma integration, image generator, queue, daemon or second builder was introduced.

## Release interpretation

Premium v2 is visually accepted for the five-prospect Gate-3 cohort.

This acceptance permits merging the renderer correction. It does **not** by itself authorize outreach: the deployed preview and print-pack/QR artifacts still have to be regenerated from the merged version and their live noindex/no-form safety invariants rechecked before Gate 4 is released.
