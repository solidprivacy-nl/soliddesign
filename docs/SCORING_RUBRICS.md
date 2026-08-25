# Qualification and Scoring Rubrics v0

The score is intentionally simple and explainable. No machine learning and no arbitrary weighted model until real outcome data exists.

## Discovery versus qualification

The canonical discovery source is Overture Maps Places.

Critical semantic separation:

```text
Overture presence
≠
existing demand
```

Overture `confidence` indicates confidence that a place exists. `operating_status` helps with place activity/state. Neither is a commercial-demand score.

## Hard gates

A prospect must pass all relevant gates before ranking:

- existing website exists;
- website/business identity appears to match;
- business appears active;
- customer economics plausibly support the offer;
- sufficient independent evidence of existing demand;
- website has meaningful improvement opportunity;
- standard/acceptable delivery fit;
- practical/legal targeting acceptable;
- no obvious suppression/do-not-contact reason.

A failed hard gate can produce `DISQUALIFIED` without a numerical score.

## Five factors

Each factor scores 0–5. Initial total is unweighted, maximum 25.

### 1. Customer Economics

| Score | Rubric |
|---|---|
| 0 | Very low customer value or budget fit absent |
| 1 | Low economic value |
| 2 | Limited but possible |
| 3 | Sufficient for standard product |
| 4 | Clear high value per won customer |
| 5 | Very high value plus strong ability-to-pay signal |

### 2. Existing Demand

This factor must be evidenced separately from Overture discovery.

Possible evidence:

- commercial-intent category/sector;
- observed Google/local/search visibility from human research;
- review/reputation volume relative to local peers where lawfully observed;
- review recency/business activity;
- established operating history if known;
- active portfolio/cases/projects;
- other sector-specific demand signals.

| Score | Rubric |
|---|---|
| 0 | No credible demand evidence |
| 1 | Very weak evidence of active market demand |
| 2 | Some evidence, clearly below relevant local peers |
| 3 | Credible normal-market demand |
| 4 | Multiple above-average demand/activity signals |
| 5 | Strong, corroborated evidence of active commercial demand |

Prefer relative local/sector comparison over universal thresholds.

#### Evidence that does not suffice alone

Do not score Existing Demand highly solely because:

- Overture contains the business;
- Overture confidence is high;
- `operating_status` is open;
- a website exists;
- the website looks professional.

For Phase 1, manual demand research is acceptable. Do not build automated Google scraping.

### 3. Conversion Opportunity

Based on audit evidence, not visual taste alone.

| Score | Rubric |
|---|---|
| 0 | Site already strong; little clear improvement |
| 1 | Mostly cosmetic issues |
| 2 | Some concrete friction |
| 3 | Multiple meaningful UX/trust/CTA issues |
| 4 | Strong evidence of conversion leakage |
| 5 | Large mismatch between business quality and website experience |

### 4. Execution Fit

| Score | Rubric |
|---|---|
| 5 | Standard pages/forms; direct fit |
| 4 | Small deviations |
| 3 | Limited custom work |
| 2 | Significant custom/stack complexity |
| 1 | Difficult integration-rich delivery |
| 0 | Outside service model |

### 5. Competitive Context

| Score | Rubric |
|---|---|
| 0 | Competitors offer little stronger digital alternative |
| 1 | Weak difference |
| 2 | Limited difference |
| 3 | Several competitors clearly stronger |
| 4 | Large local digital gap |
| 5 | Prospect visibly loses credibility/conversion potential to direct peers |

## Discovery quality metadata

Keep source metadata separate from score factors:

```yaml
discovery_source: overture
discovery_version: 2026-07-22.0
source_confidence: 0.87
operating_status: open
```

These fields help audit source quality over time but are not automatically converted into scoring points.

## Score record

Every factor must store:

```yaml
factor:
score:
evidence:
reviewer:
timestamp:
```

Never store only the number. A score without evidence cannot later improve the model.

## Future calibration

After 100+ prospects, compare factors against:

- demo visits;
- responses;
- meetings;
- proposals;
- wins;
- delivery hours;
- gross margin.

Also compare source/release metadata against invalid/stale rates.

Only then consider weights, source-specific adjustments or predictive modeling.
