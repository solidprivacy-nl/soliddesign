# Discovery triage

Status: canonical v0.2

## Decision

Discovery must not hand the operator a raw list of businesses with only `DISCOVERED · not scored`.

Every newly discovered website receives a cheap, deterministic intake assessment before human selection. This assessment is deliberately narrower than the full 0–25 commercial qualification.

```text
OVERTURE / URL INTAKE
        ↓
WEBSITE PREFLIGHT
        ↓
LIGHT DETERMINISTIC TRIAGE
        ↓
DISCOVERY INBOX
        ↓
HUMAN SELECT
   ├─ Naar prospects → QUALIFIED workflow state
   └─ Diskwalificeer → DISQUALIFIED
        ↓
DEEPER AUDIT / EVIDENCE QUALIFICATION ONLY FOR SELECTED PROSPECTS
```

## Why

First principle: the Discovery-inbox exists to support a decision.

A raw candidate list transfers all filtering cost to the human operator. Running the full commercial qualification for every search result is the opposite error: it spends expensive research on companies that may be rejected in seconds.

The smallest useful middle layer is therefore automatic triage based on signals already available from the website preflight.

## What triage may score

Triage only scores factors for which the website response supplies direct evidence.

### Conversion opportunity — 0–5

A lightweight deterministic check looks for basic on-page conversion hygiene such as:

- viewport metadata;
- meta description;
- an H1;
- explicit CTA language;
- a direct phone, email, form or external booking path.

More missing basics means a higher preliminary conversion-opportunity score.

This is not a visual audit and does not claim to measure the complete quality of the website.

### Execution fit — 0–5

The preflight looks for obvious complexity markers:

- commerce/cart/checkout;
- portal/login/application behaviour;
- external booking integrations.

A normal brochure/service site is a strong standard-delivery fit. Commerce or portal signals lower the preliminary fit score.

## What triage must NOT score

The following remain unknown at this stage unless independently evidenced:

- Customer Economics;
- Existing Demand;
- Competitive Context.

Do not convert absence of evidence into zero points and do not let AI invent these scores.

The full 0–25 qualification remains evidence-gated and is performed only when deeper ranking/research is useful.

## Verdict

The data model uses a deliberately coarse decision aid:

- `STRONG` — meaningful conversion opportunity and acceptable execution fit;
- `POSSIBLE` — insufficient rendered evidence or moderate opportunity;
- `WEAK` — little visible opportunity, poor execution fit or a failed website hard gate;
- `UNASSESSED` — the automatic preflight itself was unavailable.

A human may still promote any `DISCOVERED` candidate with a completed triage record. Triage advises; it does not replace human selection.

## Discovery-inbox information hierarchy

The inbox is a decision surface, not a database table. The strongest visual signal must therefore answer: **what should the operator look at first?**

The UI groups existing records without introducing a new state or score:

```text
AANBEVOLEN
  STRONG

BEOORDELEN
  POSSIBLE / UNASSESSED / assessment pending

LAGE PRIORITEIT
  WEAK

GEDISKWALIFICEERD
  state = DISQUALIFIED
```

These group labels are presentation only. They are derived from the existing `state` and `qualification.triage.verdict` fields and are never persisted as a second workflow state.

Within each group candidates are sorted by:

1. Conversion Opportunity descending;
2. Execution Fit descending;
3. company name.

There is deliberately no combined `x/10` triage score. `Opportunity 5/5 + Fit 2/5` has a different business meaning from `Opportunity 2/5 + Fit 5/5`, even though both would sum to 7.

### Visual priority inside a candidate row

The row hierarchy is:

1. company name and location;
2. verdict badge (`STERK`, `MOGELIJK`, `ZWAK`, `GEDISKWALIFICEERD`);
3. color-coded `Opportunity`, `Fit` and `Gates` chips;
4. discovery source/state as quiet metadata;
5. actions.

Color is supplementary and never the only signal: every colored chip also contains a text label and numerical or PASS/FAIL value.

Score-chip treatment is intentionally coarse:

- 4–5 → positive/green;
- 2–3 → attention/amber;
- 0–1 → weak/red;
- unknown → neutral/gray.

This is presentation logic only; it does not change score semantics.

### Action hierarchy

The primary inbox question is whether a candidate merits deeper work. Therefore:

```text
DISCOVERED
[ Naar prospects ] [ Website ] [ ••• ]
                            └─ Diskwalificeer
                            └─ Verwijder

DISQUALIFIED
[ Heropen ] [ Website ] [ ••• ]
                       └─ Verwijder
```

`Verwijder` must never visually compete with the primary selection action. Destructive/administrative actions stay secondary.

Repeated explanatory text about Customer Economics, Existing Demand and Competitive Context is not shown on every row. That rule belongs in the page-level workflow/documentation; only exceptional `UNASSESSED` evidence is shown inline.

## State semantics

`DISCOVERED` means found and still in the Discovery-inbox.

`QUALIFIED` at the workflow-state level means the operator has deliberately accepted the candidate into the active Prospects workflow after seeing the triage evidence. It does **not** imply that all five 0–5 factor scores have already been populated.

The JSON qualification record preserves the distinction through `stage`:

```text
stage = triage
stage = triage_selected
```

A later full evidence-backed score can replace/extend that record without changing the discovery architecture.

## Runtime

No new service is introduced.

- `operator/functions/api/site-check.js`
  - keeps the existing SSRF-safe bounded website fetch;
  - derives deterministic triage signals from the same bounded HTML response;
  - returns no raw HTML to the browser.
- `operator/discovery-triage.js`
  - automatically evaluates Discovery candidates that do not yet have triage data;
  - limits concurrent website checks to four;
  - presents existing triage data as decision groups and score chips;
  - keeps `Naar prospects` as the dominant action;
  - does not create a new ranking or persistence model.
- Supabase
  - `prospects.qualification` remains the single qualification/triage JSON record;
  - the existing narrow authenticated RPCs update triage and promote a selected candidate;
  - no candidate table, scoring table or queue is added.

## Failure behaviour

- unreachable website → may be objectively `DISQUALIFIED`;
- JavaScript-heavy page with insufficient server HTML → `POSSIBLE` with Opportunity unknown;
- triage service failure → `UNASSESSED`, never an invented score;
- full commercial factors without evidence → remain unknown.

## Governing rules

1. **solid but simple** — use the preflight already required for intake and derive presentation from existing state;
2. **no overengineering** — no queue, headless-browser farm, agent, scoring service, extra candidate model or second ranking model;
3. **first principles** — optimize the inbox for the human decision it exists to support;
4. **do not reinvent the wheel** — apply standard information-hierarchy, progressive-disclosure and status-grouping UI patterns; keep the existing Pitch Doctor adapter for the deeper audit rather than recreating a full audit engine in the Operator.

## Relationship to the full audit

The deep audit remains the existing Pitch Doctor-backed SolidDesign `AuditResult` boundary. Discovery triage is intentionally not a replacement for it.

```text
triage = cheap selection evidence
full audit = detailed prospect evidence
```
