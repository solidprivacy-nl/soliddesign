from __future__ import annotations

from .models import AuditResult, Prospect, VerifiedFacts


def build_verified_facts(prospect: Prospect, audit: AuditResult) -> VerifiedFacts:
    if audit.url != prospect.website_url:
        raise ValueError("Audit URL must match the prospect's verified website URL")

    return VerifiedFacts(
        company_name=prospect.name,
        category=prospect.category,
        city=prospect.city,
        address=prospect.address,
        website_url=prospect.website_url,
        phone=prospect.phone,
        rating=prospect.rating,
        review_count=prospect.review_count,
        services=prospect.observed_services,
        brand_colors=prospect.brand_colors,
        approved_claims=prospect.approved_claims,
        evidence={
            "identity": "prospect/discovery record",
            "website": "verified prospect website URL",
            "rating": "structured discovery provider data" if prospect.rating is not None else "not observed",
            "review_count": "structured discovery provider data" if prospect.review_count is not None else "not observed",
            "services": "human/source-verified services" if prospect.observed_services else "not yet verified",
            "audit": f"normalized audit from {audit.source}",
        },
    )
