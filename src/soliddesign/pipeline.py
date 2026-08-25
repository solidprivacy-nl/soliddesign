from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .audit.adapter import load_fixture_audit
from .audit.report import render_technical_report_html, render_technical_report_markdown
from .brief import build_conversion_brief
from .demo.openpage import build_site_config, render_static_html
from .design import derive_design_profile
from .models import AuditResult, FactorScore, Prospect, QualificationInput
from .print_pack.renderer import render_print_pack, write_print_pack
from .qualification import qualify
from .verified_facts import build_verified_facts


def prospect_from_dict(data: dict) -> Prospect:
    return Prospect(**{**data, "observed_services": tuple(data.get("observed_services") or []), "brand_colors": tuple(data.get("brand_colors") or []), "approved_claims": tuple(data.get("approved_claims") or [])})


def qualification_input_from_dict(score_data: dict) -> QualificationInput:
    return QualificationInput(
        customer_economics=_factor("customer_economics", score_data),
        existing_demand=_factor("existing_demand", score_data),
        conversion_opportunity=_factor("conversion_opportunity", score_data),
        execution_fit=_factor("execution_fit", score_data),
        competitive_context=_factor("competitive_context", score_data),
        hard_gates=dict(score_data.get("hard_gates") or {}),
    )


def run_component_spike(
    prospect: Prospect,
    audit: AuditResult,
    qualification_input: QualificationInput,
    output_dir: str | Path,
    *,
    preview_url: str,
    raw_audit: dict[str, Any] | None = None,
) -> dict:
    """Assemble the complete internal pre-sale proof for one reviewed prospect."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    qualification = qualify(qualification_input)
    if not qualification.eligible:
        raise RuntimeError(f"Prospect is not eligible for demo production: {qualification.to_dict()}")

    facts = build_verified_facts(prospect, audit)
    brief = build_conversion_brief(facts, audit)
    design_profile = derive_design_profile(facts, brief)
    site_config = build_site_config(facts, brief, design_profile=design_profile)
    preview_html = render_static_html(site_config, prospect_name=prospect.name)
    pack_html = render_print_pack(prospect, audit, brief, site_config, preview_url=preview_url)
    technical_md = render_technical_report_markdown(
        prospect,
        audit,
        qualification,
        raw_audit=raw_audit,
    )
    technical_html = render_technical_report_html(
        technical_md,
        title=f"Technisch websiterapport — {prospect.name}",
    )

    artifacts = {
        "prospect": prospect.to_dict(),
        "audit": audit.to_dict(),
        "qualification": qualification.to_dict(),
        "verified_facts": facts.to_dict(),
        "conversion_brief": brief.to_dict(),
        "design_profile": design_profile.to_dict(),
        "site_config": site_config.to_dict(),
    }
    (out / "pipeline.json").write_text(json.dumps(artifacts, indent=2, ensure_ascii=False), encoding="utf-8")
    (out / "site_config.json").write_text(site_config.to_json(), encoding="utf-8")
    (out / "design_profile.json").write_text(json.dumps(design_profile.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
    (out / "preview.html").write_text(preview_html, encoding="utf-8")
    (out / "technical_report.md").write_text(technical_md, encoding="utf-8")
    (out / "technical_report.html").write_text(technical_html, encoding="utf-8")
    write_print_pack(out / "print_pack.html", pack_html)
    return {
        "output_dir": str(out),
        "qualification_score": qualification.total_score,
        "preview": str(out / "preview.html"),
        "print_pack": str(out / "print_pack.html"),
        "technical_report": str(out / "technical_report.md"),
    }


def run_golden_fixture(fixture_dir: str | Path, output_dir: str | Path, *, preview_url: str = "https://preview.example.invalid/p/golden") -> dict:
    fixture = Path(fixture_dir)
    prospect = prospect_from_dict(json.loads((fixture / "prospect.json").read_text(encoding="utf-8")))
    raw_audit = json.loads((fixture / "audit.json").read_text(encoding="utf-8"))
    audit = load_fixture_audit(fixture / "audit.json")
    q_input = qualification_input_from_dict(json.loads((fixture / "score.json").read_text(encoding="utf-8")))
    return run_component_spike(prospect, audit, q_input, output_dir, preview_url=preview_url, raw_audit=raw_audit)


def _factor(name: str, score_data: dict) -> FactorScore:
    raw = score_data["factors"][name]
    return FactorScore(name=name, score=int(raw["score"]), evidence=tuple(raw.get("evidence") or []))
