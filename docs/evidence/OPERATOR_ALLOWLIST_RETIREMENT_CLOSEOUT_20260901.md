# Operator Allowlist Retirement — Application-wide Closeout

**Date:** 2026-09-01  
**Status:** CLOSED  
**Scope:** retirement of the historical database-backed `operator_allowlist` membership authority from current SolidDesign runtime, execution, current documentation and regression protection.

## Why this closeout was required

The database retirement on 2026-08-30 was correct, but a later application-wide audit found that two deployed Supabase Edge Functions still referenced the removed table and that three Pages API endpoints authenticated a valid Supabase user without separately requiring active team membership.

The failure was therefore not the database migration itself. The failure was incomplete retirement coverage across independent execution planes.

## Ten challenge passes used to improve the correction plan

1. **Audit execution planes, not filenames.** Database, browser, Pages Functions, Supabase Edge Functions, CI, deployment and current docs all count as runtime contract.
2. **Remove the authority rather than emulate it.** No compatibility table, alias, shadow lookup or replacement e-mail allowlist was introduced.
3. **Protect the API boundary once.** A Pages Functions `/api/*` middleware now enforces active team membership instead of repeating a new copy of the same fix in geocode, site-check and sector resolution.
4. **Keep role checks where they belong.** Team invite/delete still perform their own server-side role and lifecycle checks; membership middleware does not become a permission framework.
5. **Turn retirement into an invariant.** Regression coverage scans all current Operator JavaScript and Supabase Edge Function TypeScript for the retired dependency instead of maintaining a brittle list of known offenders.
6. **Preserve historical database evolution.** `supabase/schema.sql` and old migrations remain historical bootstrap/evolution evidence; rewriting them would reduce reproducibility without improving current runtime.
7. **Separate similarly named concepts.** Auth redirect-origin allowlisting remains a URL-safety boundary and is explicitly distinguished from the retired membership `operator_allowlist`.
8. **Avoid an unearned deployment subsystem.** No second deployment service or generated Edge Function copy was introduced; repository source is canonical and production parity is an explicit deployment/verification requirement.
9. **Verify production, not only source control.** The affected Edge Functions were deployed from merged source and then re-read from Supabase; database catalog state was checked again after deployment.
10. **Do not expand scope to unrelated warnings.** Existing intentional SECURITY DEFINER advisor warnings and Auth platform configuration debt remain governed by the security/pilot contracts and were not changed merely to make an unrelated closeout look cleaner.

## Implemented correction

Merged PR: **#41 — Complete operator_allowlist retirement across runtime**  
Merged production commit: `f89fd34dfef93486891f431cc9af9f7b44e5aab5`

### Runtime

- `supabase/functions/team-invite/index.ts`
  - removed all writes to `operator_allowlist`;
  - invite membership is now represented only by the Auth user plus `team_members`.
- `supabase/functions/team-member-admin/index.ts`
  - removed allowlist delete/rollback behavior;
  - permanent deletion relies on the existing guarded Auth Admin delete and the `team_members.user_id → auth.users.id ON DELETE CASCADE` relationship.
- `operator/functions/api/_middleware.js`
  - requires `operator_is_active_team_member()` before any `/api/*` endpoint executes;
  - therefore covers geocode, site-check, sector resolution, first-concept preparation and Sector Intelligence at the common boundary.

### Regression protection

`tests/test_operator_allowlist_retirement.py` now:

- recursively scans current `operator/**/*.js`;
- recursively scans current `supabase/functions/**/*.ts`;
- fails if the retired `operator_allowlist` appears in active runtime source;
- verifies the Pages API membership boundary;
- verifies team invite/delete use `team_members` and not the retired table;
- keeps current-document and retirement-migration assertions.

### Current documentation

- `docs/OPERATIONS.md` no longer describes `operator_allowlist` as transitional compatibility.
- `docs/AUTH_REDIRECTS.md` no longer embeds PR-28 as a current acceptance environment and explicitly distinguishes redirect-origin allowlisting from membership authorization.
- `supabase/README.md` now makes Edge Function source/deployment parity an explicit completion requirement.

Historical bootstrap, migrations and superseded decision rationale remain historical evidence rather than being rewritten.

## Verification evidence

### Pull-request gate

Head SHA: `f1d9ef29697f48c575abd2d1e1d808bf80ce62f1`

- PR CI **#464** — success;
- PR Deploy Operator **#166** — success;
- unit tests — success;
- Operator static safety — success;
- Pages Functions build — success;
- PR Pages deployment/runtime smoke — success.

### Production gate

Merged SHA: `f89fd34dfef93486891f431cc9af9f7b44e5aab5`

- production CI **#465** — success;
- production Deploy Operator **#167** — success.

### Supabase Edge Function parity

Production functions were deployed from the exact merged repository source and re-read afterward:

```text
team-invite        ACTIVE  version 7  verify_jwt=true
team-member-admin  ACTIVE  version 2  verify_jwt=true
```

The re-read deployed source contains no `operator_allowlist` dependency.

### Production database state

Post-deployment catalog verification:

```text
operator_allowlist table                 absent
public policy references                 0
public function references               0
public view references                   0
active team_members                      3
team_members.user_id foreign key         auth.users(id) ON DELETE CASCADE
```

## Security-advisor review

Security advisors were re-run after closeout. No allowlist-related regression was reported.

Existing findings remain outside this retirement issue:

- RLS-with-no-policy INFO on server/RPC-owned tables;
- generic warnings for authenticated SECURITY DEFINER Operator RPCs, which remain acceptable only where the function re-checks membership/role as defined in `docs/SECURITY.md`;
- Supabase Leaked Password Protection remains platform-configuration debt before the operational pilot.

These were deliberately not changed as part of the allowlist retirement.

## Acceptance boundary

This closeout proves that the retired membership authority is absent from current application runtime and production execution, and that future active-runtime reintroduction is regression-gated.

It does **not** replace M7's operational Auth-mail acceptance. A real invitation delivery/password-recovery test remains part of the custom-SMTP/pilot readiness gate because triggering external Auth e-mail is a separate business/platform acceptance concern, not evidence that the old membership table is retired.

## Final invariant

```text
auth.uid()
→ active team_members
→ role-aware RLS / RPC / server capability
```

No current SolidDesign runtime may restore `operator_allowlist` as a membership authority or compatibility dependency.
