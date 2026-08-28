#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from soliddesign.audit.adapter import audit_result_from_dict, run_pitch_doctor
from soliddesign.pipeline import prospect_from_dict
from soliddesign.preparation import classify_site_kind, linkhub_audit, prepare_first_concept

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://grderdhnjkeucaaehgqy.supabase.co").rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh")
PREPARATION_TOKEN = os.getenv("PREPARATION_TOKEN", "")
GATEWAY_URL = f"{SUPABASE_URL}/functions/v1/prospect-preparation"


def _validate_id(value: str) -> str:
    return str(uuid.UUID(str(value)))


def _gateway(prospect_id: str, action: str, **payload):
    if len(PREPARATION_TOKEN) < 32:
        raise RuntimeError("PREPARATION_TOKEN is not configured")
    body = json.dumps({
        "action": action,
        "prospect_id": prospect_id,
        "token": PREPARATION_TOKEN,
        **payload,
    }, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        GATEWAY_URL,
        data=body,
        method="POST",
        headers={
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Authorization": f"Bearer {SUPABASE_PUBLISHABLE_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[-1200:]
        raise RuntimeError(f"Preparation gateway failed ({error.code}): {detail}") from error


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


def _audit_from_input(row: dict | None, website_url: str):
    if not row:
        return None
    return audit_result_from_dict({
        "url": website_url,
        "score": row.get("score"),
        "grade": row.get("grade"),
        "findings": row.get("findings") or [],
        "source": row.get("source") or "stored-audit",
    })


def _load_input(prospect_id: str, path: str | None):
    if path:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    return _gateway(prospect_id, "input")


def run(prospect_id: str, input_payload: dict) -> None:
    if input_payload.get("already_complete"):
        print(json.dumps({"status": "unchanged"}))
        return

    prospect_row = input_payload.get("prospect") or {}
    prospect = _prospect_model(prospect_row)
    site_kind = classify_site_kind(prospect.website_url)
    audit = _audit_from_input(input_payload.get("existing_audit"), prospect.website_url)
    raw_audit = None

    if audit is None and site_kind == "LINKHUB":
        audit = linkhub_audit(prospect)
    elif audit is None:
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

    response = _gateway(
        prospect_id,
        "complete",
        demo_id=str(uuid.uuid4()),
        site_kind=result["site_kind"],
        audit=result["audit"],
        verified_facts=result["verified_facts"],
        site_config=result["site_config"],
        preview_html=result["preview_html"],
        technical_report_md=result["technical_report_md"],
        technical_report_html=result["technical_report_html"],
    )
    print(json.dumps(response, ensure_ascii=False))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("prospect_id")
    parser.add_argument("--classify", action="store_true")
    parser.add_argument("--input")
    parser.add_argument("--input-out")
    parser.add_argument("--mark-failed", action="store_true")
    parser.add_argument("--error", default="Voorbereiding mislukt.")
    args = parser.parse_args()
    prospect_id = _validate_id(args.prospect_id)

    if args.mark_failed:
        _gateway(prospect_id, "fail", error=str(args.error)[:400])
        return 0

    payload = _load_input(prospect_id, args.input)
    if args.input_out:
        Path(args.input_out).write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    if args.classify:
        if payload.get("already_complete"):
            print("COMPLETE")
        else:
            print(classify_site_kind((payload.get("prospect") or {}).get("website_url") or ""))
        return 0

    try:
        run(prospect_id, payload)
    except Exception as error:
        try:
            _gateway(prospect_id, "fail", error=str(error)[:400])
        except Exception:
            pass
        raise
    return 0


if __name__ == "__main__":
    sys.exit(main())
