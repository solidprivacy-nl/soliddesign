# Third-Party Notices

SolidDesign reuses external software/data through bounded dependencies/adapters. No complete third-party agency source tree is vendored into this repository.

## Overture Maps data

Source: Overture Maps Foundation  
Documentation: https://docs.overturemaps.org/  
Attribution/licensing: https://docs.overturemaps.org/attribution/

SolidDesign uses the Overture **Places** dataset for Phase-1 business discovery.

Overture Places combines data from multiple sources under permissive licenses, including CDLA Permissive 2.0, Apache 2.0 and CC0 sources as documented by Overture. When Overture-derived data is published/displayed externally, applicable attribution requirements must be followed.

Recommended project-level provenance text:

```text
Data source: Overture Maps Foundation, overturemaps.org
```

Record the Overture release used for commercial experiment batches.

## DuckDB

Package: `duckdb==1.5.5`  
Project: https://duckdb.org/  
Purpose: query Overture cloud-hosted GeoParquet by bounded geography/taxonomy.  
License: MIT (DuckDB Foundation).

## Dukotah/leadgen

Repository: https://github.com/Dukotah/leadgen  
Reviewed revision: `36784ad5125ac51e61741a478d0c7e3877e69d16`  
License: MIT  
Copyright: Copyright (c) 2026 Duke

The Overture/DuckDB bounded-query pattern was reviewed/adapted. SolidDesign does not vendor the leadgen source tree and has modified the pattern for current Overture taxonomy, STAC release selection, existing-website targeting and source provenance.

MIT notice for substantial adapted portions, if any are retained:

```text
MIT License

Copyright (c) 2026 Duke

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Pitch Doctor

Repository: https://github.com/NezbiT/pitch-doctor  
Reviewed revision: `ab5858c5ba620fccde1fa2fd35e2c2ca86d37a42`  
License: MIT

Invoked externally through CLI/JSON. Source is not vendored.

## OpenPage

Repository: https://github.com/buildingopen/openpage  
Reviewed revision: `9818eb43a88e01b23cb55752e19902d8285a853b`  
License: MIT

SolidDesign's SiteConfig shape/block vocabulary is intentionally compatible with reviewed public interfaces. Source is not vendored.

## Automated Agentic AI Web Agency

Repository: https://github.com/JackInSightsV2/Automated-Agentic-AI-Web-Agency  
Reviewed revision: `56a02463316527542f01ba5ca405445319b43204`  
License: MIT

Its Google Places pattern was reviewed during earlier architecture work. Google Places is now optional/non-canonical and the upstream agentic runtime is not incorporated.

## Segno

Package: `segno==1.6.6`  
Purpose: QR generation in print packs.  
License: BSD-3-Clause according to package metadata/project documentation.

## Rules

1. README badges are not sufficient provenance; inspect actual licenses.
2. Record source revision/version where practical.
3. Do not copy proprietary code.
4. Do not assume a root license covers unrelated bundled assets.
5. Record generated-asset rights separately where applicable.
6. Re-check this file when source datasets, donor revisions or dependencies change.
