# Guardrails

These guardrails are mandatory. They are designed to prevent both greenfield overengineering and import-overengineering.

## 1. Solid but simple

A new service, queue, agent, database table, framework, provider or abstraction must solve a concrete observed problem.

Before adding a component, answer:

1. What real failure or bottleneck exists?
2. What is the smallest fix?
3. Can an existing component solve it without importing unrelated complexity?
4. What ongoing maintenance/security cost does the new component add?
5. Can it be removed later without rewriting the business model?

If these questions cannot be answered, do not add the component.

## 2. Lowest total change wins

For each capability compare:

```text
FULL ADOPTION
vs
COMPOSE / SUBSYSTEM REUSE
vs
THIN BUILD
```

Evaluate:

- semantic fit;
- modules changed;
- modules disabled;
- dependencies;
- secrets/providers;
- setup complexity;
- security surface;
- testability;
- human repair time;
- exit cost.

The route with the lowest total cost to trustworthy learning wins.

## 3. Functions before agents

Examples that remain functions:

- score a prospect;
- validate a URL;
- call Google Places;
- render a static preview;
- generate a QR code;
- persist state;
- run deterministic audit checks.

AI may assist with:

- interpreting audit evidence;
- creating a conversion brief;
- generating constrained demo content;
- drafting human-reviewed sales communication.

A multi-step autonomous agent is allowed only after a deterministic function is demonstrably insufficient.

## 4. One representation per phase

Do not maintain two demo-builder stacks in parallel.

Phase 1 tests a single pre-sale representation. Production delivery remains deliberately separate until a paying customer teaches us what is required.

## 5. No speculative platform work

Until a measured need exists, do not build:

- generic job queues;
- SSE/realtime dashboarding;
- operator RBAC fabric;
- MCP server;
- Cloudflare capability Worker;
- autonomous mailbox processing;
- multi-provider agent routing;
- elaborate event sourcing.

## 6. Human gates

Human approval is required before:

- selecting a prospect for paid/expensive demo work;
- publishing a prospect preview;
- printing/mailing external material;
- sending any commercial message;
- making a proposal;
- launching a customer production site.

## 7. Public repository discipline

This repository is public. Never commit:

- API keys or tokens;
- Supabase service-role keys;
- real prospect/customer personal data;
- private e-mail content;
- proprietary prompt bundles intended to stay private;
- licensed assets without redistribution rights.

If the opportunity model or prompt layer becomes proprietary, move it behind a private-core boundary rather than leaking it here.
