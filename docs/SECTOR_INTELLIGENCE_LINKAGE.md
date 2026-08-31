# Sector Intelligence linkage

**Status:** architecture v0.5  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Business goal

Research a market once, keep the result reusable, and make it available to any relevant prospect regardless of how that prospect entered SolidDesign.

A prospect found through area discovery, a prospect entered through a direct URL and a prospect added by a future discovery source all use the same Sector Intelligence mechanism.

## First-principles model

Discovery provenance and sector identity are different facts:

```text
Discovery run = how did we find this company?
Canonical sector = what market does this prospect belong to for reusable design intelligence?
```

They must not be coupled.

Minimal model:

```text
Prospect
  → canonical_sector_key
  → current published Sector Intelligence
```

`prospects.canonical_sector_key` is the primary machine identity for the prospect's sector. There is one primary sector per prospect.

## Automatic versus explicit linkage

Automate only when the sector is genuinely known.

- **Single-sector area discovery:** a candidate may inherit the one validated sector automatically.
- **Multi-sector area discovery:** no primary sector is guessed.
- **Direct URL discovery:** a URL alone is insufficient evidence, so no automatic classification is performed.
- **Operator correction:** an operator can explicitly assign or change the sector for any non-archived company/prospect.

Changing the prospect sector never rewrites discovery provenance.

A many-to-many sector model is deliberately not introduced. It is unnecessary for the current design-selection problem and would add ambiguity.

## Human market term versus canonical identity

The operator researches with normal market language such as `kapper`, `juwelier` or `elektricien`.

The existing sector resolver maps that term to the stable Overture identity used internally. A machine key such as `barber` must never silently replace the human research term `kapper` in the research instruction.

The canonical key is storage/linkage identity, not operator-facing market language.

## CMS workspace

`Sectoronderzoek` is a first-class CMS workspace.

It owns the complete research/operator flow and does not borrow or move Discovery UI state.

Discovery and Sectoronderzoek share only the validated sector-resolution capability.

The workspace provides four bounded capabilities:

1. **Research** — human sector term + start location + optional research direction.
2. **Overview** — business-readable status of existing research.
3. **Review** — inspect, publish or reject pending research entirely inside the CMS.
4. **Link** — explicitly associate any non-archived company/prospect with one validated sector.

The prospect Design context also exposes the current sector association and a route into Sectoronderzoek.

## Optional operator research direction

The optional field `Aanvullende onderzoeksrichting` accepts natural-language judgement, including URLs and reasons why the operator considers something worth inspecting.

Example:

```text
Bekijk ook https://voorbeeld.nl. Ik vind vooral de mobiele navigatie en rustige compositie sterk.
```

This input is explicitly challengeable evidence. The research model must inspect it independently, compare it with broader evidence and say when the operator assumption is weak or only partially supported.

No separate reference entity, rating system, tagging model, library or lifecycle is introduced.

## Research lifecycle

Operator-visible lifecycle:

```text
CMS
→ research prompt
→ ChatGPT research
→ validated result
→ Ter beoordeling
→ CMS human review
→ Beschikbaar
```

The CMS exposes business concepts only. Normal operators never see or need repository URLs, repository names, branches, review transport identifiers or storage paths.

The backend may continue to use existing engineering/version-control infrastructure internally. That implementation detail is behind one narrow server-side Sector Intelligence façade.

## Authorization

Sector Intelligence uses the same authorization truth as the rest of the Operator:

```text
auth.uid()
→ active team_members
→ operator_is_active_team_member()
```

The retired `operator_allowlist` model is not a fallback and must not be recreated.

The sector-linking RPCs continue to call `operator_assert_allowed()`, which resolves through active `team_members` membership.

## Browser/server boundary

The browser-facing Sector Intelligence API may return only domain data such as:

```text
canonical_sector_key
research_label
researched_at
status
has_published
has_pending_review
content
```

It must not return technical source/review URLs, branch names, pull-request identifiers or repository paths.

Errors shown to operators are domain errors such as `Sectoronderzoek kon niet worden geladen`; infrastructure-provider details stay server-side.

## Design brief lookup

Lookup order remains:

```text
1. prospect.canonical_sector_key
2. legacy single-sector discovery-run key (compatibility only)
3. no Sector Intelligence
```

The legacy fallback is read-only compatibility debt. New linkage is always written to `prospects.canonical_sector_key`.

A direct-URL prospect becomes Sector Intelligence-aware immediately after an operator links its sector; no synthetic discovery run is required.

## Non-goals

Do not add without measured need:

- a Sector Intelligence content table in Supabase;
- a reference-management subsystem;
- background research jobs;
- automatic LLM classification of arbitrary websites;
- multiple sectors per prospect;
- automatic publication without human review;
- automatic mutation of an existing LIVE mock-up;
- a general-purpose repository gateway.

## Final rule

The correct abstraction is the reusable market knowledge, not the transport used to store or review it.
