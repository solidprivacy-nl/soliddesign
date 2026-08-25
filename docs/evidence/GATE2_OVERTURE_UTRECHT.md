# Gate 2 Evidence — Overture Utrecht

**Date:** 2026-08-25  
**Status:** Gate 2 end-to-end live single-prospect integration proven.

This evidence note records aggregate, reproducible results from the first real Dutch Gate-2 run. Raw prospect datasets, customer/prospect files and the operational opaque preview URL are deliberately **not** committed to this public repository.

## Objective

Test whether the Phase-1 composed pipeline can find enough real Dutch local-service prospects without Google Places and move one selected prospect through:

```text
OVERTURE
→ candidate universe
→ human selection
→ live website audit
→ human-reviewed root causes
→ five-factor qualification
→ verified facts
→ concept preview
→ print pack
→ public noindex preview
→ disable/restore lifecycle
→ operational state
```

## Overture run

Canonical source:

- source: Overture Maps Places;
- release observed: `2026-08-19.0`;
- no API key;
- no Google Cloud billing;
- DuckDB query against Overture cloud GeoParquet.

Refined Utrecht-area bounding box:

```text
west  = 5.00
south = 52.03
east  = 5.21
north = 52.16
```

Category filters:

```text
home_service
building_or_construction_service
technical_service
hardware_home_and_garden_store
```

Results with an existing website:

| Metric | Result |
|---|---:|
| Records returned | 996 |
| Unique website domains | 930 |
| Domains occurring more than once | 39 |
| Records with locality Utrecht | 740 |
| Installation-related keyword candidates | 83 |

The result is sufficient for Phase-1 prospect discovery. The business does not need a complete Dutch business registry; it needs a sufficiently large, useful candidate universe at negligible source cost.

## Important discovery defect found

The first diagnostic query used a broad category universe with `LIMIT 500`. Because the underlying result order was not designed to be geographically representative, that sample was heavily skewed toward nearby municipalities such as IJsselstein, Nieuwegein and Houten.

This was **not** evidence of poor Dutch Overture coverage. It was an execution/query-design problem.

Correction:

1. tighten the target bounding box;
2. filter to the relevant service categories before limiting;
3. measure the candidate universe after filtering;
4. never interpret an arbitrary first-N unfiltered sample as geographic market coverage.

This correction produced 740 website-bearing Utrecht records inside the refined service universe.

## First real prospect audit

One Utrecht electrical-services prospect was selected from the live Overture result after separate public evidence showed ongoing business activity and market interaction.

The raw Pitch Doctor audit completed successfully and returned:

```text
score = 0
level = F
```

The root technical cause was clear:

- the website could not be reliably reached during the live scan;
- the SSL/TLS certificate had expired.

The raw donor audit also emitted many downstream critical checks. Because the page failed before normal loading, most of those findings cannot safely be treated as independent verified deficiencies.

### Presentation rule learned

```text
RAW DONOR AUDIT
→ preserve as evidence
→ identify blocking root cause
→ suppress/collapse cascading unknowns for prospect-facing output
→ human-reviewed AuditResult
```

For this case the prospect-facing audit retained only:

1. website reachability failure;
2. expired HTTPS certificate;
3. independently evidenced mismatch between active market presence and an unreliable owned website destination.

This prevents inflated sales claims and preserves the verified-facts principle.

## Qualification

Human-reviewed five-factor score:

| Factor | Score | Reason |
|---|---:|---|
| Customer Economics | 3/5 | Electrical installation/repair has plausible order value; direct ability-to-pay not yet proven |
| Existing Demand | 4/5 | Independent public evidence showed established activity and meaningful customer review signal |
| Conversion Opportunity | 5/5 | Owned website was not reliably reachable because of expired TLS |
| Execution Fit | 5/5 | Standard local-service site/contact flow; no complex portal identified |
| Competitive Context | 2/5 | Many local alternatives exist, but digital superiority of direct peers was not deeply benchmarked |
| **Total** | **19/25** | Eligible for proof production |

No weighting was introduced.

## Proof assembly

The selected prospect successfully moved through:

```text
reviewed Prospect
+ reviewed AuditResult
+ score
→ VerifiedFacts
→ ConversionBrief
→ OpenPage-compatible SiteConfig
→ static noindex preview
→ print pack + QR
```

Safety checks passed:

- preview contains `noindex`;
- no form;
- no testimonials;
- no unapproved review/rating claim in the concept;
- no unapproved years-active claim in the concept;
- approved marketing claims remain empty;
- qualification is reproducible at 19/25.

## Print-pack improvement learned

When a live audit cannot produce a screenshot because the site itself is unreachable, the print pack should not display a generic “screenshot missing” placeholder.

Canonical behavior instead shows the verified live-audit state:

> Website niet bereikbaar tijdens live audit

with the reviewed business impact. This is both more accurate and more useful commercially.

## Cloudflare static preview — proven

The Gate-2 proof was published through one shared Cloudflare Pages project using Direct Upload. No custom domain, Worker, queue or additional hosting layer was added.

The prospect route uses an opaque path beneath the shared preview project. The actual URL is operational state and is intentionally not stored in this public repository.

Verified deployment properties:

```text
provider                    = Cloudflare Pages
shared project              = yes
opaque prospect path        = yes
browser HTTP status         = 200
HTML noindex                = yes
form                         = none
testimonials                 = none
```

### HTTP verification lesson

The first machine check used Python `urllib`'s default user-agent and received HTTP `403`, despite a successful Cloudflare deployment.

A diagnostic run then tested both the stable Pages hostname and the atomic deployment hostname using a normal browser user-agent. Both returned HTTP `200` and the expected concept content.

Therefore the first `403` was a verifier artifact, not proof that the public preview was inaccessible.

Canonical rule:

```text
DEPLOYMENT SUCCESS
→ verify with browser-representative request
→ distinguish hosting failure from machine-client blocking
```

## Disable/restore lifecycle — proven

The same opaque preview path was deliberately replaced by a neutral page stating that the concept was unavailable.

Verification succeeded:

```text
live proof
→ deploy neutral unavailable page
→ browser verifies unavailable state
→ redeploy original proof
→ browser verifies concept restored
```

This proves that a prospect preview can be operationally disabled without deleting the shared Pages project or introducing one project per prospect.

## Supabase operational state

The dedicated SolidDesign Supabase project now contains the selected prospect's:

- prospect record;
- reviewed audit;
- 19/25 qualification;
- demo configuration;
- live preview URL;
- `LIVE` demo status;
- `preview_published` event;
- one synthetic `preview_visit` verification event.

The synthetic visit metadata explicitly records:

```text
synthetic     = true
fingerprinting = false
http_status   = 200
```

No browser fingerprint, IP address, user-agent fingerprint, cookie identifier or other visitor identity was persisted.

## Gate-2 conclusion

The following chain is now empirically proven with one real Dutch prospect:

```text
OVERTURE DISCOVERY
→ SEPARATE DEMAND EVIDENCE
→ LIVE AUDIT
→ HUMAN ROOT-CAUSE REVIEW
→ 5-FACTOR QUALIFICATION
→ VERIFIED FACTS
→ CONVERSION BRIEF
→ CONCEPT + PRINT PACK
→ CLOUDFLARE NOINDEX PREVIEW
→ DISABLE / RESTORE
→ SUPABASE OPERATIONAL STATE
```

**Gate 2 = PASS.**

## Decision

Overture remains **GO** as the canonical Phase-1 discovery source.

The live Utrecht evidence supports:

```text
OVERTURE PRIMARY
→ bounded market/category query
→ human quality control
→ live audit
→ qualification
→ proof
```

No Google Places key is required for this stage.

Cloudflare Pages remains the Phase-1 static preview provider. One shared project is sufficient; do not create one project per prospect.

## Do not infer yet

This run does **not** prove:

- Overture has complete Dutch business coverage;
- the 83 keyword candidates are all qualified prospects;
- the scoring model predicts sales;
- the concept improves response rate;
- the €2,950 offer will close;
- the live demo adds enough value to justify its production cost;
- one-prospect operational success implies 5-, 30- or 100-prospect economics.

Those remain later evidence gates.
