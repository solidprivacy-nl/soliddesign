# Integrated CMS browser acceptance — 2026-08-30

Status: **partial acceptance complete; engagement persistence re-test pending**.

This evidence records observed browser behavior for the integrated multi-user CMS on the isolated Cloudflare Pages preview:

```text
https://pr-28.soliddesign-cms.pages.dev
```

It is evidence, not a competing architecture specification. Current architecture and roadmap remain authoritative.

## Verified in browser

The operator confirmed the following flows work in the PR-28 environment:

1. **Team/work distribution**
   - assignments can be distributed across real team users;
   - `Mijn werk` reflects assigned work;
   - prospect dossier navigation and Activity behave as intended.

2. **Team lifecycle**
   - human-readable display names/initials are usable;
   - name correction and member lifecycle actions behave as intended;
   - deactivate/reactivate and safe-delete behavior were exercised through the UI.

3. **Information architecture / narrow layout**
   - `Mijn werk`, `Prospects`, `Bedrijven zoeken` and role-dependent `Team` are usable;
   - dossier phases `Overzicht | Design | Outreach | Activiteit` are usable;
   - narrow/mobile behavior was accepted in-browser.

4. **Invite and activation**
   - controlled User invite from visibly marked PR-28;
   - Supabase invite delivery;
   - activation returns to PR-28;
   - mandatory password setup;
   - normal signed-in workspace;
   - `team_members.active = true` and `joined_at` set only after activation.

Backend state after acceptance corroborated three joined active users: one Admin, one Key user and one User, with real assignments and actor-attributed events.

## Engagement discrepancy found during evidence review

The operator initially reported the engagement workflow as working in the browser. Authoritative persistence checks showed:

```text
prospect_visits EXTERNAL = 0
prospect_visits INTERNAL = 0
```

and Supabase Edge Function logs showed only deployment-smoke `OPTIONS` requests, with no browser `POST` to `prospect-engagement`.

Root cause: PR-28 CMS generated public prospect links using the configured production `publicProspectOrigin`. Therefore the browser left PR-28 and opened the production Pages host, which does not yet contain the integration branch's telemetry runtime.

Correction:

- PR preview CMS instances now generate prospect links on their own `pr-<number>.soliddesign-cms.pages.dev` origin;
- non-PR environments continue to use the configured public origin, preserving the future `<brand>.nl` model;
- deployed smoke now verifies that `prospect-engagement.js` itself is present on the PR host, not only that the injected HTML references it.

Corrective commit path passed CI and deployed Pages smoke.

**Engagement remains unverified until a post-fix browser opening creates persisted EXTERNAL and INTERNAL rows and Outreach reads those rows back correctly.**

## Authorization cutover evidence

After the browser team/lifecycle gates passed, authorization stage 1 was applied:

- active `team_members` UUID membership is now the authorization source for Operator RLS;
- `operator_assert_allowed()` uses active `team_members`;
- all affected public/storage RLS policies use `operator_is_active_team_member()`;
- verified `operator_allowlist` RLS-policy references: **0**.

`operator_allowlist` remains temporarily only as a compatibility bridge for the still-live pre-merge production frontend bootstrap and two lifecycle sync functions. It is no longer an authorization source. Remove that bridge only after the new frontend is deployed to production and passes its production smoke.

## Remaining acceptance item

One targeted engagement persistence re-test on PR-28:

```text
external prospect opening on pr-28
→ prospect-engagement start/update POST
→ EXTERNAL prospect_visits row

Test als medewerker on pr-28
→ signed internal token
→ prospect-engagement start/update POST
→ INTERNAL prospect_visits row

Outreach refresh
→ persisted metrics shown correctly
```

Only after this evidence exists should M5/M6 be marked browser-verified.
