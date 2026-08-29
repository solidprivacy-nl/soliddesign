# Supabase — database source of truth

## Canonical database definition

SolidDesign has one database-evolution model:

```text
supabase/schema.sql        = original bootstrap baseline
supabase/migrations/*.sql  = ordered canonical evolution after that baseline

bootstrap baseline
→ ordered migrations
→ current production schema
```

`supabase/schema.sql` predates the integrated multi-user/public-delivery rollout. It is retained as the bootstrap needed before the current migration chain; it is **not** a second current schema specification and must not be manually kept in lockstep with every later migration.

The migrations are the only canonical source for changes made after the bootstrap baseline.

Do not implement a database change by editing only `schema.sql`.

## Fresh environment

Until a deliberately consolidated replacement baseline is created and proven necessary, a fresh SolidDesign database is built by:

1. applying `supabase/schema.sql` once as the historical bootstrap baseline;
2. replaying the ordered files in `supabase/migrations/`;
3. applying the normal Supabase/Auth/Storage runtime configuration that is not represented as table DDL;
4. verifying CI/runtime/security gates.

Do not treat `schema.sql` alone as current production and do not invent a second manually synchronized “current schema” file.

## Change rule

For every database contract change:

1. create one small idempotent migration where practical;
2. apply it through the normal Supabase migration path;
3. update code/tests/current documentation that rely on the changed contract;
4. run security advisors after auth/RLS/grant/function changes;
5. verify runtime behavior before marking the roadmap gate complete.

Prefer one migration that expresses the actual contract change over parallel schema copies that must be manually synchronized.

## Access model

- browser clients use the Supabase publishable key;
- grants determine which database objects/columns a role can reach;
- RLS determines which rows are visible/modifiable;
- narrow `SECURITY DEFINER` RPCs are used only when the function itself performs explicit authorization checks;
- service/secret credentials stay server-side;
- public prospect resolution exposes only the minimum resolver columns required by the current public contract.

## Edge Functions

`supabase/functions/` contains server capabilities such as team invitations and public prospect engagement.

Browser-called Edge Functions must implement explicit CORS/preflight handling and must still perform their own authentication/authorization where required.

## Consolidation rule

Creating a new consolidated bootstrap is allowed only when fresh-environment setup becomes an observed maintenance problem. Until then, the existing baseline + migration chain is simpler, auditable and sufficient.
