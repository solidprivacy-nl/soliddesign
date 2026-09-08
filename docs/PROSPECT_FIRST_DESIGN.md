# Prospect-first Design

**Status:** canonical target/current contract after cutover  
**Date:** 2026-09-09  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Business goal

Make the Prospect → Design workflow understandable to a new operator without exposing discovery taxonomy or reusable market-research machinery that does not help them complete the design task.

The operator goal is simple:

```text
copy design assignment
→ work in ChatGPT
→ upload result
→ inspect version
→ publish the right version
```

Design must be based on the actual prospect, not on a generalized sector model.

## Architectural decision

Sector has a bounded role in SolidDesign:

```text
DISCOVERY
sector + location
→ research / Overture resolution
→ candidate

DESIGN
prospect-specific evidence only
```

Sector/category metadata may remain in discovery and on the prospect record as provenance or concise descriptive context. It does not activate design research, templates, presets or lookup behavior.

### Hard design boundary

Nothing below the Design boundary may perform a canonical-sector lookup.

Design context is:

```text
current user/operator instruction
+ SolidDesign design method
+ Prospect Design Brief / verified facts
+ source website / source assets / screenshots
+ current LIVE / current concept
+ other relevant evidence
```

## Why Sector Intelligence is retired

The retired Sector Intelligence subsystem required:

- a top-level CMS workspace;
- research/paste/review/publish workflow;
- prospect-sector linking;
- a server-side GitHub content façade;
- published sector Markdown;
- Design Brief lookup metadata;
- Design Bootstrap lookup logic;
- a second sector-specific improvement prompt;
- dedicated tests, CI and deploy smoke paths.

Its authority was already advisory and missing research never blocked design. Prospect-specific facts and the generic design method outranked it. The maintenance and operator cost therefore exceeded its demonstrated business value.

The simpler solution is to design from direct prospect evidence. Repeated lessons should be promoted into the generic design method only when real cases prove they are broadly useful.

## What remains sector-aware

### Bedrijven zoeken

Sector remains a normal operator input for:

- `Gericht zoeken`;
- `Breed zoeken`.

The existing resolver remains responsible for mapping human market language to a valid Overture category when Overture search requires it.

### Data/provenance

`canonical_sector_key` may remain on existing records and continue to be written by discovery where a validated key naturally exists.

It is not operator-facing design state.

A direct-URL prospect may have no canonical sector key and must still complete the full design workflow normally.

### Prospect category label

A concise category above the prospect name may remain as orientation metadata. It is not customer-facing copy and does not determine design behavior.

## Retired capabilities

The cutover removes active use of:

- `Sectoronderzoek` navigation/workspace;
- Sector Intelligence research/review/publication;
- explicit prospect-sector linking;
- `Sector voor design` selector;
- `Kopieer verbeteropdracht met sectorinzichten`;
- Sector Intelligence in the Prospect Design Brief;
- canonical-sector lookup in the Design Bootstrap;
- conditional `prompts/sectors/` overlay loading;
- Sector Intelligence API/UI code;
- sector-linking RPCs.

Historical database migrations remain immutable history. A retirement migration drops only the now-unused runtime RPCs.

## Design tab UX contract

### Purpose

The Design tab answers three questions:

1. How do I start/continue design work?
2. Where do I upload and publish website versions?
3. Where do I maintain printmailing design artifacts?

It does not teach the operator the internal prompt or brief architecture.

### Websiteontwerp

Primary visible controls:

```text
Websiteontwerp

Designinstructie (optioneel)
[ ... ]

[ Kopieer designopdracht ]

Open ChatGPT-project ↗   # only when configured

▸ Projectinstellingen
```

`Kopieer designopdracht` is the one primary ChatGPT action. It:

1. saves the current prospect-specific design instruction;
2. generates the current Prospect Design Brief;
3. copies the stable start URL + current Design Brief URL.

The operator does not need to manually manage a design-brief URL.

### Projectinstellingen

Advanced/occasional controls stay behind progressive disclosure:

- ChatGPT project URL;
- explicit save;
- open current Design Brief for troubleshooting/inspection.

If no ChatGPT project exists, no disabled `Geen ChatGPT-project gekoppeld` control is shown in the primary workflow.

### Ontwerpversies

Canonical lifecycle remains:

```text
upload HTML/ZIP
→ CONCEPT
→ inspect
→ publish LIVE
```

The upload path is primary. External concept links remain a secondary escape hatch behind progressive disclosure.

There is no second design-status system.

### Printmailing

Responsibility boundary remains:

```text
DESIGN
→ create/version printmailing artifact

OUTREACH
→ select exact artifact
→ record physical send
```

Artifact creation therefore remains on Design; sending remains on Outreach.

## Prospect Design Brief v0.4

The brief contains only material prospect-specific design context:

1. Design objective
2. Prospect profile
3. Verified prospect facts
4. Verification gaps
5. Current website evidence
6. Current design state
7. Operator direction
8. Hard constraints

It does not contain:

- canonical sector key;
- Sector Intelligence URL/content;
- reusable sector guidance;
- raw qualification state;
- implementation internals.

## Design Bootstrap v0.4

The Bootstrap loads only the generic SolidDesign design method and the prospect-specific brief/evidence.

It does not load:

- Sector Intelligence;
- `prompts/sectors/`;
- category design presets.

Governing design rule:

> Design the actual prospect, not an abstract sector.

## Prompt Library boundary

This cutover does not migrate the dossier Design workflow into the operator Prompt Library.

The two capabilities solve different problems:

- Prompt Library: reusable operator prompt invocation;
- Design Bootstrap + Prospect Design Brief: system-governed prospect-specific design handoff.

Keeping the proven two-URL design handoff avoids unnecessary coupling and scope expansion.

## Database rule

Do not drop `canonical_sector_key` merely to make the schema look cleaner. It remains legitimate discovery/provenance data and removing it would create migration risk without improving the operator workflow.

Do drop runtime capabilities that have no caller after cutover:

```text
operator_list_sector_link_targets()
operator_set_prospect_sector(uuid,text)
```

## Open-work cleanup

Sector Intelligence content PRs that only exist to publish retired research are closed without merge.

Any older design/provider PR whose UX contract depends on Sector Intelligence or `Sector voor design` is superseded rather than merged through a large rebase. Future private-repository/provider-boundary work starts from current `main` and the current prospect-first contract.

## Acceptance invariants

After cutover:

1. Discovery still accepts sector input.
2. Overture sector resolution still works.
3. Direct URL intake works without sector classification.
4. A prospect with no canonical sector key can use Design normally.
5. Design has one primary ChatGPT action: `Kopieer designopdracht`.
6. Generated Design Brief contains no Sector Intelligence or canonical sector lookup identity.
7. Design Bootstrap performs no sector lookup.
8. Website concept upload/LIVE publication still works.
9. Printmailing versioning still works on Design.
10. Outreach still records the exact sent printmailing version.
11. No active runtime request targets `/api/sector-intelligence`.
12. No current documentation presents Sector Intelligence as a live capability.
13. Obsolete sector UI/API/RPC/tests/deploy paths are removed rather than deprecated in parallel.

## Definition of Done

Done means:

```text
business workflow simplified
+ implementation complete
+ discovery regression-proven
+ design regression-proven
+ stale runtime removed
+ conflicting tests removed
+ current docs aligned
+ obsolete open work closed/superseded
+ production behavior verified
```

The repository represents one current truth. Git history preserves the retired architecture.
