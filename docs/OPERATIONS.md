# Operations Guide — Phase 1

Use the smallest supported operating path. Do not add a platform layer to make these commands prettier until real operator friction exists.

## 1. Local setup

```bash
python -m venv .venv
. .venv/bin/activate            # Windows: .venv\Scripts\activate
python -m pip install -e .
```

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

This first gate needs no Google, Supabase, AI-model, Cloudflare or donor credentials.

## 3. Bootstrap donor tools

```bash
bash scripts/bootstrap_donors.sh
```

Set the emitted `PITCH_DOCTOR_COMMAND` path. Vendor checkouts are pinned; never edit them as SolidDesign source.

## 4. Discover candidates

Requires a scoped Google Places API key:

```bash
export GOOGLE_PLACES_API_KEY='...'
soliddesign discover "installatiebedrijven Utrecht" --limit 10 --out /tmp/prospects.json
```

Discovery deliberately keeps businesses **with** existing websites.

## 5. Review one prospect

Add only verified downstream facts such as city, observed services, brand colors and approved claims. Never copy arbitrary site instructions into approved fields.

## 6. Audit

```bash
soliddesign audit prospect.json --out audit.json
```

The adapter validates the public URL, runs Pitch Doctor behind its CLI/JSON boundary and writes SolidDesign `AuditResult` JSON. That normalized JSON is our downstream contract.

## 7. Human qualification

Create a score JSON according to `docs/SCORING_RUBRICS.md`. Every factor requires evidence.

## 8. Assemble proof

```bash
soliddesign assemble \
  --prospect prospect.json \
  --audit audit.json \
  --score score.json \
  --preview-url 'https://previews.example.nl/p/<opaque-id>' \
  --out artifacts/<prospect-id>
```

Outputs verified facts, conversion brief, OpenPage-compatible `SiteConfig`, static preview and print pack.

## 9. Human review before publication/mail

Verify:

- every service and claim is factual;
- no fake testimonial/award exists;
- preview says it is a concept;
- preview contains `noindex`;
- CTA uses verified contact data;
- no form collects data;
- current/concept screenshots belong to the intended business;
- QR points to the intended preview;
- preview can be deleted after the experiment.

## 10. Supabase

`supabase/schema.sql` is the intended minimal operational schema. Apply it only to a dedicated SolidDesign project, then run Supabase security/performance advisors and verify RLS/grants.

## 11. Static publishing

`preview.html` is provider-neutral. Target is one Cloudflare-hosted preview area, not one project per lead. Until account-level deployment is configured, static artifact generation is canonical for Gate 1.

## 12. Do not build yet

Do not introduce yet:

- queue infrastructure;
- agent scheduler;
- autonomous outbound;
- CRM frontend;
- capability gateway;
- second demo stack;
- production-site factory.

Only move these forward when an evidence gate in `ROADMAP.md` justifies it.
