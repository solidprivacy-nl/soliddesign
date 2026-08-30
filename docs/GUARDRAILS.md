# Guardrails

These guardrails are mandatory. They are designed to prevent both greenfield overengineering and import-overengineering.

## 1. Solid but simple

A new service, queue, agent, database table, framework, provider or abstraction must solve a concrete observed problem.

Before adding a component, answer:

1. What real customer/operator failure or bottleneck exists?
2. What is the smallest correct fix?
3. Can an existing component or platform capability solve it without importing unrelated complexity?
4. What ongoing maintenance/security cost does the new component add?
5. Can it be removed later without rewriting the business model?

If these questions cannot be answered, do not add the component.

## 2. Customer value and lowest total change win

Technology is a means to a commercial/customer outcome. Do not optimize for technical novelty, architectural symmetry or feature count.

For each capability compare:

```text
FULL ADOPTION
vs
COMPOSE / SUBSYSTEM REUSE
vs
THIN BUILD
```

Evaluate:

- customer/operator value;
- semantic fit;
- modules changed;
- dependencies;
- secrets/providers;
- setup complexity;
- security surface;
- testability;
- human repair time;
- exit cost.

The route with the lowest total cost to trustworthy customer/commercial learning wins.

## 3. Functions before agents

Examples that remain deterministic functions/capabilities:

- score a prospect;
- validate a URL;
- query a discovery provider;
- resolve a public prospect slug;
- render/serve a static preview;
- generate a QR code;
- persist state;
- run deterministic audit checks.

AI may assist with:

- interpreting audit evidence;
- creating a conversion brief;
- generating constrained demo content;
- sector research;
- drafting human-reviewed sales communication.

A multi-step autonomous agent is allowed only after a deterministic function/workflow is demonstrably insufficient.

## 4. One representation and one state plane per concern

Do not maintain parallel business identities, user models, demo lifecycles or analytics stores.

Current examples:

- `team_members` is the durable membership/role model; `operator_allowlist` is rollout compatibility only;
- `prospects.public_slug` is the public prospect identity; full hostnames are configuration;
- one DRAFT/LIVE demo lifecycle is authoritative;
- `prospect_visits` is the engagement state; do not add a second analytics database.

Production website delivery remains deliberately separate from the pre-sale proof until paying-customer requirements justify a production stack.

## 5. No speculative platform work

Until a measured need exists, do not build:

- generic job queues;
- SSE/realtime dashboarding;
- custom permission/RBAC framework beyond the current small roles/responsibilities;
- per-dossier ACL builder;
- MCP server merely for architectural elegance;
- autonomous mailbox processing;
- multi-provider agent routing;
- elaborate event sourcing;
- generalized external preview proxy;
- second public application or second operational database.

## 6. Human gates

Human approval is required before:

- selecting a prospect for paid/expensive demo work;
- promoting a mock-up to LIVE;
- printing/mailing external material;
- sending any commercial message;
- making a proposal;
- launching a customer production site.

Automation may prepare evidence and recommendations but must not silently cross these boundaries.

## 7. Public repository discipline

This repository can be public. Never commit:

- API keys or tokens;
- Supabase secret/service-role keys;
- real prospect/customer personal data;
- private e-mail content;
- proprietary prompt bundles intended to stay private;
- licensed assets without redistribution rights.

If the opportunity model or prompt layer becomes proprietary, move it behind a private-core boundary rather than leaking it here.

## 8. Documentation is part of the architecture

Current architecture/security/operations documents must describe current intended behavior. Historical evidence and completed implementation plans may preserve earlier states, but must be clearly marked as historical when those states are superseded.

When changing a core contract, update or supersede every current document that would otherwise point future work in a conflicting direction. Do not leave contradictory descriptions merely because the code currently works.

See `docs/ARCHITECTURE.md` for documentation precedence.
