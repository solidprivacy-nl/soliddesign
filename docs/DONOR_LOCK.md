# Donor Lock — Phase 1

These revisions were directly inspected when defining SolidDesign adapters. Updating them is a deliberate change.

| Donor | Frozen reviewed commit | Use |
|---|---|---|
| `NezbiT/pitch-doctor` | `ab5858c5ba620fccde1fa2fd35e2c2ca86d37a42` | existing-site audit via CLI/JSON adapter |
| `buildingopen/openpage` | `9818eb43a88e01b23cb55752e19902d8285a853b` | SiteConfig compatibility + optional visual editor |
| `JackInSightsV2/Automated-Agentic-AI-Web-Agency` | `56a02463316527542f01ba5ca405445319b43204` | bounded Google Places discovery pattern only |

## Rules

- Do not auto-update donor SHAs during commercial validation.
- Keep donor code behind SolidDesign adapters.
- Re-run tests after every donor update.
- Re-check LICENSE and dependencies before upgrading.
- Do not import JackInSights' Claude orchestration runtime; the reviewed revision invokes Claude Code with `--dangerously-skip-permissions`.
