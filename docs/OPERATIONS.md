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
├── design_profile.json
├── preview.html
├── print_pack.html
├── technical_report.md
└── technical_report.html
```

The golden gate is offline and needs no Overture network, Supabase, AI-model, Cloudflare or donor credentials.

## 3. Bootstrap audit/demo donor tools

```bash
bash scripts/bootstrap_donors.sh
```

Set the emitted `PITCH_DOCTOR_COMMAND` path. Vendor checkouts are pinned and ignored; never edit them as SolidDesign source.

## 4. Select one market and sector

The underlying discovery contract remains an explicit Overture bounding box:

```text
west,south,east,north
```

For CLI/reproducible batches, choose and record the bbox deliberately.

For manual Operator runs, the CMS accepts one Dutch location string and performs one cached Nominatim lookup to obtain that bbox. This is a convenience adapter only: no autocomplete, bulk geocoding, background geocoding or general geocoder platform.

Sector values should be Overture `basic_category` or taxonomy labels. Review the current Overture taxonomy when uncertain. The Operator contains only a few obvious Dutch aliases such as `elektricien → electrician`; unknown terms are normalized rather than guessed into a custom taxonomy.

## 5. Discover candidates — canonical Overture path

### CLI / reproducible batch

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

By default the official Overture STAC catalog supplies the latest release. Pin commercial experiments with `--release` or `OVERTURE_RELEASE` and record the release used.

### Operator / manual bounded run

The Operator's **Discovery** page accepts:

```text
location + keyword(s) + max results
```

It resolves the location to one bbox, then runs the same bounded Overture Places GeoParquet logic in DuckDB-Wasm in the operator's browser. Supabase stores only run metadata and resulting candidate records; there is no queue, scheduler or second discovery service.

A second intake box accepts one explicit website URL. That path performs only a guarded reachability/preflight check and domain dedupe. It does not replace Pitch Doctor or the full qualification rubric.

## 6. Discovery inbox and output review

Discovery is intentionally separated from the active prospect work queue while remaining one canonical `prospects` table.

```text
AREA / URL intake
      ↓
DISCOVERED / DISQUALIFIED
      ↓
Discovery inbox
      ↓ evidence-backed qualification
QUALIFIED and later states
      ↓
Active prospects
```

For the first market samples, review:

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

`DISCOVERED` is not `QUALIFIED`. Overture presence, website presence and reachability are insufficient evidence for commercial qualification.

Cross-source duplicates are prevented on normalized website hostname because SolidDesign's commercial object is the website to improve. If multiple discovery runs find the same domain, keep one prospect record.

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

The adapter validates the public URL, runs Pitch Doctor behind its CLI/JSON boundary and writes two evidence layers:

```text
raw_audit.json   = donor JSON preserved before normalization
audit.json       = SolidDesign normalized/reviewable contract
```

`raw_audit.json` is written next to `audit.json` by default. Use `--raw-out <path>` only when a different location is necessary.

The normalized `audit.json` remains the downstream contract.

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
- website presence;
- successful URL preflight.

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

If `raw_audit.json` exists next to `audit.json`, it is included automatically in the technical report. An explicit `--raw-audit <path>` may override that location.

Outputs:

```text
pipeline.json
site_config.json
design_profile.json
preview.html
print_pack.html
technical_report.md
technical_report.html
```

The report intentionally separates reviewed findings from raw donor traceability.

## 11. Human review before publication/mail

Verify:

- business identity matches;
- website belongs to the intended prospect;
- every service/claim is factual;
- no fake testimonial/award exists;
- raw donor errors are not presented as independent facts when they are cascading;
- technical report uses reviewed findings as the primary discussion layer;
- preview says it is a concept;
- preview contains `noindex`;
- CTA uses verified contact data;
- no form collects data;
- screenshots/audit-state panels belong to the intended business;
- QR points to the intended preview;
- preview can be deleted.

## 12. Supabase and Operator state

A dedicated SolidDesign project exists. `supabase/schema.sql` is the canonical current schema; `supabase/migrations/` records production upgrades.

The Operator uses Supabase Auth + allowlist + RLS/narrow security-definer RPCs. No privileged key is exposed to browser code.

Active/archive is not a lifecycle-state fork:

```text
archived_at IS NULL     = active
archived_at IS NOT NULL = archived
```

Archive preserves the original prospect state and history. Hard delete is an administrative correction path only and is blocked when demo or mailing history exists.

`discovery_runs` is deliberately small: input, run status, counts, result metadata, timestamps and error. It is not a job engine.

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
- general geocoder service or autocomplete;
- queue infrastructure;
- agent scheduler;
- autonomous outbound;
- general CRM frontend;
- capability gateway;
- second demo stack;
- production-site factory.

Only move these forward when an evidence gate in `ROADMAP.md` justifies it.
