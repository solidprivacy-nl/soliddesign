# SolidDesign Prompt Library

**Status:** canonical operator-prompt contract  
**Date:** 2026-09-08  
**Principle:** centralize reusable method without creating a prompt-management platform.

## 1. Objective

SolidDesign uses reusable ChatGPT methods for prospect research, website design and other operator workflows. Copying the full method into every chat creates version drift and operator friction.

The Prompt Library therefore separates:

```text
METHOD
GitHub-managed Markdown prompt

from

INVOCATION CONTEXT
small per-run values supplied by the operator
```

Operators copy a stable SolidDesign URL plus the current context. They do not copy the prompt body itself.

## 2. Source of truth

Prompt content is repository content:

```text
prompts/library/<slug>.md
```

Git provides history, diff and rollback. Supabase does not duplicate prompt content, versions, fields or categories.

Cloudflare Pages already stages `prompts/` into the Operator deployment. The stable consumption shape therefore remains:

```text
https://soliddesign-cms.pages.dev/prompts/library/<slug>.md
```

No custom prompt resolver is required.

## 3. Prompt classes

System/design architecture and operator prompts are deliberately separate.

### Engineering-governed system prompts

Examples:

- `prompts/SOLIDDESIGN_BOOTSTRAP.md`;
- `prompts/core/*`;
- `prompts/workflow/*`;
- proven sector overlays.

These are not mutable through Prompt Library administration.

### Admin-managed operator prompts

Only files directly below:

```text
prompts/library/
```

are managed by the CMS Prompt Library.

An operator prompt should delegate to an existing canonical system method when one already exists rather than copy that method into a second prompt.

## 4. Identity

The Markdown filename is stable prompt identity.

Example:

```text
prompts/library/website-design.md
slug = website-design
```

An existing slug is immutable through the CMS. Change title, description, invocation fields or body without breaking existing workflow references.

If a fundamentally different reusable method is needed, create a new slug.

## 5. File contract

Each operator prompt contains constrained front matter plus Markdown body.

Example:

```markdown
---
title: "Website design"
category: "Design"
description: "Start een website-redesign."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"website","label":"Website","control":"url","placeholder":"https://www.bedrijf.nl","required":true}]}
---
# SolidDesign Website Design
...
```

The front matter deliberately supports only the fields SolidDesign uses. It is not a generic YAML-driven form platform.

Invocation field contract:

```text
key
label
control = text | url | textarea
placeholder
required
```

No conditions, formulas, field dependencies or workflow scripting are supported.

## 6. Role model

### USER

May:

- list prompt title/category/description;
- see required invocation fields;
- supply invocation values;
- copy the completed ChatGPT invocation.

May not:

- retrieve prompt body through the CMS management API;
- add, update or delete prompts.

### KEY_USER

Has the same Prompt Library rights as USER.

No additional Prompt Manager role exists.

### ADMIN

May additionally:

- retrieve prompt body through the authenticated management endpoint;
- create an operator prompt;
- update an operator prompt;
- update invocation metadata/fields;
- delete obsolete operator prompts.

The server validates the active `team_members` row and `role = ADMIN`. UI hiding is not authorization.

## 7. Repository-write boundary

The Prompt Library server capability never accepts an arbitrary repository path.

The only writable path is derived as:

```text
validated slug
→ prompts/library/<slug>.md
```

Slug contract:

```regex
^[a-z0-9][a-z0-9-]{0,62}$
```

Core/workflow prompts, source code, documentation and other repository files are outside this capability.

Existing file updates and deletes use the current GitHub content SHA as optimistic concurrency protection. A stale editor receives a conflict rather than silently overwriting newer content.

## 8. Browser data boundary

Normal Prompt Library reads return only:

```text
slug
title
category
description
invocation
```

The body is returned only when an authenticated Admin explicitly requests the management detail.

Generic invocation values are ephemeral browser state. They are not persisted to Supabase.

Known prospect values may be supplied as workflow prefill without creating new prompt state.

## 9. Invocation renderer

One browser utility owns the copied text format.

Conceptually:

```text
invocation intro
prompt URL
field label + supplied value
field label + supplied value
...
```

Example:

```text
Lees en volg deze SolidDesign-prompt volledig:
https://soliddesign-cms.pages.dev/prompts/library/website-design.md

Website:
https://www.bedrijf.nl

Aanvullende instructie:
Behoud de bestaande merknaam.
```

CMS workflows should call this renderer instead of maintaining independent prompt strings.

## 10. Confidentiality boundary

The current requirement is:

> USER and KEY_USER may not inspect prompt bodies through the CMS.

The implementation enforces that requirement.

It does **not** claim that URL-delivered prompts are cryptographically secret from those operators. If ChatGPT can anonymously retrieve a URL that an operator copies, that operator can in principle retrieve the same URL outside the CMS.

Making the GitHub repository private later protects repository access but does not alter that URL-consumption fact.

If strict prompt secrecy later becomes an observed business requirement, the correct architecture is server-side AI execution where the private prompt never reaches the operator browser. Signed-looking URLs, obscurity or user-agent checks are not substitutes for that boundary.

## 11. GitHub credential

Repository access remains server-side. No GitHub credential is sent to browser code.

The current deployment already carries the Sector Intelligence repository credential. Prompt Library accepts that existing binding and also supports the neutral future binding `GITHUB_CONTENT_TOKEN`. Do not remove the deployed existing binding until Cloudflare configuration has been migrated and verified.

This compatibility is configuration transition, not a second authorization model.

## 12. Initial canonical entries

Current implementation seeds only methods for which SolidDesign has authoritative content:

- `prospect-research` — evidence-backed prospect research and CMS CSV handoff;
- `website-design` — a light wrapper that delegates to the existing canonical SolidDesign design bootstrap.

Logo/flyer methods may be added by Admin once their authoritative prompt bodies are deliberately adopted. Do not fabricate placeholder methodology merely to populate the library.

## 13. Failure behaviour

- repository read unavailable → library reports unavailable; existing prospect work remains usable;
- malformed prompt front matter → invalid file is excluded from normal listing and must be corrected by Admin/engineering;
- non-Admin body request → `403`;
- non-Admin mutation → `403`;
- stale SHA on update/delete → `409`;
- missing repository write credential → Admin mutation returns configuration error;
- Prompt Library failure never changes prospect state.

## 14. Non-goals

Do not add without observed need:

- prompt database;
- prompt-version table;
- favorites;
- ratings;
- usage analytics;
- approval state machine;
- generic form builder;
- prompt marketplace;
- background AI execution;
- AI job queue;
- separate Prompt Manager role.

## 15. Acceptance

Prompt Library is complete only when:

```text
[ ] active USER can list/use invocation metadata
[ ] active KEY_USER can list/use invocation metadata
[ ] neither can retrieve body through CMS management API
[ ] ADMIN can read/create/update/delete operator prompts
[ ] Admin writes cannot escape prompts/library/
[ ] stale-SHA overwrite is rejected
[ ] copied invocation uses the one shared renderer
[ ] no prompt content is duplicated into Supabase
[ ] deployed static prompt URL is readable by ChatGPT/web tooling
[ ] repository and security documentation match runtime behaviour
```
