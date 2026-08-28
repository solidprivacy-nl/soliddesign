from __future__ import annotations

from html import escape
from pathlib import Path
from urllib.parse import urlparse

from .audit.adapter import run_pitch_doctor
from .brief import build_conversion_brief
from .demo.openpage import build_site_config, render_static_html
from .design import derive_design_profile
from .models import AuditFinding, AuditResult, Prospect
from .verified_facts import build_verified_facts

LINKHUB_HOSTS = {
    "linktr.ee",
    "beacons.ai",
    "bio.link",
    "linkin.bio",
    "solo.to",
    "campsite.bio",
    "hoo.be",
    "lnk.bio",
    "taplink.cc",
}


def classify_site_kind(url: str) -> str:
    host = (urlparse(url).hostname or "").lower().removeprefix("www.")
    if any(host == candidate or host.endswith(f".{candidate}") for candidate in LINKHUB_HOSTS):
        return "LINKHUB"
    return "STANDALONE"


def linkhub_audit(prospect: Prospect) -> AuditResult:
    host = (urlparse(prospect.website_url).hostname or prospect.website_url).lower()
    finding = AuditFinding(
        key="no_standalone_website",
        severity="warning",
        title="Geen zelfstandige website gevonden",
        evidence=(
            f"De gevonden online aanwezigheid gebruikt {host}.",
            "Een linkhub is een doorverwijspagina en geen zelfstandige bedrijfswebsite.",
        ),
        business_impact=(
            "De onderneming heeft weinig eigen ruimte voor positionering, diensten, vertrouwen, lokale vindbaarheid en een samenhangende conversieroute."
        ),
        recommendation=(
            "Gebruik de bestaande linkhub en boekingslinks als bron voor bereikbaarheid, maar ontwerp een zelfstandige compacte website als primaire digitale bestemming."
        ),
        verified=True,
    )
    return AuditResult(
        url=prospect.website_url,
        score=None,
        grade=None,
        findings=(finding,),
        source="linkhub-presence",
    )


def prepare_first_concept(
    prospect: Prospect,
    output_dir: str | Path,
    *,
    audit: AuditResult | None = None,
    raw_audit: dict | None = None,
) -> dict:
    """Prepare the first reviewed technical artifact and deterministic baseline mock-up.

    Human promotion into Prospects is the production decision. A full commercial 0–25
    qualification is deliberately not fabricated here. Standalone websites receive the
    existing guarded Pitch Doctor audit; linkhubs receive a narrow presence finding.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    site_kind = classify_site_kind(prospect.website_url)
    reviewed_audit = audit or (
        linkhub_audit(prospect) if site_kind == "LINKHUB" else run_pitch_doctor(prospect)
    )
    facts = build_verified_facts(prospect, reviewed_audit)
    brief = build_conversion_brief(facts, reviewed_audit)
    profile = derive_design_profile(facts, brief)
    site_config = build_site_config(facts, brief, design_profile=profile)
    preview_html = render_static_html(site_config, prospect_name=prospect.name)
    report_md = render_preparation_report_markdown(
        prospect,
        reviewed_audit,
        site_kind=site_kind,
        raw_audit=raw_audit,
    )
    report_html = render_preparation_report_html(
        report_md,
        title=f"Technisch rapport — {prospect.name}",
    )

    (out / "preview.html").write_text(preview_html, encoding="utf-8")
    (out / "technical_report.md").write_text(report_md, encoding="utf-8")
    (out / "technical_report.html").write_text(report_html, encoding="utf-8")

    return {
        "site_kind": site_kind,
        "audit": reviewed_audit.to_dict(),
        "verified_facts": facts.to_dict(),
        "conversion_brief": brief.to_dict(),
        "design_profile": profile.to_dict(),
        "site_config": site_config.to_dict(),
        "preview_html": preview_html,
        "technical_report_md": report_md,
        "technical_report_html": report_html,
    }


def render_preparation_report_markdown(
    prospect: Prospect,
    audit: AuditResult,
    *,
    site_kind: str,
    raw_audit: dict | None = None,
) -> str:
    kind_label = "linkhub / geen zelfstandige website" if site_kind == "LINKHUB" else "zelfstandige website"
    score = f"{audit.score}/100" if audit.score is not None else "n.v.t."
    lines = [
        f"# Technisch rapport — {prospect.name}",
        "",
        "> Intern voorbereidingsdossier. Gebruik prospect-facing claims pas na menselijke review.",
        "",
        "## Samenvatting",
        "",
        f"- Gevonden URL: {prospect.website_url}",
        f"- Type online aanwezigheid: {kind_label}",
        f"- Technische auditscore: {score}",
        f"- Auditgrade: {audit.grade or 'n.v.t.'}",
        "- Commerciële 0–25 kwalificatie: nog niet volledig evidence-reviewed; niet gefabriceerd voor deze eerste conceptvoorbereiding.",
        "",
        "## Reviewed bevindingen",
        "",
    ]

    if not audit.findings:
        lines.append("Geen reviewed bevindingen vastgelegd.")
    for index, finding in enumerate(audit.findings, start=1):
        lines.extend([
            f"### {index}. {finding.title}",
            "",
            f"- Key: `{finding.key}`",
            f"- Severity: **{finding.severity.upper()}**",
            f"- Verified: {'ja' if finding.verified else 'nee'}",
            "",
            "**Bewijs**",
            "",
        ])
        lines.extend(f"- {item}" for item in finding.evidence or ("Geen afzonderlijk bewijs vastgelegd.",))
        lines.extend([
            "",
            "**Business impact**",
            "",
            finding.business_impact or "Niet afzonderlijk vastgelegd.",
            "",
            "**Aanbevolen correctie**",
            "",
            finding.recommendation or "Niet afzonderlijk vastgelegd.",
            "",
        ])

    lines.extend(["## Raw donor scan", ""])
    checks = list((raw_audit or {}).get("checks") or [])
    if site_kind == "LINKHUB":
        lines.append("Niet uitgevoerd: een linkhub wordt bewust niet technisch geaudit alsof dit de zelfstandige website van de prospect is.")
    elif not checks:
        lines.append("Geen raw donor scan aan dit rapport gekoppeld.")
    else:
        lines.append(f"Raw checks: {len(checks)}")
        lines.append("")
        for index, check in enumerate(checks, start=1):
            status = "NOT_APPLICABLE" if check.get("not_applicable") else str(check.get("severity") or "unknown").upper()
            lines.extend([
                f"### Raw {index}. {check.get('name') or check.get('id') or 'Onbekende check'}",
                "",
                f"- ID: `{check.get('id') or 'unknown'}`",
                f"- Status: **{status}**",
            ])
            evidence = check.get("evidence") or []
            if isinstance(evidence, str):
                evidence = [evidence]
            lines.extend(f"- Evidence: {item}" for item in evidence)
            lines.append("")

    lines.extend([
        "## Gebruik bij prospectcontact",
        "",
        "Gebruik alleen de reviewed bevindingen en vergroot de ernst niet. De eerste mock-up is een conceptbewijs en geen officiële website.",
        "",
    ])
    return "\n".join(lines)


def render_preparation_report_html(markdown_report: str, *, title: str) -> str:
    return f"""<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>{escape(title)}</title>
<style>body{{font-family:Arial,sans-serif;max-width:920px;margin:40px auto;padding:0 24px;color:#18211d;line-height:1.55}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;background:#f6f5f1;padding:24px;border:1px solid #ddd9cf}}@media print{{body{{margin:0;max-width:none}}pre{{border:0;padding:0;background:white}}}}</style>
</head><body><pre>{escape(markdown_report)}</pre></body></html>"""
