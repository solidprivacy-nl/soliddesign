from __future__ import annotations

from .models import QualificationInput, QualificationResult

DEFAULT_MIN_SCORE = 17


def qualify(data: QualificationInput, min_score: int = DEFAULT_MIN_SCORE) -> QualificationResult:
    failed = tuple(name for name, passed in data.hard_gates.items() if not passed)
    total = sum(f.score for f in data.factors)
    return QualificationResult(
        eligible=(not failed and total >= min_score),
        total_score=total,
        max_score=25,
        failed_gates=failed,
        factors=data.factors,
    )
