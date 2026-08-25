# Third-Party Notices

SolidDesign reuses external software through bounded dependencies/adapters. No complete third-party source tree is vendored into this repository.

## Pitch Doctor

Repository: https://github.com/NezbiT/pitch-doctor  
Reviewed revision: `ab5858c5ba620fccde1fa2fd35e2c2ca86d37a42`  
License: MIT

SolidDesign invokes Pitch Doctor externally through its CLI/JSON contract. Pitch Doctor source is not vendored here. Optional local donor checkout is created under ignored `.vendor/` by `scripts/bootstrap_donors.sh`.

## OpenPage

Repository: https://github.com/buildingopen/openpage  
Reviewed revision: `9818eb43a88e01b23cb55752e19902d8285a853b`  
License: MIT

SolidDesign's `SiteConfig` shape and block vocabulary are intentionally compatible with the reviewed OpenPage public interfaces. OpenPage source is not vendored into SolidDesign. An optional ignored checkout is used for visual-editor compatibility testing.

## Automated Agentic AI Web Agency

Repository: https://github.com/JackInSightsV2/Automated-Agentic-AI-Web-Agency  
Reviewed revision: `56a02463316527542f01ba5ca405445319b43204`  
License: MIT

The small Google Places discovery adapter was independently adapted from the useful API pattern/field selection in this project. Its larger agentic runtime, UK verifier and automated outbound stack are not incorporated.

## Segno

Package: `segno==1.6.6`  
Purpose: QR generation in print packs.  
License: BSD-3-Clause according to the package distribution metadata/project documentation.

## Rules

1. A README badge is not sufficient provenance; inspect the actual license file.
2. Record source revision for donor code/patterns where practical.
3. Do not copy proprietary code.
4. Do not assume a root project license covers unrelated bundled assets/plugins.
5. Record generated-asset rights separately when applicable.
6. Re-check this file when donor revisions or runtime dependencies change.
