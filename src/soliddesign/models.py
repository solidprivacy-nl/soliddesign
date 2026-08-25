from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class Prospect:
    id: str
    name: str
    category: str
    city: str
    address: str
    website_url: str
    phone: str | None = None
    rating: float | None = None
    review_count: int | None = None
    place_id: str | None = None
    observed_services: tuple[str, ...] = ()
    brand_colors: tuple[str, ...] = ()
    approved_claims: tuple[str, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        for key in ("observed_services", "brand_colors", "approved_claims"):
            data[key] = list(data[key])
        return data


@dataclass(frozen=True)
class AuditFinding:
    key: str
    severity: str
    title: str
    evidence: tuple[str, ...]
    business_impact: str
    recommendation: str = ""
    verified: bool = True

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["evidence"] = list(self.evidence)
        return data


@dataclass(frozen=True)
class AuditResult:
    url: str
    score: int | None
    grade: str | None
    findings: tuple[AuditFinding, ...]
    current_screenshot_data_uri: str | None = None
    source: str = "fixture"

    def to_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "score": self.score,
            "grade": self.grade,
            "findings": [f.to_dict() for f in self.findings],
            "current_screenshot_data_uri": self.current_screenshot_data_uri,
            "source": self.source,
        }


@dataclass(frozen=True)
class FactorScore:
    name: str
    score: int
    evidence: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.score < 0 or self.score > 5:
            raise ValueError(f"{self.name} must be scored 0..5")

    def to_dict(self) -> dict[str, Any]:
        return {"name": self.name, "score": self.score, "evidence": list(self.evidence)}


@dataclass(frozen=True)
class QualificationInput:
    customer_economics: FactorScore
    existing_demand: FactorScore
    conversion_opportunity: FactorScore
    execution_fit: FactorScore
    competitive_context: FactorScore
    hard_gates: dict[str, bool] = field(default_factory=dict)

    @property
    def factors(self) -> tuple[FactorScore, ...]:
        return (
            self.customer_economics,
            self.existing_demand,
            self.conversion_opportunity,
            self.execution_fit,
            self.competitive_context,
        )


@dataclass(frozen=True)
class QualificationResult:
    eligible: bool
    total_score: int
    max_score: int
    failed_gates: tuple[str, ...]
    factors: tuple[FactorScore, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "eligible": self.eligible,
            "total_score": self.total_score,
            "max_score": self.max_score,
            "failed_gates": list(self.failed_gates),
            "factors": [f.to_dict() for f in self.factors],
        }


@dataclass(frozen=True)
class VerifiedFacts:
    company_name: str
    category: str
    city: str
    address: str
    website_url: str
    phone: str | None
    rating: float | None
    review_count: int | None
    services: tuple[str, ...]
    brand_colors: tuple[str, ...]
    approved_claims: tuple[str, ...]
    evidence: dict[str, str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "company_name": self.company_name,
            "category": self.category,
            "city": self.city,
            "address": self.address,
            "website_url": self.website_url,
            "phone": self.phone,
            "rating": self.rating,
            "review_count": self.review_count,
            "services": list(self.services),
            "brand_colors": list(self.brand_colors),
            "approved_claims": list(self.approved_claims),
            "evidence": dict(self.evidence),
        }


@dataclass(frozen=True)
class ConversionBrief:
    headline: str
    subheadline: str
    primary_cta: str
    primary_cta_url: str
    opportunities: tuple[str, ...]
    trust_points: tuple[str, ...]
    sections: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        for key in ("opportunities", "trust_points", "sections"):
            data[key] = list(data[key])
        return data
