# Prospect-first Design

**Status:** current production contract  
**Production cutover:** 2026-09-09  
**Website Opportunity extension:** v5.1 / 2026-09-13  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Business goal

Make the Prospect → Design workflow understandable to a new operator without exposing discovery taxonomy or reusable market-research machinery that does not help them complete the design task.

The operator goal is simple:

```text
review prospect-specific website opportunities
→ copy design assignment
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
+ human-reviewed Website Opportunity priorities + evidence
+ source website / source assets / screenshots
+ current LIVE / current concept
+ other relevant evidence
```

Website Opportunity does not weaken the prospect-first boundary: it is a review of this prospect's actual website, not reusable sector guidance.

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

## Website Opportunity boundary

Website Opportunity Review is a prospect-specific evidence interpretation step, not a second design method.

```text
audits.findings
= technical / diagnostic evidence

qualification.website_opportunity
= human-reviewed business priority + evidence + improvement direction
```

The current reviewed list is created through the Prompt Library/ChatGPT and one narrow validated import. It is then reused automatically by the Design Brief.

Design does **not** read an independently retyped opportunity list from `design_brief_note` and does not mutate the audit to make it more commercial.

Canonical detail: `docs/WEBSITE_OPPORTUNITY_REVIEW.md`.

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

Website Opportunity does not recreate any of those capabilities.

Historical database migrations remain immutable history. The production retirement migration removes only the now-unused runtime RPCs.

## Design tab UX contract

### Purpose

The Design tab answers three questions:

1. How do I start/continue design work?
2. Where do I upload and publish website versions?
3. Where do I maintain printmailing design artifacts?

It does not teach the operator the internal prompt or brief architecture.

The reviewed Website Opportunity itself is shown in the existing prospect Overview and is projected into the Design Brief automatically.

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
2. refreshes current qualification context, including the reviewed Website Opportunity;
3. generates the current Prospect Design Brief;
4. copies the stable start URL + current Design Brief URL.

The operator does not need to manually manage a design-brief URL or copy Website Opportunity findings into Designinstructie.

### Clean ChatGPT handoff

The copied two-URL handoff is self-contained for normal design execution.

```text
SolidDesign start URL
+ Prospect Design Brief URL
→ clean ChatGPT context
→ SolidDesign design method from the same supplied origin
→ prospect-specific work
```

The origin of the supplied start URL is `SOLIDDESIGN_ORIGIN`. Bootstrap resources are resolved from that same origin. This keeps production and isolated PR previews on their own code-under-test origin and avoids hard-coding a deployment hostname into the design method.

A normal team member does not need to discover or connect the implementation repository, branches, pull requests, database provider, deployment provider or internal storage paths merely to execute Design. This is a workflow/interface boundary, not a secrecy mechanism: maintainers may still work with the implementation repository separately.

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

The Printmailing card reuses the current persisted Website Opportunity findings as the canonical finding source for the manually created mailing. It does not create or store a second opportunity list.

## Prospect Design Brief v0.5

The brief contains only material prospect-specific design context:

1. Design objective
2. Prospect profile
3. Verified prospect facts
4. Verification gaps
5. Prioritized website opportunities — title + concrete evidence in reviewed order
6. Current website evidence — technical/diagnostic issues + strengths
7. Current design state
8. Operator direction
9. Hard constraints

The Website Opportunity projection intentionally excludes full customer-facing sales prose by default. `recommendation` is advisory context, not an unquestionable design instruction. The design method remains responsible for solving the visual/UX problem.

The brief does not contain:

- canonical sector key;
- Sector Intelligence URL/content;
- reusable sector guidance;
- raw qualification state;
- implementation internals.

If the review's `source_audit_id` differs from the latest audit, the Design Brief shows a freshness warning rather than silently treating the review as current.

## Design Bootstrap v0.4

The Bootstrap loads only the generic SolidDesign design method and the prospect-specific brief/evidence.

It resolves required SolidDesign resources relative to `SOLIDDESIGN_ORIGIN`, derived from the supplied start URL. It does not require a repository connector or implementation-provider discovery.

It does not load:

- Sector Intelligence;
- `prompts/sectors/`;
- category design presets.

Governing design rule:

> Design the actual prospect, not an abstract sector.

The Bootstrap version need not change merely because the deterministic prospect Brief gained one evidence section; its own method/resource contract is unchanged.

## Prompt Library boundary

The dossier Design workflow is still not migrated into the operator Prompt Library.

The capabilities solve different problems:

- Prompt Library: reusable operator prompt invocation, including `website-opportunity-review`;
- Website Opportunity workflow: human-review/import of one prospect-specific business interpretation;
- Design Bootstrap + Prospect Design Brief: system-governed prospect-specific design handoff.

Keeping these boundaries avoids a generic prompt-output/runtime platform.

## Database rule

Do not drop `canonical_sector_key` merely to make the schema look cleaner. It remains legitimate discovery/provenance data and removing it would create migration risk without improving the operator workflow.

Website Opportunity adds no table/column; it uses one bounded `qualification.website_opportunity` namespace plus one narrow RPC. Technical audit evidence remains in `audits` unchanged.

The following retired runtime capabilities remain absent from production:

```text
operator_list_sector_link_targets()
operator_set_prospect_sector(uuid,text)
```

## Reversibility

The Website Opportunity extension is additive. Reverting the application change restores the previous Design path; the extra JSON namespace becomes inert. A compensating migration can drop the one Website Opportunity RPC. No table/column/data deletion is required for normal rollback.

Do not introduce a feature-flag subsystem solely for this reversible extension.

## Open-work cleanup

Sector Intelligence content PRs #20, #21 and #39 were closed without merge.

PR #44 was superseded rather than rebased. Its useful clean-ChatGPT principle was incorporated as the smaller origin-relative two-URL contract; its Sector Intelligence selector/linking design and repository-visibility blocker are not part of the current workflow. Repository privacy remains a separate governance decision, not a prerequisite for normal Design execution.

The final current-truth sweep also removed the unused Google Places fallback adapter and the stale PR44-era repository-boundary test. Discovery therefore has exactly the three documented product inputs rather than a hidden fourth provider path.

## Production closeout evidence

Original prospect-first sector cutover:

```text
PR #50: merged
merge SHA: 73ff1ad8cb5122a242c60ca01f98bdb5798ff61d
CI #566 / run 34317993838: SUCCESS
Deploy Operator #223 / run 34317993847: SUCCESS
```

Database retirement:

```text
Supabase migration: 20260909061328 retire_sector_linking_v01
operator_list_sector_link_targets() = absent
operator_set_prospect_sector(uuid,text) = absent
canonical_sector_key column = retained
```

Website Opportunity v5.1 acceptance evidence is maintained in the current roadmap and `docs/WEBSITE_OPPORTUNITY_REVIEW.md`; business/commercial acceptance remains separate from technical completion.

## Acceptance invariants

1. Discovery still accepts sector input.
2. Overture sector resolution still works.
3. Direct URL intake works without sector classification.
4. A prospect with no canonical sector key can use Design normally.
5. Design has one primary ChatGPT action: `Kopieer designopdracht`.
6. Generated Design Brief contains no Sector Intelligence or canonical sector lookup identity.
7. Design Brief automatically includes the current reviewed Website Opportunity priority + evidence when present.
8. Website Opportunity and explicit Designinstructie remain separate concepts.
9. Design Bootstrap performs no sector lookup.
10. The two-URL handoff resolves design-method resources from the supplied SolidDesign origin and does not require repository/provider discovery.
11. Website concept upload/LIVE publication still works.
12. Printmailing versioning still works on Design and reuses the same reviewed Website Opportunity source.
13. Outreach still records the exact sent printmailing version.
14. No active runtime request targets `/api/sector-intelligence`.
15. No current documentation presents Sector Intelligence as a live capability.
16. Obsolete sector UI/API/RPC/tests/deploy paths remain removed rather than deprecated in parallel.
17. Discovery exposes only the three documented product intake paths unless real evidence earns another source.

## Definition of Done

Done means:

```text
business workflow simplified
+ implementation complete
+ discovery regression-proven
+ Website Opportunity contract verified
+ design regression-proven
+ clean ChatGPT handoff regression-proven
+ printmailing reuse verified
+ stale runtime removed
+ conflicting tests removed
+ current docs aligned
+ obsolete open work closed/superseded
+ production behavior verified
```

The repository represents one current truth. Git history preserves the retired architecture.
