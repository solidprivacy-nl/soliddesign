# Gate 3 — Five-Prospect Premium Proof

Date: 2026-08-25

## Decision

**Gate 3 technical pipeline: PASS.**

Five independently qualified prospects were assembled through the same premium-v1 path, passed deterministic design/safety QA, rendered on desktop and mobile, deployed as one static Cloudflare Pages tree, and verified live.

This does **not** prove commercial conversion. It proves that the current SolidDesign pre-sale pipeline can repeatedly produce safe, usable premium concept pages for qualified real businesses without adding more architecture.

## Design principle

Hard rule for this gate:

> Solid but simple. No overengineering.

No agent, queue, orchestration layer, second builder, visual editor, template catalogue, design database, autonomous outbound system or new long-running service was added.

The Gate-3 execution workflow used for evidence collection was temporary and is removed after this run.

## Selection method

The starting pool contained eight Overture-discovered businesses in the Utrecht area. Frozen Pitch Doctor was used as one evidence source, but raw donor score was explicitly **not** treated as the commercial decision.

Human review checked:

1. business identity and activity;
2. independent demand evidence;
3. audit root causes versus cascading/false-positive findings;
4. conversion opportunity on the live website;
5. fit with the standard SolidDesign delivery model.

A low audit score alone was insufficient.

## Initial audit pool

| Candidate | Pitch Doctor | Human disposition |
|---|---:|---|
| Koppen Electro Techniek | 28 / F | Qualified |
| E-Install Elektrotechniek | 46 / F | Qualified |
| Van Zoelen Loodgieters Dakdekkers | 62 / D | Negative control: current site already relatively conversion-mature |
| Van Santen Vloerverwarming | 26 / F | Excluded: HTTP 403 polluted audit reliability |
| Smit Installatietechniek BV | 43 / F | Negative control: live site materially stronger than raw donor score suggests |
| Gerssen Elektrotechniek | 37 / F | Negative control: current site already relatively mature |
| Energiek Installaties | 19 / F | Qualified |
| Jansen Installatiebedrijf | 28 / F | Qualified |

Because only four of the initial eight cleanly qualified after human review, one reserve was taken from the same Overture candidate universe instead of forcing a fifth false positive.

Reserve:

- Akta Elektra — Overture place `72a0c9df-ad67-4143-b275-2fb7b3acfcfe`
- Pitch Doctor: 33 / F
- Human disposition: Qualified

## Final selected five

| Prospect | Qualification | Main observed opportunity |
|---|---:|---|
| Koppen Electro Techniek | 24 / 25 | HTTPS, mobile contact friction, weak primary CTA, no conversion measurement |
| E-Install Elektrotechniek | 21 / 25 | Commercial homepage is recruitment-first rather than customer-first; slow first visible content; heavy frontend |
| Energiek Installaties | 23 / 25 | HTTPS, mobile contact friction, weak information architecture, no conversion measurement |
| Jansen Installatiebedrijf | 21 / 25 | HTTPS/protocol fragility, weak primary CTA, no conversion measurement |
| Akta Elektra | 23 / 25 | HTTPS, wasted mobile hero space, stale WordPress default content, no conversion measurement |

All five passed the hard qualification gates. Existing Demand was evidenced separately from Overture presence and separately from Pitch Doctor findings.

## Premium-v1 proof run

Canonical proof run:

- GitHub Actions run: `32899879541`
- head: `4cec1d335e6bcd54e9ee9047e77f24615fbb63f9`
- conclusion: `SUCCESS`
- artifact: `gate3-five-prospect-premium-proof`
- artifact id: `9582667669`
- artifact digest: `sha256:930fda81bd45f0d0094eb04995ad5e159e70eafa8ed777db5ef29d91eb6c418e`

Every proof step passed:

- materialize human-reviewed inputs;
- assemble five premium concepts;
- `noindex,nofollow,noarchive` safety invariant;
- no real lead-capture form;
- no decorative gradients;
- Impeccable design scan: zero findings for every concept;
- desktop screenshots;
- mobile screenshots;
- one static Cloudflare Pages deployment tree;
- browser-representative HTTP verification for every preview path;
- final evidence artifact upload.

## Build results

| Prospect | Score | Build seconds | Opaque preview path |
|---|---:|---:|---|
| Koppen | 24 | 0.170 | `/p/72f6b4bca32f321c/` |
| E-Install | 21 | 0.098 | `/p/080419b3c06658c5/` |
| Energiek | 23 | 0.100 | `/p/38180d61ef2c3dc8/` |
| Jansen | 21 | 0.098 | `/p/8f5761c8e0724dc9/` |
| Akta | 23 | 0.098 | `/p/5c2c5e88ab829e07/` |

Total concept assembly time: **0.564 seconds**.

The CI job took longer because it installed browser/tooling dependencies. That bootstrap time is not representative of concept-generation time. Human qualification and evidence review remain the meaningful labour component and were not artificially reduced to a fabricated time estimate.

## Live preview tree

One non-production Pages branch was used:

`https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev`

Verified concept URLs:

- `https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev/p/72f6b4bca32f321c/`
- `https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev/p/080419b3c06658c5/`
- `https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev/p/38180d61ef2c3dc8/`
- `https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev/p/8f5761c8e0724dc9/`
- `https://gate3-v1.soliddesign-previews-solidprivacy.pages.dev/p/5c2c5e88ab829e07/`

These are concept previews, not official customer websites.

## Visual review

Premium-v1 remained materially stronger than the original generic concept renderer:

- clearer typographic hierarchy;
- calmer spacing and editorial rhythm;
- prominent direct CTA;
- credible service/trust structure;
- strong mobile composition;
- no gradient/glow/card-grid AI aesthetic;
- zero deterministic Impeccable findings.

### Repeated friction discovered

The five concepts are visually **too homogeneous when compared side by side**.

They use the same authority-service composition, right-side dark service panel, proof band, editorial service list and contrast CTA. That is acceptable for this Gate because each prospect sees only its own concept, and no evidence yet shows that cross-prospect visual variation improves response rate.

Therefore this is recorded as a measured design limitation, **not** as justification for a new framework or template system.

If later commercial evidence shows the limitation matters, the smallest acceptable extension is one additional deterministic composition variant driven by verified business context, for example:

- local-service / phone-first; versus
- B2B authority / project-first.

Do not build a template catalogue before outcome data requires it.

## Negative-control lesson

Gate 3 demonstrated an important selection property:

```text
low audit score
!=
qualified sales prospect
```

Van Zoelen, Gerssen and Smit were not forced into the final five because human review showed their current digital experience was materially stronger than the raw audit score implied. Van Santen was excluded because HTTP 403 made the audit unreliable.

This is a positive result: the qualification layer can reject donor false positives instead of simply ranking by audit score.

## Gate conclusion

### PASS

The current architecture is sufficient for a first commercial experiment.

What Gate 3 proves:

- Overture can supply candidate inventory;
- human qualification can reject false positives;
- one premium renderer can repeatedly build five concepts;
- deterministic design QA works across real cases;
- static preview deployment works with one existing Cloudflare project;
- no additional execution architecture is required before commercial testing.

What Gate 3 does not prove:

- direct-mail response rate;
- meeting rate;
- proposal rate;
- close rate;
- delivery hours after sale;
- gross margin;
- whether more visual variation would improve commercial response.

## Next decision

**Do not add architecture. Run the commercial pilot.**

The next evidence should come from the market:

```text
5 qualified prospects
→ physical direct mail / QR or personal URL
→ human follow-up
→ visit
→ response
→ meeting
→ proposal
→ win / loss
→ delivery hours and gross margin if won
```

Only measured friction from this commercial path may justify the next implementation change.
