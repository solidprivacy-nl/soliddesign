# Implementation Plan — Composed MVP

## Goal

Prove one real Dutch prospect can move through the complete internal pre-sale pipeline without importing a large platform or requiring a paid discovery API.

## Offline vertical slice — complete

```text
fixture Prospect
→ qualification
→ normalized audit
→ verified facts
→ conversion brief
→ OpenPage-compatible SiteConfig
→ deterministic HTML preview
→ print-pack HTML
```

## Live integration order

```text
Overture Places bounded discovery
→ one selected real prospect
→ Pitch Doctor live audit
→ human score
→ assemble proof
→ Supabase state
→ Cloudflare static publishing
```

Each integration is proven independently.

## Repository modules

```text
src/soliddesign/
├── models.py
├── states.py
├── qualification.py
├── verified_facts.py
├── brief.py
├── discovery/
│   ├── overture.py          # canonical Phase-1 source
│   └── google_places.py     # optional future fallback/enrichment
├── audit/
│   └── adapter.py
├── demo/
│   └── openpage.py
├── print_pack/
│   └── renderer.py
└── cli.py
```

## Discovery implementation

Canonical implementation:

```text
explicit west,south,east,north
+
current Overture taxonomy label(s)
+
DuckDB
→
Overture cloud GeoParquet
→
Prospect[]
```

Requirements:

- official STAC latest-release lookup or explicit release pin;
- no arbitrary storage path input;
- current `basic_category` / `taxonomy` fields;
- existing website required;
- `permanently_closed` excluded;
- source/release/confidence/status recorded;
- no Google key required.

See `DISCOVERY_OVERTURE.md`.

## Definition of done — offline component spike

- `soliddesign golden` succeeds without network credentials;
- deterministic fixture produces a score and decision;
- VerifiedFacts contains only approved structured facts;
- demo config validates;
- preview contains `noindex` and concept banner;
- print pack generated;
- tests cover scoring/trust/preview/print pack;
- CI green.

## Definition of done — Overture live discovery

- one bounded Dutch market query succeeds;
- Overture release recorded;
- source uses new taxonomy fields;
- sample data quality manually measured;
- one candidate with matching/reachable website reaches audit;
- no Google Cloud project, billing or key required.

## Definition of done — live proof

- Pitch Doctor adapter audits one real URL;
- human qualification stores evidence;
- Supabase state reflects source provenance;
- static preview deploys only at final provider-specific step;
- preview can be deleted/disabled.

## Deferred

- geocoder;
- OSM fallback;
- Google enrichment;
- queues;
- dashboards;
- agents;
- production builder.

Only measured failure or operator friction may promote them.
