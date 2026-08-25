# Operations Guide — Phase 1

Use the smallest supported operating path. Do not add a platform layer to make these commands prettier until real operator friction exists.

## 1. Local setup

```bash
python -m venv .venv
. .venv/bin/activate            # Windows: .venv\Scripts\activate
python -m pip install -e .
```

Core dependencies include DuckDB for bounded Overture GeoParquet queries.

No Google Cloud project or Google Places key is required for canonical discovery.

## 2. Golden component spike

```bash
soliddesign golden --out artifacts/golden
```

Expected:

```text
artifacts/golden/
├── pipeline.json
├── site_config.json
├── preview.html
└── print_pack.html
```

The golden gate is offline and needs no Overture network, Supabase, AI-model, Cloudflare or donor credentials.

## 3. Bootstrap audit/demo donor tools

```bash
bash scripts/bootstrap_donors.sh
```

Set the emitted `PITCH_DOCTOR_COMMAND` path. Vendor checkouts are pinned and ignored; never edit them as SolidDesign source.

## 4. Select one market and sector

Phase 1 uses an explicit Overture bounding box:

```text
west,south,east,north
```

Do not build a geocoder to avoid choosing four coordinates.

Use Overture Explorer or a bounding-box tool to define the market deliberately and store the bbox with the experiment notes.

Sector values should be Overture `basic_category` or taxonomy labels. Review the current Overture taxonomy when uncertain.

## 5. Discover candidates — canonical free path

Example syntax:

```bash
soliddesign discover \
  --bbox "4.90,52.00,5.20,52.20" \
  --category electrician \
  --limit 50 \
  --out /tmp/prospects.json
```

The coordinates above demonstrate syntax only.

Multiple sector labels are OR-matched:

```bash
soliddesign discover \
  --bbox "<west>,<south>,<east>,<north>" \
  --category electrician \
  --category plumber \
  --limit 100 \
  --out /tmp/prospects.json
```

Optional business-name filtering:

```bash
--name "<substring>"
```

### Reproducible batch

By default the official Overture STAC catalog supplies the latest release.

To pin a commercial experiment:

```bash
soliddesign discover \
  --bbox "<west>,<south>,<east>,<north>" \
  --category electrician \
  --release 2026-07-22.0
```

or:

```bash
export OVERTURE_RELEASE=2026-07-22.0
```

Always record the release used.

## 6. Discovery output review

For the first market sample, manually record:

```text
raw records
website present
website reachable
correct sector
correct geography
apparently active
duplicate
stale/incorrect
audit eligible
human cleanup minutes
```

Overture `source_confidence` is confidence that the place exists. It is not a demand/reputation score.

Do not fill `rating` or `review_count` with invented proxies. They remain `null` unless separately and lawfully enriched.

Do not judge market coverage from an arbitrary first-N unfiltered Overture sample. Apply the intended geography and sector filters before interpreting `LIMIT` results.

## 7. Review one prospect

Add only verified downstream facts such as:

- observed services;
- brand colors;
- approved claims.

Never copy arbitrary site instructions into approved fields.

Verify that the Overture website actually belongs to the business before the audit becomes authoritative.

## 8. Audit

```bash
soliddesign audit prospect.json --out audit.json
```

The adapter validates the public URL, runs Pitch Doctor behind its CLI/JSON boundary and writes SolidDesign `AuditResult` JSON.

That normalized JSON is the downstream contract.

### Preserve raw evidence; present root causes

The donor report is evidence, not automatically prospect-facing copy.

If a blocking finding such as `reachability` proves that the page never loaded, downstream checks may be cascading unknowns rather than independent verified defects. In that situation:

```text
RAW AUDIT
→ preserve unchanged
→ identify blocking root cause
→ remove/collapse cascading failed-load findings from prospect-facing output
→ human-reviewed AuditResult
```

Never turn one root failure into a long list of sales claims merely because the donor emitted multiple checks.

The frozen Pitch Doctor revision supports `en`, `es`, `fr` and `zh`, but not Dutch. Dutch prospect-facing audit text therefore belongs in the human-reviewed presentation layer; do not mutate the raw donor evidence.

If no screenshot exists because the website was unreachable, the print pack should show the verified live-audit state rather than inventing or implying a missing screenshot.

## 9. Human qualification

Create a score JSON according to `docs/SCORING_RUBRICS.md`.

Every factor requires evidence.

### Existing Demand

Do not use these as sufficient demand evidence:

- Overture presence;
- Overture confidence;
- website presence.

Demand requires separate market evidence.

For the first five prospects, manual web/Google review may be used as human research. Do not automate Google scraping.

## 10. Assemble proof

```bash
soliddesign assemble \
  --prospect prospect.json \
  --audit audit.json \
  --score score.json \
  --preview-url 'https://previews.example.nl/p/<opaque-id>' \
  --out artifacts/<prospect-id>
```

Outputs VerifiedFacts, conversion brief, OpenPage-compatible SiteConfig, static preview and print pack.

## 11. Human review before publication/mail

Verify:

- business identity matches;
- website belongs to the intended prospect;
- every service/claim is factual;
- no fake testimonial/award exists;
- raw donor errors are not presented as independent facts when they are cascading;
- preview says it is a concept;
- preview contains `noindex`;
- CTA uses verified contact data;
- no form collects data;
- screenshots/audit-state panels belong to the intended business;
- QR points to the intended preview;
- preview can be deleted.

## 12. Supabase

A dedicated SolidDesign project exists.

`supabase/schema.sql` is canonical.

Phase 1 remains server-only:

- RLS enabled;
- no `anon`/`authenticated` table grants;
- privileged key never exposed to preview/client code.

## 13. Static publishing

`preview.html` is provider-neutral.

Target: one Cloudflare-hosted preview area, not one project per prospect.

## 14. When Overture is insufficient

Do not immediately add Google.

First document the failure:

```text
too few records?
wrong sector?
too many stale records?
missing websites?
missing demand signals?
```

Then choose the smallest remedy.

Fallback order:

```text
Overture
→ bounded OSM/Overpass if needed
→ targeted commercial enrichment if economics justify it
```

## 15. Do not build yet

Do not introduce:

- national Overture mirror;
- geocoder service;
- queue infrastructure;
- agent scheduler;
- autonomous outbound;
- CRM frontend;
- capability gateway;
- second demo stack;
- production-site factory.

Only move these forward when an evidence gate in `ROADMAP.md` justifies it.
