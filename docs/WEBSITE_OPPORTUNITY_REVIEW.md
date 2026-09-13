# Website Opportunity Review — v5.1

**Status:** current production contract; technical implementation verified 2026-09-13  
**Date:** 2026-09-13  
**Scope:** selected prospect → reviewed website opportunities → Design → Printmailing → Outreach  
**Governing doctrine:** `ENGINEERING_CONSTITUTION.md`

## 1. Business objective

SolidDesign must turn verified website evidence into a concise prospect-specific commercial story that improves the quality of the redesign and the outbound conversation without creating a second audit system or AI platform.

The prospect should be able to understand:

```text
What is happening on my current website?
→ why does it matter to a real visitor/customer?
→ what should be improved first?
→ can SolidDesign visibly improve it?
→ what is the next step?
```

Website Opportunity Review exists to make the middle of that chain explicit and reusable.

It is not a report product. It is the **one reviewed interpretation layer** shared by the prospect dossier, Design and Print.

## 2. Architecture decision

Canonical flow:

```text
TECHNICAL / WEBSITE EVIDENCE
        ↓
WEBSITE OPPORTUNITY REVIEW
        ↓ human reviewed
prospects.qualification.website_opportunity
        ↓
 ┌──────┼──────────────┐
 ↓      ↓              ↓
CMS   DESIGN          PRINT
                       ↓
                    OUTREACH
                       ↓
                 ENGAGEMENT / OUTCOME
```

This adds no new subsystem.

Existing ownership remains:

```text
GitHub
= reusable method, code, architecture, history

Supabase
= operational prospect state

Cloudflare
= CMS runtime + public delivery
```

Website Opportunity is stored in the existing prospect dossier because it is current prospect-specific operational knowledge.

## 3. Responsibility boundaries

### Technical audit

Purpose:

> record diagnostic evidence about the current website.

`audits.findings` keeps its current technical/diagnostic meaning. Technical severity is not redefined as business priority.

The review must never overwrite or rewrite the audit merely to improve sales communication.

### Website Opportunity Review

Purpose:

> decide which evidenced website observations are commercially meaningful enough to influence the redesign and prospect conversation.

It may select, combine, rephrase and prioritize evidence. It may also include directly observed website issues that the technical scanner did not produce.

It may not invent traffic, rankings, conversion, revenue, lead volume, customer behaviour or unverified business facts.

### Verified Facts

Verified Facts remain the trust boundary for customer-facing prospect facts. Website Opportunity findings describe the website and its visitor/customer implications; they do not authorize new claims about the business.

### Design

Design consumes the reviewed priority + observed evidence. It remains responsible for the actual design reasoning and solution.

### Printmailing

Print uses the same reviewed opportunities as the prospect-facing finding source. It must not create an independent second list.

### Outreach

Outreach remains responsible for the exact immutable artifact sent and the subsequent engagement/outcome record.

## 4. Operational source of truth

Current reviewed state lives only at:

```text
prospects.qualification.website_opportunity
```

Contract:

```json
{
  "source_audit_id": "uuid",
  "findings": [
    {
      "key": "primary_cta",
      "title": "De vervolgstap is niet direct duidelijk",
      "evidence": [
        "In het eerste scherm ontbreekt een duidelijke primaire contactactie."
      ],
      "business_impact": "Een geïnteresseerde bezoeker moet zelf zoeken wat de logische volgende stap is.",
      "recommendation": "Maak één primaire contact- of offerteactie direct zichtbaar."
    }
  ]
}
```

Array order is business priority.

There is deliberately no:

- score;
- business severity;
- confidence formula;
- numeric rank field;
- `OP-*` identity;
- workflow status machine.

`key` is the semantic identity needed for this scope and must be unique within one review.

A maximum of five findings prevents the object from becoming a disguised audit report. Fewer are valid. An empty array is valid when a human review finds no material supported opportunity.

## 5. Finding quality contract

Every stored finding must be:

1. **website-specific** — observed for this prospect;
2. **evidenced** — backed by concrete website/audit evidence;
3. **understandable** — meaningful to a non-technical owner;
4. **material** — important enough for Design or the prospect conversation;
5. **actionable** — linked to a realistic improvement direction;
6. **proportionate** — no stronger claim than the evidence supports.

Prefer:

> “Dit maakt de vervolgstap minder duidelijk.”

instead of:

> “Dit kost omzet.”

unless the stronger claim is genuinely evidenced.

Do not manufacture findings to reach a visual quota.

## 6. Human-in-the-loop workflow

The MVP deliberately reuses the Prompt Library instead of adding server-side AI execution.

```text
Websitekansen
→ Kopieer analyseopdracht
→ ChatGPT
→ human review/correction
→ Importeer beoordeeld resultaat
→ validated write
→ one current website_opportunity state
```

Canonical prompt:

```text
prompts/library/website-opportunity-review.md
```

The CMS passes only prospect-specific invocation context:

- prospect name;
- website URL;
- latest source audit ID;
- compact audit evidence;
- optional operator focus.

The prompt must inspect the actual website. Scanner evidence may inform the review but does not constrain it.

AI output is a proposal. Only the operator-approved import becomes operational state.

## 7. Narrow write boundary

The only Website Opportunity mutation is:

```text
operator_set_website_opportunity(
  prospect_id,
  source_audit_id,
  findings
)
```

The RPC:

- requires an active authorized team member;
- requires a non-archived prospect;
- verifies that the audit belongs to that prospect;
- validates the exact finding shape;
- requires concrete evidence for every finding;
- enforces the small finding-count limit;
- enforces unique semantic finding keys;
- preserves every unrelated `qualification.*` namespace;
- replaces only `qualification.website_opportunity`;
- logs `website_opportunity_reviewed` in the same transaction;
- fails atomically.

It does not:

- accept arbitrary qualification JSON;
- update `audits`;
- call an AI provider;
- become a generic import API;
- create a job or queue.

This deliberately avoids granting general browser UPDATE authority for the business operation.

## 8. Staleness is derived

Do not create persistent `DRAFT`, `APPROVED`, `STALE` or `ARCHIVED` states.

The stored review records `source_audit_id`.

The CMS compares that value with the current/latest audit:

```text
source_audit_id == latest audit id
→ current relative to audit evidence

source_audit_id != latest audit id
→ show “Gebaseerd op eerdere website-evidence”
```

Staleness is therefore a derived view, not new workflow state.

## 9. Prospect Overview UX

The existing dossier remains:

```text
Overzicht | Design | Outreach | Activiteit
```

No new navigation module is added.

The Overview contains one compact `Websitekansen` card.

Before review:

```text
Websitekansen
Nog niet inhoudelijk beoordeeld.

[Kopieer analyseopdracht]
[Importeer beoordeeld resultaat]
```

After review:

```text
Websitekansen
1. De vervolgstap is niet direct duidelijk
   Een geïnteresseerde bezoeker moet zelf zoeken hoe hij contact opneemt.

2. Sterk bewijs van betrouwbaarheid staat te laat
   Waardevol bewijs verschijnt pas na het eerste beslismoment.

[Opnieuw analyseren]
```

Technical details remain in the technical report rather than being duplicated into this card.

## 10. Design Brief projection

The Design Brief remains a deterministic evidence handoff, not a sales report.

It projects the current reviewed list as:

```text
## Prioritized website opportunities

1. Title
   Evidence: concrete observation

2. Title
   Evidence: concrete observation
```

The order is preserved.

Do not automatically inject full business-impact copy or treat `recommendation` as an unquestionable visual instruction. Design still owns solution reasoning.

The technical audit section remains separately available, including verified strengths that should be preserved.

`design_brief_note` remains explicit operator design direction and is not used as Website Opportunity persistence.

## 11. Design success rule

A prettier concept is not sufficient.

For every material opportunity that visual design can reasonably address:

```text
observed issue
→ visible design response
```

Examples:

```text
no clear primary action
→ one obvious primary action at the first decision point

trust evidence appears too late
→ verified trust proof closer to the decision point
```

A redesign should also preserve existing verified strengths where appropriate.

## 12. Printmailing projection

The current operational Print flow is intentionally manual: the operator uploads an immutable PDF/PNG/JPG mailing artifact. v5.1 does not add a PDF generator or screenshot platform.

The Printmailing surface shows and can copy the same persisted Website Opportunity findings so the operator does not retype or re-rank them while creating the final artifact.

Prospect-facing proof must use:

```text
real current-site capture
+ real capture of the exact intended concept
+ reviewed Website Opportunity findings
+ truthful concept link/QR when used
```

The legacy Python component-spike renderer is not the canonical CMS mailing creation path. It must not be treated as the source of current prospect-facing findings.

No new screenshot table/service is justified for this milestone.

## 13. Mailing/version integrity

Existing separation remains correct:

```text
mailing_artifact = exact immutable file
mailing          = exact physical send
demo             = website concept version
```

Before registering a send, the operator checks:

```text
PDF after-image == intended concept
QR/link destination == intended concept
current LIVE at send == intended concept
selected mailing artifact == final checked file
```

The current artifact/demo timing gap is not expanded in this milestone. If repeated production proves that artifact creation and LIVE changes cause real mismatches, the smallest later root fix is an exact `mailing_artifacts.demo_id` binding.

## 14. Public link semantics

`prospects.public_slug` continues to resolve to the **current LIVE concept**.

A mailing is historical and immutable.

Do not pretend these identities are the same. During the pilot either keep the intended mailed version LIVE through the response window or use an existing immutable preview when exact version identity is required.

No campaign-link service is introduced.

## 15. Security

External website content remains untrusted.

AI output is not verified truth.

Trust flow:

```text
website/audit evidence
→ AI proposal
→ operator review
→ exact server-side contract validation
→ operational state
```

Security requirements:

- browser uses only the publishable Supabase key;
- service-role credentials never enter browser code;
- RPC checks active team membership;
- `source_audit_id` ownership is checked server-side;
- no generic `qualification` mutation endpoint exists;
- unrelated qualification namespaces are preserved;
- function execution is revoked from `PUBLIC`/`anon` and explicitly granted to `authenticated`;
- activity logging happens in the same transaction.

Supabase's generic security advisor warns that signed-in users can execute exposed `SECURITY DEFINER` functions. This is intentional for the operator RPC pattern in SolidDesign: the callable function is the guarded business capability and immediately applies the existing active-team authorization check before any mutation. The v5.1 function uses the same pattern as the existing operator RPCs rather than creating a second authorization model.

## 16. Reversibility / rollback

v5.1 is deliberately additive and reversible.

### Before merge

The implementation was developed and verified on dedicated PR #53. Before merge, closing that PR would have left the application runtime unchanged.

### After merge — application rollback

Revert production commit:

```text
443a533fbe05cc9f29e5ed55d4fd043cf197c25a
```

Because the CMS reads Website Opportunity only through the v5.1 module/Design projection, persisted JSON becomes inert when those readers are removed.

### Database capability rollback

Apply a compensating migration:

```sql
drop function if exists public.operator_set_website_opportunity(uuid, uuid, jsonb);
```

No table or column must be dropped.

### Data rollback

No destructive data cleanup is required to restore prior behaviour. Keeping `qualification.website_opportunity` is preferred because it preserves history while old code ignores the namespace.

Only if explicit data deletion is required should a separate reviewed cleanup remove that namespace. Do not combine destructive cleanup with ordinary rollback.

### Why no feature flag

A feature flag would add a second control plane for a small isolated capability. Git/PR rollback plus one removable RPC is simpler and sufficient.

## 17. Non-goals

Do not add in v5.1:

- Website Opportunity table;
- second audit table;
- Business Opportunity service;
- score/severity/confidence model;
- generic AI runtime/provider abstraction;
- queue or agent framework;
- generic JSON importer;
- screenshot service/database/browser farm;
- pricing/package engine;
- new top-level CMS workspace;
- new Design or Outreach state machine;
- automatic review for every Discovery candidate.

## 18. Technical acceptance

Technical implementation is complete and verified:

- canonical prompt is in GitHub;
- exact write contract is enforced by one narrow RPC;
- unrelated qualification namespaces survive writes by bounded merge;
- source audit ownership is validated;
- Websitekansen appears in the existing prospect Overview;
- the same state is projected into Design Brief in stored order;
- the Printmailing surface reuses the same state rather than a retyped list;
- technical audit data remains unchanged;
- authorization and validation tests pass;
- Discovery, Design publication, mailing artifact and Outreach send regressions remain green;
- documentation and roadmap match runtime reality.

Verification evidence:

```text
PR #53: merged (squash)
PR exact head: dc3066f8de872b0184c3a9ba4c84b13ef1250616
PR CI #604 / run 34780801643: SUCCESS
PR Deploy Operator #232 / run 34780801625: SUCCESS
production merge SHA: 443a533fbe05cc9f29e5ed55d4fd043cf197c25a
production CI #605 / run 34780908610: SUCCESS
production Deploy Operator #233 / run 34780908617: SUCCESS
Supabase migration: 20260913202811 website_opportunity_v51
migration readback: guarded SECURITY DEFINER RPC, fixed search_path, intended authenticated execute grant
migration data effect: 0 prospect rows populated merely by migration application
```

Commercial validation remains separate. The A. van Berkel pilot and subsequent real sends determine whether the method improves response enough to justify its operating cost.
