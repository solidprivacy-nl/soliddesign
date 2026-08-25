# Implementation Plan — Component Spike

## Goal

Prove one golden prospect can move through the complete internal pre-sale pipeline without relying on a large platform.

## Vertical slice

```text
fixture prospect
→ qualification
→ normalized audit
→ verified facts
→ conversion brief
→ OpenPage-compatible SiteConfig
→ deterministic HTML preview
→ print-pack HTML
```

Then layer live integrations independently:

```text
Google Places
Pitch Doctor live audit
Supabase
Cloudflare static publishing
```

## Repository modules

```text
src/soliddesign/
├── models.py
├── states.py
├── qualification.py
├── verified_facts.py
├── brief.py
├── discovery/
│   └── google_places.py
├── audit/
│   └── adapter.py
├── demo/
│   ├── schema.py
│   └── renderer.py
├── print_pack/
│   └── renderer.py
├── storage/
│   └── supabase.py
└── cli.py
```

## Definition of done for component spike

- `python -m soliddesign.cli golden` succeeds without network credentials;
- deterministic fixture produces a score and decision;
- verified-facts object contains only approved structured facts;
- demo config validates;
- preview HTML contains `noindex` and concept banner;
- print-pack HTML is generated;
- tests cover scoring, trust boundary, preview and print pack;
- CI executes tests.

## Live-integration definition of done

- scoped Google Places key can discover one candidate;
- Pitch Doctor adapter can audit one real URL;
- Supabase migration and RLS are reviewed before live data use;
- Cloudflare preview deployment is provider-specific only at the final static-publish step.
