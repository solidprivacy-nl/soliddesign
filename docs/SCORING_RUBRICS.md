# Qualification and Scoring Rubrics v0

The score is intentionally simple and explainable. No machine learning and no arbitrary weighted model until real outcome data exists.

## Hard gates

A prospect must pass all relevant gates before ranking:

- existing website exists;
- business appears active;
- customer economics plausibly support the offer;
- sufficient evidence of existing demand;
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

Evidence may include:

- Google/local visibility;
- review volume relative to local peers;
- review recency/business activity;
- commercial-intent category;
- reputation/ratings.

| Score | Rubric |
|---|---|
| 0 | No credible demand evidence |
| 1 | Very weak presence |
| 2 | Clearly below relevant local peers |
| 3 | Roughly local market average |
| 4 | Above-average visibility/activity |
| 5 | Strong visible market interaction and active demand evidence |

Prefer relative local comparison over universal review-count thresholds.

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

## Score record

Every score must store:

```yaml
factor:
score:
evidence:
reviewer:
timestamp:
```

Never store only the number. A score without evidence cannot later train or improve the model.

## Future calibration

After 100+ prospects, compare factors against:

- demo visits;
- responses;
- meetings;
- proposals;
- wins;
- delivery hours;
- gross margin.

Only then consider weights or predictive modeling.
