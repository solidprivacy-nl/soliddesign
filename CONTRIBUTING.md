# Contributing

## Development rule

Keep changes small and tied to a documented customer, commercial-learning or reliability need.

Before introducing a new framework, service, agent, datastore, queue or durable state model:

1. identify the observed problem;
2. show why the existing simple path is insufficient;
3. prefer a proven platform capability/standard where it fits;
4. record the decision when it changes architecture.

`ENGINEERING_CONSTITUTION.md` is the top-level standard. Documentation precedence is defined in `docs/ARCHITECTURE.md`.

## Pull-request expectations

- tests for behavior/contract changes;
- no secrets or real prospect/customer data;
- donor provenance updated when external code is copied;
- security implications considered for network/auth/data/AI changes;
- current documentation reconciled when business or architecture semantics change;
- stale current-state descriptions removed or explicitly marked historical;
- runtime verification for Pages Functions, browser CORS/auth flows and other behavior that static tests cannot prove.

## Database changes

Do not maintain parallel current schema definitions.

```text
supabase/schema.sql       = bootstrap baseline
supabase/migrations/*.sql = canonical ordered evolution
```

Every post-bootstrap database change must be expressed as a migration. See `supabase/README.md`.

After auth/RLS/grant/function changes, run the Supabase security advisors and address new warnings or document why an intentional capability is safe.

## Coding direction

- Python 3.11+ for the thin deterministic core/orchestration where Python is already the fit;
- lightweight browser JavaScript and Pages Functions for the existing Operator rather than framework migration without measured need;
- typed validation only where it materially reduces error risk;
- standard library/platform capability preferred for small deterministic tasks;
- external integrations behind small owned contracts;
- functions before agents;
- derived views before duplicate durable state.

## Definition of done

A technical change is not done merely because code exists. It is done when the relevant tests/runtime smoke pass and current documentation no longer points future work toward a conflicting model.
