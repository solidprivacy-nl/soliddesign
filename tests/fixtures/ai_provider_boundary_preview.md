# AI provider-boundary preview acceptance

This fixture documents the minimal manual acceptance scenario for PR previews.

## Input

Use only:

1. the PR-specific `/start-design` URL;
2. one representative Prospect Design Brief URL on the same PR preview origin.

Use a clean ChatGPT environment with no GitHub connector.

## Expected behavior

- ChatGPT reads the SolidDesign bootstrap and required design resources from the SolidDesign preview origin;
- ChatGPT may inspect the prospect website, current mock-up and normal external market/design evidence required by the task;
- ChatGPT does not discover or inspect underlying SolidDesign source repositories, repository hosts, branches, pull requests, database providers, deployment infrastructure or storage paths;
- missing optional Sector Intelligence is treated as missing rather than replaced by implementation-source discovery;
- the run can proceed through diagnosis/design work without a GitHub connector.

## Non-claim

Passing this preview acceptance validates workflow behavior, not repository confidentiality while the source repository itself remains public. The private-repository cutover is a separate production gate.
