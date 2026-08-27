# Discovery sector resolution

Status: canonical v0.1

## Decision

SolidDesign accepts free Dutch or English business-sector input in Operator Discovery, but Overture Maps remains the taxonomy authority used for the actual place query.

The resolver is deliberately small:

```text
human input
   ↓
known local mapping?
   ├─ yes → Overture code
   └─ no  → Workers AI proposes up to 3 codes
                     ↓
             validate against official
             Overture Places taxonomy
                     ↓
          valid code → Overture query
          no valid code → explicit error
```

## First-principles rationale

The discovery problem is not translation by itself. A literal English translation can still be an invalid Overture category. The real contract is:

> map human search intent to an existing Overture Places category before querying Overture.

Therefore:

- GitHub is source of truth for implementation and the small deterministic fast-path registry;
- Overture Maps is source of truth for valid discovery category codes;
- Workers AI is only a proposal mechanism for unknown free-text terms;
- AI is never allowed to create a category that bypasses Overture validation;
- an unresolved term is an input-resolution failure, not a zero-result discovery run.

## Runtime

The implementation lives inside the existing Cloudflare Pages Operator. No separate service, queue, agent, scheduler or prompt-management layer is introduced.

- `operator/discovery-sectors.js`
  - resolves common known terms locally;
  - sends only unknown terms to `/api/resolve-sector`;
  - preserves the human-entered text in the UI.
- `operator/functions/api/resolve-sector.js`
  - requires the existing authenticated Operator session;
  - uses the Cloudflare Workers AI `AI` binding;
  - uses `@cf/meta/llama-3.1-8b-instruct-fast` with structured JSON output;
  - validates every proposed code against the official Overture Places category CSV;
  - returns only validated codes.
- `operator/wrangler.jsonc`
  - defines the Workers AI binding in the existing Pages project.

## Deterministic fast path

Common, proven terms may remain in the small local registry, for example:

```text
stukadoor  → plasterer
bakker     → bakery
loodgieter → plumber
```

This registry is a latency/cost optimization, not the boundary of what users may search for.

Do not grow it into a comprehensive Dutch occupations taxonomy. Add mappings only when they are repeatedly useful or when a resolver result needs a deliberate deterministic override.

## Failure behaviour

Never silently return `0 gevonden` when the sector itself could not be resolved.

Correct outcomes are:

1. valid sector + zero Overture places → `0 gevonden` is a valid discovery result;
2. unknown sector successfully resolved and validated → run Overture normally;
3. AI unavailable → explicit resolver-unavailable error;
4. AI proposes no valid Overture code → explicit unresolved-sector error;
5. Overture taxonomy unavailable → explicit upstream taxonomy error.

## Security and scope

- The browser never receives a Cloudflare API token.
- Workers AI is accessed through a Pages binding, not a client-side credential.
- The endpoint is authenticated through the same Supabase session pattern as the other Operator intake endpoints.
- User input is bounded to at most 12 terms of 80 characters each.
- The model receives only the sector terms, not prospect/customer records.
- The official taxonomy is fetched read-only and cached at the Cloudflare edge for one day.

## Architecture rules

This implementation must continue to obey:

1. **solid but simple** — one fallback endpoint in the existing runtime;
2. **no overengineering** — no vector DB, translation service, taxonomy database, agent or orchestration workflow;
3. **first principles** — validate the actual Overture contract rather than assuming an English translation is sufficient;
4. **use proven solutions** — Cloudflare Pages/Workers AI bindings and Overture's published taxonomy are reused instead of recreated.

## External authoritative references

- Overture Maps Places schema/categories: https://docs.overturemaps.org/schema/reference/places/place/
- Overture category source: https://github.com/OvertureMaps/schema/blob/main/docs/schema/concepts/by-theme/places/overture_categories.csv
- Cloudflare Pages bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Cloudflare Workers AI JSON mode: https://developers.cloudflare.com/workers-ai/features/json-mode/
