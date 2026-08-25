# Gate 2 Evidence — Overture Utrecht

**Date:** 2026-08-25  
**Status:** live discovery + first real audit + proof assembly proven; public preview still blocked on Cloudflare account credentials.

This evidence note records aggregate, reproducible results from the first real Dutch Gate-2 run. Raw prospect datasets and customer/prospect files are deliberately **not** committed to this public repository.

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

Canonical behavior should instead show the verified live-audit state:

> Website niet bereikbaar tijdens live audit

with the reviewed business impact. This is both more accurate and more useful commercially.

## Cloudflare gate

A safe GitHub Actions capability probe checked only whether deployment credentials were present. It exposed no secret values.

Result:

```text
CLOUDFLARE_API_TOKEN  = missing
CLOUDFLARE_ACCOUNT_ID = missing
```

No installable/connected Cloudflare plugin was available in the current ChatGPT environment either.

Therefore the remaining Gate-2 external blocker is not architecture or code. A Cloudflare account deployment authorization/token must be supplied through a secure secret channel before the proof can be published.

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

## Do not infer yet

This run does **not** prove:

- Overture has complete Dutch business coverage;
- the 83 keyword candidates are all qualified prospects;
- the scoring model predicts sales;
- the concept improves response rate;
- the €2,950 offer will close;
- the live demo adds enough value to justify its production cost.

Those remain later evidence gates.
