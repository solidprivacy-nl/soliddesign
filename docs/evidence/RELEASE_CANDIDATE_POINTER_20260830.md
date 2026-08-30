# Release candidate pointer — 2026-08-30

PR #28 completed browser acceptance and all automated gates, but the connected GitHub ready-for-review mutation is unavailable because of a connector GraphQL schema error.

Release must therefore preserve the exact accepted candidate rather than modifying PR #28 through an unsafe workaround.

Accepted candidate before release-branch creation:

```text
feature/integrated-multiuser-foundation
4e2cb90234e843a51b56695305c32cf7a0f68f68
```

Any release PR must be created from the exact current accepted branch head after this evidence commit and must pass its own CI/Pages deployment before merge.
