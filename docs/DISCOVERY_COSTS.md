# Discovery Economics

**Status:** current discovery-cost contract  
**Canonical discovery workflow:** `docs/DISCOVERY.md`

## Objective

Measure which supported discovery input produces useful qualified prospects with the least total operator and provider cost.

SolidDesign currently has exactly three intake paths:

```text
RESEARCH IMPORT | OVERTURE AREA SEARCH | SPECIFIC URL
                       ↓
                same candidate ingest
                       ↓
                 Discovery Inbox
```

Discovery source is provenance, not workflow identity or architectural authority.

## Cost model

Compare the complete cost of a useful prospect, not only API price:

```text
provider/source cost
+ compute/data transfer
+ research time
+ invalid-record cleanup
+ human review minutes
+ maintenance/credential burden
= effective discovery cost
```

A free source can be economically worse when it creates materially more cleanup. A paid source is not justified merely because it has richer data.

## Research import

Research currently uses the operator's ChatGPT workflow and the canonical CSV transport contract.

Measure:

- research minutes;
- candidates returned;
- valid owned websites;
- evidence quality;
- promoted prospects;
- eventual commercial outcomes.

Do not treat research rank or PDOS-style evidence as outcome truth before real acquisition results support it.

## Overture area search

Current direct source cost for the bounded Overture path is effectively zero:

```text
Overture API key         none
Google Cloud project     none
Google Places key        none
per-request Overture fee none
```

Actual cost still includes browser/query time, data transfer, invalid/stale records and operator review.

Measure per batch:

```text
source release
bbox
taxonomy filters
query runtime
raw records
records with website
valid records
stale/incorrect records
duplicates
promoted prospects
human review minutes
effective cost per promoted prospect
```

## Specific URL

For a known business, direct URL intake avoids enumeration cost. Its value is speed and explicit operator intent, not broad market recall.

## Provider rule

There is no active Google Places discovery adapter and no generalized provider fallback layer.

Add a new paid/enrichment provider only after a measured current-path gap and only when incremental value exceeds:

```text
provider cost
+ integration maintenance
+ credentials/billing complexity
+ operator burden
```

If a later provider is earned, it must feed the existing normalized candidate boundary and Discovery Inbox rather than creating a parallel workflow.

## Optimization order

1. choose the intake path that matches the actual task;
2. keep research scope or Overture geography bounded;
3. discard invalid/website-less candidates early;
4. review only plausible candidates;
5. preserve source provenance and human minutes;
6. compare downstream promotion and commercial outcomes;
7. add a provider only after a measured gap.

## Economic principle

> Optimize for qualified prospect yield per unit of human effort and cost, not for source volume or technical sophistication.
