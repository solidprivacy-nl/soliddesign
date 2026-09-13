# SolidDesign Prompt Library

**Status:** canonical production contract  
**Date:** 2026-09-14  
**Principle:** centralize reusable operator method without creating a prompt-management platform.

## 1. Objective

SolidDesign keeps reusable ChatGPT methods in one place so operators do not copy or maintain full method text per chat.

```text
METHOD
GitHub-managed Markdown

+

INVOCATION CONTEXT
small per-run operator values

→ one copyable ChatGPT invocation
```

The Prompt Library is an operator interface over repository-managed method content. It is not a second workflow engine, prompt database or AI execution service.

## 2. Source of truth

Canonical operator prompts live only at:

```text
prompts/library/<slug>.md
```

Git provides history, diff and rollback. Supabase contains no duplicate prompt body/version table.

Static prompt Markdown is staged with the Operator deployment and is readable from the same SolidDesign origin so ChatGPT/web tooling can consume the referenced method.

## 3. Prompt classes and design boundary

Engineering-governed system/design resources remain outside Prompt Library administration:

- `prompts/SOLIDDESIGN_BOOTSTRAP.md`;
- `prompts/core/*`;
- `prompts/workflow/*`.

Only files directly below `prompts/library/` are managed by the CMS Prompt Library.

An operator prompt delegates to an existing canonical system method when one already exists instead of copying that method into a competing prompt.

For design there is now exactly one operator entry:

```text
prompts/library/website-design.md
        ↓
prompts/SOLIDDESIGN_BOOTSTRAP.md
        ↓
canonical Design Constitution + workflows 01–04
```

There is no separate WEBSITE_ONLY versus LOGO_AND_WEBSITE mode.

The canonical redesign flow itself assesses the logo on every run and chooses KEEP / REFINE / REDESIGN. It also resolves prominent imagery before HTML through the `ASSET_READY` gate. This keeps logo and imagery inside the actual design process instead of making the operator orchestrate separate ChatGPT rounds.

The retired `logo-website-design` entry and standalone `00_LOGO` workflow are not compatibility paths; Git history is their rollback/history source.

## 4. Identity and file contract

The Markdown filename is stable prompt identity:

```text
prompts/library/website-design.md
slug = website-design
```

Slug contract:

```regex
^[a-z0-9][a-z0-9-]{0,62}$
```

Each prompt contains constrained front matter plus Markdown body. Supported invocation fields are intentionally small:

```text
key
label
control = text | url | textarea
placeholder
required
```

No conditions, formulas, scripting, workflow logic or generic form-builder features are supported.

## 5. Role model

### USER / KEY_USER

May:

- list title/category/description;
- see invocation fields;
- supply run-specific values;
- copy the completed ChatGPT invocation.

May not retrieve prompt body through the CMS management API or mutate prompt files.

### ADMIN

May additionally:

- retrieve operator prompt body;
- create/update/delete operator prompts;
- edit invocation metadata.

The server re-checks the active `team_members` row and role. UI visibility is never authorization.

## 6. Repository-write boundary

The server derives the only writable path itself:

```text
validated slug
→ prompts/library/<slug>.md
```

It never accepts an arbitrary repository path. Core prompts, workflow prompts, source code and documentation are outside the mutation capability.

Update/delete operations require the current GitHub content SHA. A stale editor receives a conflict rather than overwriting newer content.

PR previews are read-only for repository mutations; Prompt Library writes are production-CMS-only.

## 7. Browser data boundary

Normal Prompt Library reads expose only:

```text
slug
title
category
description
invocation
```

Body retrieval is Admin-only. Invocation values remain ephemeral browser state unless a separate business workflow already owns the value.

Website Opportunity Review is an example of that separation: its prompt body remains in GitHub, while only the operator-approved result is persisted by the dedicated prospect workflow at `qualification.website_opportunity`.

No GitHub write credential is exposed to browser code.

## 8. Invocation renderer

One browser utility owns the copied invocation format. CMS workflows call that renderer instead of maintaining independent prompt strings.

Conceptually:

```text
invocation intro
prompt URL
field label + value
field label + value
...
```

The prospect Website Opportunity surface reuses this renderer for `website-opportunity-review`; it does not embed a second prompt body or renderer.

## 9. Repository credential boundary

The neutral runtime binding is:

```text
GITHUB_CONTENT_TOKEN
```

Production still contains one isolated compatibility fallback for the previously deployed Cloudflare secret name `GITHUB_SECTOR_INTELLIGENCE_TOKEN`. A read-only 2026-09-09 configuration probe confirmed that Cloudflare production currently has the legacy secret binding and not the neutral binding; Cloudflare returns secret values redacted, and no duplicate GitHub Actions secret exists. Copying or renaming that secret autonomously would therefore require unsafe secret-exfiltration machinery and is deliberately rejected.

Runtime must prefer `GITHUB_CONTENT_TOKEN` whenever present. The legacy name may exist only as that single compatibility fallback; it is not Sector Intelligence functionality and must not spread to any other code or documentation.

Once the neutral Cloudflare secret is configured with the same repository credential, remove the fallback without any product/workflow change.

## 10. Confidentiality boundary

The current requirement is role-based CMS access, not cryptographic prompt secrecy. Static prompt URLs are intentionally readable so ChatGPT can consume them.

If strict prompt secrecy later becomes a real business requirement, the correct boundary is server-side AI execution. Hidden URLs, obscurity and user-agent checks are not substitutes.

## 11. Canonical entries

Current authoritative operator methods are:

- `prospect-research` — evidence-backed prospect research and the CMS CSV handoff;
- `website-design` — one integrated end-to-end redesign entry. The canonical design method assesses logo equity, resolves art direction and produces/locks required imagery before HTML; no separate logo mode exists;
- `website-opportunity-review` — business-first, evidence-backed review for a selected prospect, returning the exact human-review/import contract used by the prospect dossier.

New entries are added only when an authoritative reusable method actually exists.

## 12. Workflow result ownership

Prompt Library owns reusable method content, not business results.

Where a business workflow needs a reviewed result, that workflow owns its narrow persistence contract. For Website Opportunity Review:

```text
GitHub prompt
→ ChatGPT proposal
→ human review
→ operator_set_website_opportunity(...)
→ prospects.qualification.website_opportunity
```

Do not generalize this into a prompt-output database or arbitrary AI import API.

Design artifacts remain owned by the existing Design/version workflow. The Prompt Library does not create a parallel design state plane or an asset-management subsystem.

Logo and imagery created during a design run are design artifacts/inputs for that run. When practical they are embedded into the final self-contained HTML. SolidDesign does not add database asset state merely to support this prompt correction.

## 13. Failure behaviour

- repository read unavailable → Prompt Library reports unavailable; prospect state is unchanged;
- malformed front matter → invalid prompt is excluded until corrected;
- non-Admin body request/mutation → rejected;
- stale SHA → conflict;
- missing write credential → explicit configuration error;
- Prompt Library failure never publishes a design, promotes a prospect or sends outreach;
- Website Opportunity prompt failure leaves the previous approved opportunity state unchanged;
- design asset generation/editing unavailable → the canonical design run may use adequate existing assets; if a professional prominent role cannot be solved, it must report a genuine design blocker rather than silently deliver known-bad imagery.

## 14. Non-goals

Do not add without observed need:

- prompt database/version table;
- favorites/ratings/usage analytics;
- approval state machine;
- generic form builder;
- prompt marketplace;
- background AI execution or queue;
- generic AI-result import framework;
- separate Prompt Manager role;
- separate logo-design mode for normal prospect redesign;
- asset database/DAM;
- image-generation service or orchestration layer;
- visual scoring engine.

The current correction is a design execution contract, not new runtime architecture.

## 15. Acceptance

Production/CI verification must establish:

- active USER/KEY_USER can use invocation metadata without CMS body access;
- ADMIN mutation is constrained to `prompts/library/` and SHA-guarded;
- one shared invocation renderer is used;
- prompt content is not duplicated into Supabase;
- static prompt URLs are deployed on the SolidDesign origin;
- PR-preview mutations are rejected;
- repository credentials remain server-side;
- Website Opportunity reuses the same renderer and persists only its reviewed business result through its own narrow RPC;
- Prompt Library remains separate from the prospect-specific Design Bootstrap/Brief workflow;
- `website-design` delegates to the canonical Bootstrap rather than duplicating a full design method;
- there is only one active operator design entry;
- the canonical method contains logo KEEP / REFINE / REDESIGN assessment as part of every redesign;
- prominent imagery is selected/edited/generated and locked before HTML via `ASSET_READY`;
- no retired `logo-website-design` or `00_LOGO` parallel path remains;
- no new database/runtime subsystem exists for the adjustment.

Further AI automation remains evidence-gated by real operator/commercial use, not by feature completeness.
