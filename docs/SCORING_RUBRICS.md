# Qualification and Scoring Rubrics v0

The current commercial qualification remains intentionally simple and explainable. No machine learning and no replacement weighted model becomes canonical until real outcome data supports it.

## Discovery versus qualification

Canonical discovery architecture is defined in `docs/DISCOVERY.md`.

Current candidate sources are:

```text
research
Overture
manual URL
```

Source presence or research rank is not the same thing as commercial qualification.

Critical semantic separations include:

```text
Overture presence
≠
existing demand

research priority
≠
completed commercial qualification

workflow state QUALIFIED
≠
completed 0–25 factor score
```

Overture `confidence` indicates confidence that a place exists. `operating_status` helps with place activity/state. Neither is a commercial-demand score.

Research evidence may contribute useful facts/signals to later qualification, but only when the underlying observation actually supports the factor being scored.

## Hard gates

A prospect must pass all relevant gates before final commercial ranking:

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

Discovery triage may apply narrower technical/intake gates before full commercial qualification. Do not treat those cheap preflight checks as proof that all commercial gates have passed.

## Five factors

Each factor scores 0–5. Current total is unweighted, maximum 25.

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

This factor must be evidenced separately from discovery-source presence.

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
- research ranked the candidate highly;
- a website exists;
- the website looks professional.

Research may supply evidence of demand only where concrete public signals are actually observed and recorded.

### 3. Conversion Opportunity

Based on audit/research evidence, not visual taste alone.

| Score | Rubric |
|---|---|
| 0 | Site already strong; little clear improvement |
| 1 | Mostly cosmetic issues |
| 2 | Some concrete friction |
| 3 | Multiple meaningful UX/trust/CTA issues |
| 4 | Strong evidence of conversion leakage |
| 5 | Large mismatch between business quality and website experience |

A research triage observation may inform this later score, but the cheap deterministic Discovery check is not a substitute for deeper audit evidence.

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

## Discovery/research evidence namespaces

The operational JSON qualification record may contain several evidence layers without making them separate canonical scores:

```text
qualification.research
qualification.triage
qualification.factors / total_score
```

Writers must preserve unrelated namespaces.

- `research` = externally researched discovery evidence;
- `triage` = cheap deterministic site/intake evidence;
- full factors/total = current commercial qualification.

Missing full qualification is displayed as `Nog niet uitgevoerd`, not as a zero or an implied partial `/25` score.

## Discovery quality metadata

Keep source metadata separate from score factors.

Overture example:

```yaml
discovery_source: overture
discovery_version: 2026-08-19.0
source_confidence: 0.87
operating_status: open
```

Research example:

```yaml
discovery_source: research
discovery_version: 2026-09-08
qualification:
  research:
    decision: DEEP_AUDIT
    priority: VERY_HIGH
    confidence: MEDIUM
```

These fields support provenance/selection review. They are not automatically converted into commercial points.

## Score record

Every full factor must store evidence, not only a number.

Conceptually:

```yaml
factor:
score:
evidence:
reviewer:
timestamp:
```

A score without evidence cannot later improve the model.

## PDOS / richer research model

The Evidence-Weighted 2026 prospect research method introduces WES, RDS, CPF, Evidence Confidence and PDOS for deeper analysis.

That method is currently **experimental acquisition evidence**, not a replacement production qualification authority.

Do not:

- add permanent PDOS columns merely because the research model exists;
- map a shallow triage row to a fabricated PDOS;
- maintain two permanent competing canonical qualification systems.

When a full PDOS is genuinely measured, preserve its method/version/evidence so it can later be compared with real outcomes.

## Future calibration

After sufficient contacted prospects (initially evaluate at approximately 50–100 and continue as volume grows), compare:

- discovery source;
- research priority/signals;
- current five factors;
- full PDOS where valid;

against:

- demo/public-link visits;
- responses;
- positive responses;
- meetings;
- proposals;
- wins;
- delivery hours;
- gross margin/support burden.

Only when a material repeatable relationship exists should weights, thresholds or the canonical qualification model change.

When a replacement is adopted, migrate and remove superseded current scoring logic rather than normalizing indefinite parallel scoring models.
