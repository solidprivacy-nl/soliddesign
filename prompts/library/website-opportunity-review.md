---
title: "Website Opportunity Review"
category: "Prospect"
description: "Beoordeel een geselecteerde prospectsite business-first en lever een kleine, evidence-backed lijst websitekansen op voor Design en Print."
invocation: {"intro":"Lees en volg deze SolidDesign-prompt volledig:","fields":[{"key":"prospect_name","label":"Prospect","control":"text","placeholder":"Bedrijfsnaam","required":true},{"key":"website_url","label":"Website","control":"url","placeholder":"https://bedrijf.nl","required":true},{"key":"source_audit_id","label":"Bron-audit ID","control":"text","placeholder":"UUID uit SolidDesign","required":true},{"key":"audit_evidence","label":"Beschikbare audit-evidence","control":"textarea","placeholder":"Door SolidDesign aangeleverde audit-evidence","required":false},{"key":"operator_focus","label":"Aanvullende focus","control":"textarea","placeholder":"Optioneel","required":false}]}
---

# SolidDesign Website Opportunity Review

**Method version:** 5.1 / 2026-09-13  
**Architecture role:** human-reviewed commercial interpretation between website evidence and prospect-specific Design/Print.

## Objective

Inspect the actual website of the supplied prospect and identify the **small number of evidenced website opportunities that materially matter to the prospect, the redesign and the outbound conversation**.

This is not a second technical audit and not a scorecard. The supplied audit evidence is supporting evidence; it does not limit what you may directly verify on the actual website.

Decision hierarchy:

```text
actual website evidence
→ visitor/customer relevance
→ materiality
→ realistic improvement direction
→ usefulness for prospect-specific redesign and outreach
```

## Evidence discipline

You MUST inspect the actual website URL supplied in the invocation.

Use the supplied audit evidence where useful, but distinguish clearly between:

- directly observed website facts;
- supplied technical evidence;
- reasonable interpretation.

Never invent or imply unsupported facts about:

- traffic;
- rankings;
- lead volume;
- conversion rate;
- revenue or revenue loss;
- customer behaviour that was not observed;
- certifications, reviews, guarantees or business facts not verified;
- performance measurements you did not actually run.

Phrase impact proportionately. Prefer:

> “Dit maakt de vervolgstap minder duidelijk.”

over:

> “Dit kost omzet.”

unless the stronger claim is actually evidenced.

## What to consider

Only where evidence supports it, consider:

- first-screen clarity;
- primary CTA / contact route;
- conversion friction;
- trust visibility;
- proposition and service hierarchy;
- navigation and information architecture;
- mobile usability when actually inspected;
- content currency;
- local/search presentation visible from the site or verified search evidence;
- accessibility issues that can be directly observed or measured;
- performance issues that can be directly observed or measured;
- obvious credibility friction;
- mismatch between the apparent business proposition and how the current website presents it.

Do not create generic filler findings merely because a checklist category exists.

## Finding quality contract

A finding belongs in the result only when it is:

1. **Website-specific** — based on something actually observed for this prospect.
2. **Evidenced** — the observation can be pointed to concretely.
3. **Understandable** — a non-technical owner can understand it.
4. **Material** — important enough to affect Design or the prospect conversation.
5. **Actionable** — there is a realistic website improvement direction.
6. **Proportionate** — the wording does not claim more than the evidence supports.

There is no minimum number of findings.

Return at most **5 findings**. If only 2 are strong, return 2. If no material finding can be supported, return an empty findings array.

The array order is the business priority. Do not add a score, severity, rank field, confidence formula or OP identifier.

## Output contract

Return **only valid JSON**. No Markdown fences, prose before/after, headings or comments.

Use the supplied `Bron-audit ID` exactly as `source_audit_id`.

Exact shape:

```json
{
  "source_audit_id": "uuid-from-input",
  "findings": [
    {
      "key": "primary_cta",
      "title": "De vervolgstap is niet direct duidelijk",
      "evidence": [
        "In het eerste scherm ontbreekt een duidelijke primaire contactactie."
      ],
      "business_impact": "Een geïnteresseerde bezoeker moet zelf zoeken wat de logische volgende stap is.",
      "recommendation": "Maak één primaire contact- of offerteactie direct zichtbaar."
    }
  ]
}
```

Contract rules:

- `key`: lowercase semantic identifier using only `a-z`, `0-9`, `_` or `-`; maximum 63 characters;
- `title`: concise owner-readable statement; maximum 160 characters;
- `evidence`: 1–5 concrete evidence strings for every finding;
- `business_impact`: plain-language, proportionate explanation;
- `recommendation`: direction of improvement, not a prescriptive full design specification;
- no extra fields;
- preserve priority through array order.

## Relationship to Design

The review identifies **what matters first and why**. It does not prescribe the final visual solution.

Design should later receive the prioritized title + observed evidence and remain responsible for solving the visual/UX problem using the canonical SolidDesign design method.

## Relationship to technical audit

Do not rewrite technical severity into business priority.

A technical warning may be commercially minor. A visually obvious trust or CTA problem may be commercially important even when a technical scanner does not report it.

The Website Opportunity Review is therefore a reviewed interpretation layer, not a replacement for the technical evidence record.
