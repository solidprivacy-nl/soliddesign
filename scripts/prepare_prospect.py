#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from soliddesign.audit.adapter import audit_result_from_dict, run_pitch_doctor
from soliddesign.pipeline import prospect_from_dict
from soliddesign.preparation import classify_site_kind, linkhub_audit, prepare_first_concept

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://grderdhnjkeucaaehgqy.supabase.co").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
PREVIEW_GATEWAY = f"{SUPABASE_URL}/functions/v1/mockup-preview"


def _headers(*, content_type: str = "application/json", prefer: str | None = None) -> dict[str, str]:
    if not SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": content_type,
        "Accept": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _request(path: str, *, method: str = "GET", data=None, content_type: str = "application/json", prefer: str | None = None):
    url = f"{SUPABASE_URL}{path}"
    body = None
    if data is not None:
        body = data if isinstance(data, (bytes, bytearray)) else json.dumps(data, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(url, data=body, method=method, headers=_headers(content_type=content_type, prefer=prefer))
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = response.read()
            if not payload:
                return None
            if "application/json" in (response.headers.get("Content-Type") or ""):
                return json.loads(payload.decode("utf-8"))
            return payload
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[-1200:]
        raise RuntimeError(f"Supabase request failed ({error.code}): {detail}") from error


def _validate_id(value: str) -> str:
    return str(uuid.UUID(str(value)))


def _fetch_prospect(prospect_id: str) -> dict:
    select = (
        "id,name,category,city,address,website_url,phone,rating,review_count,place_id,"
        "discovery_source,discovery_version,source_confidence,operating_status,qualification,state"
    )
    path = f"/rest/v1/prospects?id=eq.{urllib.parse.quote(prospect_id)}&select={urllib.parse.quote(select, safe=',')}"
    rows = _request(path) or []
    if len(rows) != 1:
        raise RuntimeError("Prospect not found")
    return rows[0]


def _prospect_model(row: dict):
    return prospect_from_dict({
        "id": row["id"],
        "name": row.get("name") or "Prospect",
        "category": row.get("category") or "dienstverlening",
        "city": row.get("city") or "",
        "address": row.get("address") or "",
        "website_url": row.get("website_url") or "",
        "phone": row.get("phone"),
        "rating": float(row["rating"]) if row.get("rating") is not None else None,
        "review_count": row.get("review_count"),
        "place_id": row.get("place_id"),
        "discovery_source": row.get("discovery_source") or "manual",
        "discovery_version": row.get("discovery_version"),
        "source_confidence": row.get("source_confidence"),
        "operating_status": row.get("operating_status"),
        "observed_services": [],
        "brand_colors": [],
        "approved_claims": [],
    })


def _latest_audit(prospect_id: str) -> dict | None:
    select = "id,source,source_version,score,grade,findings,technical_report_html,technical_report_md,created_at"
    path = (
        f"/rest/v1/audits?prospect_id=eq.{urllib.parse.quote(prospect_id)}"
        f"&select={urllib.parse.quote(select, safe=',')}&order=created_at.desc&limit=1"
    )
    rows = _request(path) or []
    return rows[0] if rows else None


def _latest_demo(prospect_id: str) -> dict | None:
    select = "id,status,artifact_path,preview_url,created_at"
    path = (
        f"/rest/v1/demos?prospect_id=eq.{urllib.parse.quote(prospect_id)}"
        f"&select={urllib.parse.quote(select, safe=',')}&order=created_at.desc&limit=1"
    )
    rows = _request(path) or []
    return rows[0] if rows else None


def _status_payload(row: dict, status: str, **extra) -> dict:
    qualification = dict(row.get("qualification") or {})
    preparation = dict(qualification.get("preparation") or {})
    preparation.update({"status": status, **extra})
    qualification["preparation"] = preparation
    qualification["stage"] = "first_concept_ready" if status == "COMPLETE" else "first_concept_preparation"
    return qualification


def _patch_prospect(prospect_id: str, payload: dict) -> None:
    _request(
        f"/rest/v1/prospects?id=eq.{urllib.parse.quote(prospect_id)}",
        method="PATCH",
        data=payload,
        prefer="return=minimal",
    )


def mark_status(prospect_id: str, status: str, **extra) -> None:
    row = _fetch_prospect(prospect_id)
    _patch_prospect(prospect_id, {"qualification": _status_payload(row, status, **extra)})


def _audit_from_row(row: dict, website_url: str):
    return audit_result_from_dict({
        "url": website_url,
        "score": row.get("score"),
        "grade": row.get("grade"),
        "findings": row.get("findings") or [],
        "source": row.get("source") or "stored-audit",
    })


def _insert_audit(prospect_id: str, result: dict) -> None:
    audit = result["audit"]
    _request(
        "/rest/v1/audits",
        method="POST",
        data={
            "prospect_id": prospect_id,
            "source": audit.get("source") or "first-concept",
            "source_version": "first-concept-v1",
            "score": audit.get("score"),
            "grade": audit.get("grade"),
            "findings": audit.get("findings") or [],
            "technical_report_html": result["technical_report_html"],
            "technical_report_md": result["technical_report_md"],
        },
        prefer="return=minimal",
    )


def _upload_preview(artifact_path: str, html: str) -> None:
    object_path = urllib.parse.quote(f"{artifact_path}/index.html", safe="/")
    url = f"{SUPABASE_URL}/storage/v1/object/mockup-sites/{object_path}"
    headers = _headers(content_type="text/html; charset=utf-8")
    headers["x-upsert"] = "true"
    request = urllib.request.Request(url, data=html.encode("utf-8"), method="POST", headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[-1200:]
        raise RuntimeError(f"Preview upload failed ({error.code}): {detail}") from error


def _insert_demo(prospect_id: str, result: dict) -> str:
    demo_id = str(uuid.uuid4())
    artifact_path = f"versions/{prospect_id}/{demo_id}"
    _upload_preview(artifact_path, result["preview_html"])

    site_config = dict(result["site_config"])
    site_config["_operator"] = {
        "stable_live": True,
        "source": "automatic_baseline",
        "site_kind": result["site_kind"],
    }
    preview_url = f"{PREVIEW_GATEWAY}/v/{prospect_id}/{demo_id}/"
    _request(
        "/rest/v1/demos",
        method="POST",
        data={
            "id": demo_id,
            "prospect_id": prospect_id,
            "site_config": site_config,
            "preview_url": preview_url,
            "status": "LIVE",
            "artifact_path": artifact_path,
            "version_note": "Automatische eerste mock-up",
        },
        prefer="return=minimal",
    )
    return demo_id


def run(prospect_id: str) -> None:
    row = _fetch_prospect(prospect_id)
    if row.get("state") in {"DISCOVERED", "DISQUALIFIED"}:
        raise RuntimeError("Prospect must be promoted before preparation")

    prospect = _prospect_model(row)
    site_kind = classify_site_kind(prospect.website_url)
    mark_status(prospect_id, "RUNNING", site_kind=site_kind)

    existing_audit = _latest_audit(prospect_id)
    existing_demo = _latest_demo(prospect_id)
    if existing_audit and existing_demo:
        _patch_prospect(prospect_id, {
            "state": "DEMO_READY",
            "qualification": _status_payload(_fetch_prospect(prospect_id), "COMPLETE", site_kind=site_kind),
        })
        print(json.dumps({"status": "unchanged", "site_kind": site_kind}))
        return

    raw_audit = None
    if existing_audit:
        audit = _audit_from_row(existing_audit, prospect.website_url)
    elif site_kind == "LINKHUB":
        audit = linkhub_audit(prospect)
    else:
        with tempfile.TemporaryDirectory(prefix="soliddesign-first-concept-") as tmp:
            raw_path = Path(tmp) / "raw_audit.json"
            audit = run_pitch_doctor(prospect, raw_json_out=raw_path)
            raw_audit = json.loads(raw_path.read_text(encoding="utf-8")) if raw_path.exists() else None

    with tempfile.TemporaryDirectory(prefix="soliddesign-first-concept-output-") as out:
        result = prepare_first_concept(
            prospect,
            out,
            audit=audit,
            raw_audit=raw_audit,
        )

    if not existing_audit:
        _insert_audit(prospect_id, result)
    if not existing_demo:
        _insert_demo(prospect_id, result)

    current = _fetch_prospect(prospect_id)
    _patch_prospect(prospect_id, {
        "verified_facts": result["verified_facts"],
        "state": "DEMO_READY",
        "qualification": _status_payload(
            current,
            "COMPLETE",
            site_kind=site_kind,
            audit_source=result["audit"].get("source"),
        ),
    })
    print(json.dumps({"status": "complete", "site_kind": site_kind}))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("prospect_id")
    parser.add_argument("--classify", action="store_true")
    parser.add_argument("--mark-failed", action="store_true")
    parser.add_argument("--error", default="Voorbereiding mislukt.")
    args = parser.parse_args()
    prospect_id = _validate_id(args.prospect_id)

    if args.mark_failed:
        mark_status(prospect_id, "FAILED", error=str(args.error)[:400])
        return 0

    row = _fetch_prospect(prospect_id)
    site_kind = classify_site_kind(row.get("website_url") or "")
    if args.classify:
        print(site_kind)
        return 0

    try:
        run(prospect_id)
    except Exception as error:
        try:
            mark_status(prospect_id, "FAILED", error=str(error)[:400], site_kind=site_kind)
        except Exception:
            pass
        raise
    return 0


if __name__ == "__main__":
    sys.exit(main())
