# Donor Register

This register records external repositories considered or used by SolidDesign.

## Adoption rule

Use donor code only when semantic fit is high and total integration/change cost is lower than a thin implementation.

Classifications:

- `ADOPT` — use as a subsystem/runtime dependency;
- `ADAPT` — copy/use a bounded component with local interface;
- `IDEA` — patterns only, no code copying;
- `DEFER` — potentially useful later;
- `REJECT` — do not use.

## 1. NezbiT/pitch-doctor

Repository: https://github.com/NezbiT/pitch-doctor

License: MIT — verified in root `LICENSE`.

Role: **PRIMARY AUDIT DONOR**

Status: `ADAPT / INTEGRATE`

Relevant capability:

- existing-site audits;
- Playwright screenshots;
- contact friction;
- CTA/UX checks;
- SEO/accessibility/performance checks;
- Google Business Profile integration;
- business-language findings;
- HTML/PDF reporting patterns.

Boundary: normalize output into SolidDesign schemas; do not make donor internals our business-state model.

## 2. buildingopen/openpage

Repository: https://github.com/buildingopen/openpage

License: MIT — verified in root `LICENSE`.

Role: **PRE-SALE DEMO BUILDER CANDIDATE**

Status: `SPIKE / LIKELY ADOPT`

Relevant capability:

- typed JSON `SiteConfig` source of truth;
- visual editing;
- deterministic renderer;
- AI generation endpoint;
- standalone HTML export.

Boundary: use for pre-sale proof; do not assume it is the final production-customer stack.

## 3. JackInSightsV2/Automated-Agentic-AI-Web-Agency

Repository: https://github.com/JackInSightsV2/Automated-Agentic-AI-Web-Agency

License: MIT — verified in root `LICENSE`.

Role: **COMPONENT DONOR / FULL-CHASSIS COMPARATOR**

Status: `ADAPT SMALL / DO NOT FULL-ADOPT YET`

Potentially useful:

- Google Places Scout patterns;
- Supabase state/logging ideas;
- build/review/retry patterns;
- deployment patterns.

Mismatch:

- targets businesses without websites;
- UK-specific verification;
- autonomous email/call/SMS/WhatsApp/closing;
- broader agentic infrastructure than current MVP needs.

Security note: upstream orchestrator invokes Claude Code with `--dangerously-skip-permissions`; do not import that runtime without an explicit sandbox/security design.

## 4. Dukotah/leadgen

Repository: https://github.com/Dukotah/leadgen

License: MIT — verified in root `LICENSE`.

Role: **DISCOVERY DONOR LATER**

Status: `DEFER`

Potential:

- Overture/OpenStreetMap/open data;
- dedupe;
- multi-source discovery;
- vertical patterns.

Not required to validate the first offer.

## 5. GoogleChrome/lighthouse

Repository: https://github.com/GoogleChrome/lighthouse

License: Apache-2.0.

Role: technical performance benchmark.

Status: `DEFER`

Reason: avoid duplicating audit tooling until Pitch Doctor gaps are proven.

## 6. NicoSKOOL/astro-seo-website-builder

Repository: https://github.com/NicoSKOOL/astro-seo-website-builder

README states MIT, but root-license provenance must be independently confirmed before code copying.

Role: possible later production-builder idea donor.

Status: `IDEA / DEFER`.

## 7. Marcelluxx/lead-hunter-ai

Repository: https://github.com/Marcelluxx/lead-hunter-ai

License: proprietary according to repository documentation.

Role: security/audit pattern study only.

Status: `IDEA ONLY / NO CODE COPYING`.

Useful concepts:

- guarded crawling;
- SSRF protections;
- evidence records;
- explicit untrusted-content boundary.

## Provenance template

```yaml
source_repository:
source_commit_sha:
source_path:
license:
adoption_type:
local_path:
local_modifications:
reason:
security_review:
last_reviewed:
```
