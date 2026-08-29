# Supabase — database source of truth

## Canonical database definition

The ordered files in `supabase/migrations/` are the **only canonical schema-evolution source** for the current SolidDesign database.

```text
bootstrap baseline
→ ordered migrations
→ current production schema
```

`supabase/schema.sql` predates the integrated multi-user/public-delivery rollout. It is retained only as the original bootstrap snapshot and is **not** a second current schema specification.

Do not implement a database change by editing only `schema.sql`.

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

## Historical bootstrap snapshot

`schema.sql` may be useful when reading the original Phase-1 bootstrap architecture. If a fresh environment needs to be created, use the migration chain rather than assuming the snapshot represents current production.
