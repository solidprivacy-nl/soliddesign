# Contributing

## Development rule

Keep changes small and tied to a documented learning or reliability need.

Before introducing a new framework/service/agent, update `docs/DECISIONS.md` with the observed problem and why a smaller solution is insufficient.

## Pull-request expectations

- tests for behavior changes;
- no secrets or real prospect/customer data;
- donor provenance updated when external code is copied;
- security implications considered for network/AI/data changes;
- documentation updated when business semantics change.

## Coding direction

- Python 3.11+ for the thin orchestration/core in the component spike;
- typed dataclasses/Pydantic only when validation value justifies the dependency;
- standard library preferred for small deterministic tasks;
- keep external integrations behind small adapters.
