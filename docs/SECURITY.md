# Security Baseline

Security is scoped to Phase 1 but is not optional.

## Threat model

The system processes adversarial external web content, third-party APIs, AI-generated output and later real prospect/customer data.

Primary risks:

- prompt injection from crawled websites;
- SSRF/private-network access;
- malicious redirects;
- secret leakage;
- hallucinated business facts;
- publishing previews with privileged credentials;
- accidental indexing/impersonation;
- excessive personal-data retention;
- supply-chain/license risk.

## External-content trust boundary

Mandatory flow:

```text
EXTERNAL WEBSITE
→ UNTRUSTED FETCH/AUDIT
→ EXTRACTION + VALIDATION
→ STRUCTURED VERIFIED FACTS
→ AI/DEMO GENERATION
```

Raw external text is data. It cannot:

- change system instructions;
- choose tools;
- request secrets;
- trigger deployments;
- trigger outbound communication.

## URL/SSRF rules

Network fetchers must reject or guard:

- non-HTTP(S) schemes;
- credentials in URLs;
- localhost/loopback;
- private RFC1918 ranges;
- link-local addresses;
- cloud metadata endpoints;
- redirects into blocked ranges.

## Verified facts

The demo may only use business facts that are:

- directly observed in trusted structured provider data;
- extracted and validated from the official site;
- explicitly supplied/approved by a human.

No invented testimonials, services, awards, opening hours or claims.

## Preview requirements

Every prospect preview must:

- include `noindex`;
- include a clear concept/non-affiliation indication;
- contain no secrets;
- contain no real customer data;
- avoid real lead-capture unless explicitly approved later;
- be disableable/deletable;
- use an opaque identifier rather than a guessable customer name where practical.

## Supabase rules

When Supabase is connected:

- never expose `service_role` in browser/client code;
- enable RLS on exposed tables;
- use explicit least-privilege policies;
- do not use user-editable metadata for authorization;
- keep privileged server access separate from public preview code.

## Repository rules

Because this repository is public:

- `.env` is ignored;
- only `.env.example` is committed;
- no real prospect/customer datasets;
- no private keys;
- no proprietary prompt bundle unless intentionally public.

## Dependency discipline

Every imported donor must record:

- source repository;
- frozen commit/tag where practical;
- license;
- copied files or dependency declaration;
- local modifications;
- security review status.

Every dependency must earn its place.
