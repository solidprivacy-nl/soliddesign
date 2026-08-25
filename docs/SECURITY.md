# Security Baseline

Security is scoped to Phase 1 but is not optional.

## Threat model

The system processes third-party place data, adversarial external web content, AI-generated output and later real prospect/customer data.

Primary risks:

- malformed or stale discovery data;
- prompt injection from crawled websites;
- SSRF/private-network access;
- malicious redirects;
- secret leakage;
- hallucinated business facts;
- publishing previews with privileged credentials;
- accidental indexing/impersonation;
- excessive personal-data retention;
- supply-chain/license risk.

## Discovery-data trust boundary

Overture data is useful structured evidence but is still third-party input.

```text
OVERTURE
→ Prospect candidate
→ identity / website validation
→ audit + human review
→ VERIFIED FACTS
```

Never infer from an Overture record that:

- the website definitely belongs to the business;
- the business has high demand;
- contact details are current;
- a high `confidence` value means commercial quality.

`confidence` means confidence that the place exists.

## Overture query safety

The discovery adapter:

- obtains releases only from the official Overture STAC catalog or an explicitly pinned release;
- validates release IDs before interpolating storage paths;
- parameterizes geography/category/name filters;
- queries only the Places dataset;
- does not accept arbitrary S3/Parquet paths from CLI input;
- records source/release provenance.

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

An Overture-provided website URL must pass the same checks as any other external URL.

## Verified facts

The demo may only use business facts that are:

- directly observed in structured provider data and validated where material;
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

The dedicated SolidDesign project is server-only in Phase 1:

- never expose privileged/service secret in browser/client code;
- RLS enabled on Phase-1 tables;
- `anon` and `authenticated` have no table grants;
- privileged server access stays separate from preview code.

## Privacy / prospect data

- minimize personal data;
- prefer business entity/contact data;
- do not publish raw Overture/prospect exports to this public repository;
- do not intentionally harvest private/personal e-mail addresses;
- retain only data required for acquisition/learning.

## Repository rules

Because this repository is public:

- `.env` is ignored;
- only `.env.example` is committed;
- no real prospect/customer datasets;
- no private keys;
- no proprietary prompt bundle unless intentionally public.

## Dependency discipline

Every imported donor/dependency must record:

- source/project;
- frozen commit/tag/version where practical;
- license;
- copied files or dependency declaration;
- local modifications;
- security review status.

Every dependency must earn its place.
