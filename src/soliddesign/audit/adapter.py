from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from ..models import AuditFinding, AuditResult, Prospect
from ..security import validate_public_http_url


class AuditAdapterError(RuntimeError):
    pass


def load_fixture_audit(path: str | Path) -> AuditResult:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return normalize_pitch_doctor_json(data, source="fixture")


def run_pitch_doctor(
    prospect: Prospect,
    *,
    command: str | None = None,
    raw_json_out: str | Path | None = None,
) -> AuditResult:
    """Run Pitch Doctor through its stable CLI/JSON boundary.

    When ``raw_json_out`` is provided, the donor JSON is preserved byte-for-meaning
    as formatted JSON before normalization. The normalized ``AuditResult`` remains
    the downstream contract.
    """
    validate_public_http_url(prospect.website_url)
    executable = command or os.getenv("PITCH_DOCTOR_COMMAND", "pitch-doctor")
    if shutil.which(executable) is None and not Path(executable).exists():
        raise AuditAdapterError(
            f"Pitch Doctor command not found: {executable}. "
            "Run scripts/bootstrap_donors.sh or set PITCH_DOCTOR_COMMAND."
        )

    with tempfile.TemporaryDirectory(prefix="soliddesign-audit-") as tmp:
        out = Path(tmp)
        args = [
            executable,
            "scan",
            prospect.website_url,
            "--business-name",
            prospect.name,
            "--city",
            prospect.city or "Nederland",
            "--lang",
            "en",
            "--out",
            str(out),
            "--json",
        ]
        proc = subprocess.run(args, capture_output=True, text=True, timeout=180)
        if proc.returncode != 0:
            raise AuditAdapterError(
                f"Pitch Doctor failed ({proc.returncode}): {proc.stderr[-1000:]}"
            )

        json_files = sorted(
            out.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True
        )
        html_files = sorted(
            out.glob("*.html"), key=lambda p: p.stat().st_mtime, reverse=True
        )
        if not json_files:
            raise AuditAdapterError("Pitch Doctor produced no JSON report")

        data = json.loads(json_files[0].read_text(encoding="utf-8"))
        if raw_json_out is not None:
            raw_path = Path(raw_json_out)
            raw_path.parent.mkdir(parents=True, exist_ok=True)
            raw_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )

        result = normalize_pitch_doctor_json(data, source="pitch-doctor")
        screenshot = _first_embedded_image(html_files[0]) if html_files else None
        return AuditResult(
            url=result.url,
            score=result.score,
            grade=result.grade,
            findings=result.findings,
            current_screenshot_data_uri=screenshot,
            source=result.source,
        )


def audit_result_from_dict(data: dict[str, Any], *, source: str | None = None) -> AuditResult:
    """Load SolidDesign normalized audit JSON, with Pitch Doctor JSON compatibility."""
    if "findings" not in data:
        return normalize_pitch_doctor_json(data, source=source or "pitch-doctor-json")

    findings: list[AuditFinding] = []
    for finding in data.get("findings", []):
        evidence_raw = finding.get("evidence") or []
        if isinstance(evidence_raw, str):
            evidence_raw = [evidence_raw]
        findings.append(
            AuditFinding(
                key=str(finding.get("key") or "unknown"),
                severity=str(finding.get("severity") or "warning"),
                title=str(finding.get("title") or finding.get("key") or "Finding"),
                evidence=tuple(str(x) for x in evidence_raw),
                business_impact=str(finding.get("business_impact") or ""),
                recommendation=str(finding.get("recommendation") or ""),
                verified=bool(finding.get("verified", True)),
            )
        )
    return AuditResult(
        url=str(data.get("url") or ""),
        score=_int_or_none(data.get("score")),
        grade=str(data.get("grade")) if data.get("grade") is not None else None,
        findings=tuple(findings),
        current_screenshot_data_uri=data.get("current_screenshot_data_uri"),
        source=source or str(data.get("source") or "json"),
    )


def normalize_pitch_doctor_json(data: dict[str, Any], *, source: str) -> AuditResult:
    findings: list[AuditFinding] = []
    for check in data.get("checks", []):
        if check.get("not_applicable"):
            continue
        evidence_raw = check.get("evidence") or []
        if isinstance(evidence_raw, str):
            evidence_raw = [evidence_raw]
        findings.append(
            AuditFinding(
                key=str(check.get("id") or "unknown"),
                severity=str(check.get("severity") or "warning"),
                title=str(check.get("name") or check.get("id") or "Finding"),
                evidence=tuple(str(x) for x in evidence_raw),
                business_impact=str(check.get("impact") or ""),
                recommendation=str(check.get("recommendation") or ""),
                verified=True,
            )
        )
    return AuditResult(
        url=str(data.get("url") or ""),
        score=_int_or_none(data.get("score")),
        grade=str(data.get("grade")) if data.get("grade") is not None else None,
        findings=tuple(findings),
        current_screenshot_data_uri=data.get("current_screenshot_data_uri"),
        source=source,
    )


def _first_embedded_image(path: Path) -> str | None:
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(
        r"data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+",
        text,
    )
    return match.group(0) if match else None


def _int_or_none(value: Any) -> int | None:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None
