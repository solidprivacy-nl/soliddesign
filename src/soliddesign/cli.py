from __future__ import annotations

import argparse
import json
from pathlib import Path

from .audit.adapter import audit_result_from_dict, run_pitch_doctor
from .discovery.overture import parse_bbox, search_businesses
from .pipeline import prospect_from_dict, qualification_input_from_dict, run_component_spike, run_golden_fixture


def _read_json(path: str | Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(prog="soliddesign")
    sub = parser.add_subparsers(dest="command", required=True)

    golden = sub.add_parser("golden", help="Run the offline golden-prospect component spike")
    golden.add_argument("--fixtures", default="tests/fixtures/golden")
    golden.add_argument("--out", default="artifacts/golden")
    golden.add_argument("--preview-url", default="https://preview.example.invalid/p/golden")

    discover = sub.add_parser(
        "discover",
        help="Search Overture Maps Places for businesses with existing websites",
    )
    discover.add_argument(
        "--bbox",
        required=True,
        help="west,south,east,north coordinates, matching Overture's bbox order",
    )
    discover.add_argument(
        "--category",
        action="append",
        default=[],
        help="Overture basic_category/taxonomy label; repeat for OR matching",
    )
    discover.add_argument("--name", help="Optional case-insensitive business-name substring")
    discover.add_argument("--limit", type=int, default=50)
    discover.add_argument("--release", help="Optional pinned Overture release, e.g. 2026-07-22.0")
    discover.add_argument("--out")

    audit = sub.add_parser("audit", help="Run the guarded Pitch Doctor adapter for one prospect JSON file")
    audit.add_argument("prospect")
    audit.add_argument("--out", required=True)
    audit.add_argument("--raw-out", help="Optional raw donor JSON path; defaults to raw_audit.json next to --out")

    assemble = sub.add_parser("assemble", help="Build preview, print pack and technical report from reviewed prospect/audit/score JSON files")
    assemble.add_argument("--prospect", required=True)
    assemble.add_argument("--audit", required=True)
    assemble.add_argument("--raw-audit", help="Optional raw donor JSON; defaults to raw_audit.json next to --audit when present")
    assemble.add_argument("--score", required=True)
    assemble.add_argument("--out", required=True)
    assemble.add_argument("--preview-url", required=True)

    args = parser.parse_args()
    if args.command == "golden":
        print(json.dumps(run_golden_fixture(args.fixtures, args.out, preview_url=args.preview_url), indent=2))
        return
    if args.command == "discover":
        bbox = parse_bbox(args.bbox)
        results = [
            p.to_dict()
            for p in search_businesses(
                bbox,
                categories=args.category,
                name_contains=args.name,
                limit=args.limit,
                release=args.release,
            )
        ]
        text = json.dumps(results, indent=2, ensure_ascii=False)
        if args.out:
            Path(args.out).write_text(text, encoding="utf-8")
        print(text)
        return
    if args.command == "audit":
        prospect = prospect_from_dict(_read_json(args.prospect))
        out_path = Path(args.out)
        raw_path = Path(args.raw_out) if args.raw_out else out_path.with_name("raw_audit.json")
        result = run_pitch_doctor(prospect, raw_json_out=raw_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(result.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")
        print(json.dumps({"audit": str(out_path), "raw_audit": str(raw_path)}, indent=2))
        return
    if args.command == "assemble":
        prospect = prospect_from_dict(_read_json(args.prospect))
        audit_result = audit_result_from_dict(_read_json(args.audit))
        q_input = qualification_input_from_dict(_read_json(args.score))
        raw_path = Path(args.raw_audit) if args.raw_audit else Path(args.audit).with_name("raw_audit.json")
        raw_audit = _read_json(raw_path) if raw_path.exists() else None
        print(
            json.dumps(
                run_component_spike(
                    prospect,
                    audit_result,
                    q_input,
                    args.out,
                    preview_url=args.preview_url,
                    raw_audit=raw_audit,
                ),
                indent=2,
            )
        )


if __name__ == "__main__":
    main()
