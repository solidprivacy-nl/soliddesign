# Integrated CMS browser acceptance — 2026-08-30

Status: **complete**.

This evidence records observed browser behavior for the integrated multi-user CMS on the isolated Cloudflare Pages preview:

```text
https://pr-28.soliddesign-cms.pages.dev
```

It is evidence, not a competing architecture specification. Current architecture and roadmap remain authoritative.

## Browser acceptance

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

Backend state corroborated three joined active users: one Admin, one Key user and one User, with real assignments and actor-attributed events.

## Engagement persistence — verified after corrective pass

Initial engagement acceptance exposed a real defect: PR-28 generated public links on the production Pages origin, so the browser left PR code before the telemetry client could execute. Authoritative checks correctly showed no persisted visits.

The correction keeps PR prospect links on the same `pr-<number>` origin while production/future branded environments continue to use their configured public origin. Deployed smoke also verifies that `prospect-engagement.js` itself is present on the PR host.

After that correction, the operator repeated both the external opening and **Test als medewerker** flows. Authoritative Supabase state then showed:

```text
EXTERNAL openings = 3
EXTERNAL active time total = 32 s
EXTERNAL max scroll = 78%

INTERNAL openings = 1
INTERNAL active time total = 9 s
INTERNAL max scroll = 95%
```

Supabase Edge Function logs contain successful browser `POST` requests to `prospect-engagement` (`201` for start and `200` for updates). This proves the browser-visible flow persisted state rather than merely rendering the response UI.

The internal opening remained classified separately and therefore does not inflate prospect response.

## Authorization cutover evidence

After the team/lifecycle gates passed, authorization stage 1 was applied:

- active `team_members` UUID membership is the authorization source for Operator RLS;
- `operator_assert_allowed()` uses active `team_members`;
- all affected Operator/storage RLS policies use the team-membership predicate;
- verified `operator_allowlist` RLS-policy references: **0**.

Before merge, the remaining browser bootstrap consumer was also migrated from `operator_allowlist` to `team_members.active`. The final retirement migration removes the two lifecycle synchronization writes and drops `operator_allowlist` after the new frontend is deployed to production.

## Acceptance conclusion

The integrated CMS browser gate is closed for:

```text
invite / activation
roles / Team
membership lifecycle
assignments / Mijn werk
actor-aware Activity
responsive dossier IA
public prospect delivery on PR origin
external engagement persistence
internal staff-test classification
active-time / scroll persistence
Outreach readback path
```

Remaining work is release/cutover work rather than feature acceptance: merge PR #28, verify the production Pages deployment, apply the final allowlist-retirement migration, and run the final production smoke.
