# Discovery Economics — Overture Primary

## Phase-1 decision

Overture Maps Places is the canonical discovery source.

The goal is to eliminate provider billing/account complexity from **candidate enumeration** while measuring whether data quality remains commercially sufficient.

## Direct source cost

For the canonical path:

```text
Overture API key         none
Google Cloud project     none
Google Places key        none
per-request Overture fee none
```

Overture publishes its data openly on cloud object storage and documents it as freely available.

This does not mean every environment is universally costless. Compute, internet/network, storage and human cleanup can still have costs.

## What must be measured

Per market/batch:

```text
source release
bbox
taxonomy filters
query runtime
raw records
records with website
valid records after manual sample
stale/incorrect records
duplicates
audit-eligible records
qualified records
human cleanup minutes
effective cost per qualified prospect
```

## Important economic distinction

```text
€0 source fee
does not imply
€0 acquisition cost
```

If Overture requires materially more manual cleanup than another source, that time belongs in Cost To Pursue.

## Google Places status

Google Places is optional enrichment/fallback, not the primary source.

It may later be tested for:

- rating;
- review count;
- specific coverage gaps.

Do not enrich the entire raw universe by default.

Only adopt a paid source when measured incremental value exceeds:

```text
API cost
+
integration maintenance
+
credentials/billing complexity
+
operator burden
```

## Cost optimization order

1. keep Overture bbox narrow enough for the actual market;
2. use taxonomy filters;
3. discard website-less/closed places early;
4. audit only plausible candidates;
5. manually enrich only shortlisted prospects;
6. add a new provider only after a measured gap.

## Sources

- https://docs.overturemaps.org/getting-data/
- https://docs.overturemaps.org/getting-data/cloud-sources/
- https://docs.overturemaps.org/guides/places/
