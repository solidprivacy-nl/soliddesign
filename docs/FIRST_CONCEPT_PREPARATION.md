# First Concept Preparation

**Status:** canonical v0.1  
**Governing rule:** `ENGINEERING_CONSTITUTION.md`

## Problem

`Voeg toe aan Prospects` previously changed only the prospect state. The Operator copy implied that a technical report would follow, but no audit or mock-up production was actually started. This left selected prospects in the active work queue without the proof assets needed for the next step.

A second problem surfaced with linkhub URLs such as Linktree: Discovery was scoring the technical quality of the linkhub platform as if it were the prospect's own website. That answers the wrong question. A linkhub can be perfectly implemented by its platform while the business still has a large opportunity because it has no standalone website.

## Hard requirements

- one explicit operator action must be enough to select a prospect and start the first proof preparation;
- no hidden side effect merely from viewing a prospect;
- normal operators do not need GitHub access;
- a standalone website and a linkhub are different evidence types;
- never technically audit Linktree or another linkhub as if it were the prospect's standalone site;
- never fabricate a complete 0–25 commercial qualification just to unlock design production;
- reuse the existing guarded Pitch Doctor adapter for standalone websites;
- reuse the existing deterministic `VerifiedFacts → ConversionBrief → DesignProfile → SiteConfig → HTML` baseline;
- reuse existing `audits`, `demos`, storage and preview contracts;
- do not introduce a second job/state database.

## Decision

Promotion into Prospects means that a human has selected the candidate for production. That selection starts one bounded **first-concept preparation**.

```text
DISCOVERY
→ Voeg toe aan Prospects
→ QUALIFIED / selected
→ first-concept preparation
    ├─ STANDALONE
    │   → guarded Pitch Doctor audit
    │   → reviewed technical report
    │
    └─ LINKHUB
        → no linkhub technical audit
        → reviewed presence finding:
          "geen zelfstandige website gevonden"
→ VerifiedFacts
→ ConversionBrief
→ DesignProfile
→ SiteConfig
→ deterministic baseline HTML
→ audit + LIVE demo in Supabase
→ DEMO_READY
```

The existing full five-factor commercial qualification remains evidence-gated. First-concept preparation does not create missing commercial evidence or invent scores.

## Online-presence classification

Phase 1 uses a small deterministic hostname classifier. Known linkhub hosts include Linktree and a short list of equivalent services.

The classifier answers only:

```text
Is this URL a standalone business website or a linkhub?
```

It does not attempt to infer every possible site type or build a general website taxonomy.

### Standalone website

The existing guarded Pitch Doctor adapter remains the full technical donor. Its normalized reviewed output is stored in `audits` and used by the existing verified-facts boundary.

### Linkhub

A linkhub is treated as evidence of online presence and possibly useful external links, but not as the prospect's own website.

The technical report records a narrow reviewed finding:

> Geen zelfstandige website gevonden.

The linkhub itself receives no 0–100 website score. Its platform markup, H1, metadata, scripts and CTA implementation are not scored as the prospect's craftsmanship.

For Discovery prioritization, a linkhub is a strong website-opportunity signal because a standalone site can often be added while preserving the existing booking/contact destinations.

## Execution boundary

Pitch Doctor requires Python, Playwright and Chromium and therefore does not belong inside the Cloudflare Pages request runtime.

The smallest viable remote compute boundary is the repository's existing GitHub Actions platform:

```text
Operator
→ authenticated narrow Pages endpoint
→ one-time preparation capability
→ GitHub repository_dispatch
→ Prepare Prospect workflow
→ Supabase preparation gateway
→ existing operational tables/storage
```

This is not a generic job platform.

### One-time capability

The Operator generates a random one-time token. Only its SHA-256 hash is stored temporarily in the existing `prospects.qualification.preparation` object, with a 30-minute expiry.

The GitHub workflow receives the raw one-time token and prospect ID. It does **not** receive the Supabase service-role key. The Supabase Edge Function validates the token against the stored hash before returning bounded prospect input or accepting a result.

On `COMPLETE` or `FAILED`, the hash and expiry are removed.

No `preparation_jobs` table is introduced.

## Storage and publication

Successful preparation reuses existing operational contracts:

- `audits`: normalized reviewed audit/presence finding plus technical report HTML/Markdown;
- `demos`: deterministic baseline configuration and preview metadata;
- `mockup-sites/versions/<prospect>/<demo>/index.html`: immutable version artifact;
- `mockup-sites/live/<prospect>/manifest.json`: stable LIVE pointer;
- `prospects.verified_facts`: verified-facts result;
- `prospects.state = DEMO_READY` after successful initial preparation.

The first automatic baseline is intentionally published as the initial LIVE proof. Later design refinements continue to use the existing DRAFT → human review → LIVE promotion workflow.

## Operator UX

Normal path:

```text
[Voeg toe aan Prospects]
→ toegevoegd
→ "Technisch rapport en eerste mock-up worden voorbereid."
```

The user does not select an audit provider, start a second workflow or manage a job.

Recovery path exists only when an already-selected prospect is missing an audit or mock-up:

```text
[Start eerste beoordeling en mock-up]
```

While queued/running, the Prospect view shows one progress message. On completion it refreshes the existing audit/mock-up UI. A failed run exposes one retry action.

## Failure modes

- **Linkhub mistaken for website** → deterministic hostname classification before scoring/audit.
- **Full qualification fabricated** → first-concept preparation does not call the 0–25 qualification gate.
- **Duplicate dispatch** → gateway reuses existing audit/demo and treats the operation idempotently.
- **Stale capability** → 30-minute expiry and hash removal on terminal state.
- **Remote runner gets privileged database credential** → prohibited; workflow uses only the one-time capability.
- **Preparation fails after promotion** → prospect remains selected; Prospect view exposes the bounded retry action.
- **LIVE proof silently changes later** → later refinements retain the existing DRAFT/human promotion boundary.

## Reversibility

High. The feature adds one deterministic classifier, one bounded runner, one narrow Edge Function and one short-lived JSON state object. Existing audit/demo/storage contracts remain unchanged. Removing the automatic trigger returns the system to manual preparation without data migration.

## Final rule

> Human selection should start production, but it must not manufacture evidence. Classify the actual online presence first, then reuse the smallest proven pipeline that fits it.
