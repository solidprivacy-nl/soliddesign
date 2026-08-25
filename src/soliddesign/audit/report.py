from __future__ import annotations

from html import escape
from typing import Any

from ..models import AuditResult, Prospect, QualificationResult


def render_technical_report_markdown(
    prospect: Prospect,
    audit: AuditResult,
    qualification: QualificationResult,
    *,
    raw_audit: dict[str, Any] | None = None,
) -> str:
    lines = [
        f"# Technisch websiterapport — {prospect.name}",
        "",
        "> Intern technisch dossier. Gebruik prospect-facing claims pas na menselijke review.",
        "",
        "## Samenvatting",
        "",
        f"- Website: {audit.url or prospect.website_url}",
        f"- Technische auditscore: {_score(audit.score)}",
        f"- Auditgrade: {audit.grade or 'n.v.t.'}",
        f"- Kwalificatiescore: {qualification.total_score}/{qualification.max_score}",
        f"- Reviewed bevindingen: {len(audit.findings)}",
        "",
        "## Reviewed technische bevindingen",
        "",
    ]

    if not audit.findings:
        lines.append("Geen reviewed bevindingen vastgelegd.")
    for index, finding in enumerate(audit.findings, start=1):
        lines.extend(
            [
                f"### {index}. {finding.title}",
                "",
                f"- Key: `{finding.key}`",
                f"- Severity: **{finding.severity.upper()}**",
                f"- Verified: {'ja' if finding.verified else 'nee'}",
                "",
                "**Technisch bewijs**",
                "",
            ]
        )
        if finding.evidence:
            lines.extend(f"- {item}" for item in finding.evidence)
        else:
            lines.append("- Geen afzonderlijk bewijs vastgelegd.")
        lines.extend(
            [
                "",
                "**Business impact**",
                "",
                finding.business_impact or "Niet afzonderlijk vastgelegd.",
                "",
                "**Aanbevolen correctie**",
                "",
                finding.recommendation or "Niet afzonderlijk vastgelegd.",
                "",
            ]
        )

    lines.extend(["## Commerciële kwalificatie", ""])
    for factor in qualification.factors:
        lines.append(f"### {factor.name.replace('_', ' ').title()} — {factor.score}/5")
        lines.append("")
        if factor.evidence:
            lines.extend(f"- {item}" for item in factor.evidence)
        else:
            lines.append("- Geen bewijs vastgelegd.")
        lines.append("")

    lines.extend(
        [
            "## Raw donor scan",
            "",
            "Deze appendix bevat de onbewerkte technische checks van de donor. Een raw check is **geen automatische prospect-facing claim**: blokkades zoals bereikbaarheid kunnen vervolgchecks laten cascaderen.",
            "",
        ]
    )
    checks = list((raw_audit or {}).get("checks") or [])
    if not checks:
        lines.append("Geen raw donor scan aan dit rapport gekoppeld.")
    else:
        lines.append(f"Raw checks: {len(checks)}")
        lines.append("")
        for index, check in enumerate(checks, start=1):
            if check.get("not_applicable"):
                status = "NOT_APPLICABLE"
            else:
                status = str(check.get("severity") or "unknown").upper()
            lines.extend(
                [
                    f"### Raw {index}. {check.get('name') or check.get('id') or 'Onbekende check'}",
                    "",
                    f"- ID: `{check.get('id') or 'unknown'}`",
                    f"- Status: **{status}**",
                ]
            )
            evidence = check.get("evidence") or []
            if isinstance(evidence, str):
                evidence = [evidence]
            for item in evidence:
                lines.append(f"- Evidence: {item}")
            if check.get("impact"):
                lines.append(f"- Impact: {check['impact']}")
            if check.get("recommendation"):
                lines.append(f"- Recommendation: {check['recommendation']}")
            lines.append("")

    lines.extend(
        [
            "## Gebruik bij prospectcontact",
            "",
            "Gebruik primair de **reviewed technische bevindingen**. De raw appendix is bedoeld voor verdieping en traceerbaarheid. Vertaal technische termen naar klanttaal zonder de betekenis of ernst te vergroten.",
            "",
        ]
    )
    return "\n".join(lines)


def render_technical_report_html(markdown_report: str, *, title: str) -> str:
    """Print-friendly HTML wrapper that preserves the editable Markdown source verbatim."""
    return f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>{escape(title)}</title>
<style>
body{{font-family:Arial,sans-serif;max-width:920px;margin:40px auto;padding:0 24px;color:#18211d;line-height:1.55}}
pre{{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;background:#f6f5f1;padding:24px;border:1px solid #ddd9cf}}
@media print{{body{{margin:0;max-width:none}}pre{{border:0;padding:0;background:white}}}}
</style>
</head>
<body>
<pre>{escape(markdown_report)}</pre>
</body>
</html>
"""


def _score(value: int | None) -> str:
    return f"{value}/100" if value is not None else "n.v.t."
