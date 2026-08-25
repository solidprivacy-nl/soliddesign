# Donor Lock — Phase 1

These revisions were directly inspected when defining SolidDesign adapters/patterns. Updating them is deliberate.

| Donor | Frozen reviewed commit | Use |
|---|---|---|
| `Dukotah/leadgen` | `36784ad5125ac51e61741a478d0c7e3877e69d16` | bounded Overture/DuckDB discovery pattern |
| `NezbiT/pitch-doctor` | `ab5858c5ba620fccde1fa2fd35e2c2ca86d37a42` | existing-site audit via CLI/JSON adapter |
| `buildingopen/openpage` | `9818eb43a88e01b23cb55752e19902d8285a853b` | SiteConfig compatibility + optional visual editor |
| `nextlevelbuilder/ui-ux-pro-max-skill` | `e353a508767c6d39f0e7698b084dbfc8699fffd3` | design-intelligence patterns only; no runtime import |
| `TheMattBerman/landing-page-factory` | `e65fbf28662ae85aa7384d13441f0537ea08a9aa` | authority/service routing, proof/copy discipline ideas only |
| `pbakaus/impeccable` | `fcd7622cd2d8e2b09344ba8ede9fcac82cec4e70` | deterministic design QA; CLI pinned at `3.6.0` |
| `JackInSightsV2/Automated-Agentic-AI-Web-Agency` | `56a02463316527542f01ba5ca405445319b43204` | comparator / optional Google reference only |

## Data/dependency pins

- `duckdb==1.5.5`
- `impeccable==3.6.0` via `npx` in CI only; not an application runtime dependency.
- Overture data release defaults to official STAC `latest`; commercial batches should explicitly record or pin the release.

## Rules

- Do not auto-update donor SHAs during commercial validation.
- Keep donor code/patterns behind SolidDesign interfaces.
- Re-run tests after every donor/dependency update.
- Re-check LICENSE and dependencies before upgrading.
- Overture schema changes require review of discovery tests/docs.
- Do not vendor UI/UX Pro Max, Landing Page Factory, Taste Skill, Loupe or Open Design into the application runtime.
- Do not import JackInSights' Claude orchestration runtime; the reviewed revision invokes Claude Code with `--dangerously-skip-permissions`.
- `DesignProfile` must remain a small deterministic contract, not an agent framework or template catalog.
