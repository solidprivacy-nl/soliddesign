from __future__ import annotations

from .models import AuditResult, Prospect, VerifiedFacts


def build_verified_facts(prospect: Prospect, audit: AuditResult) -> VerifiedFacts:
    if audit.url != prospect.website_url:
        raise ValueError("Audit URL must match the prospect's verified website URL")

    discovery_label = prospect.discovery_source or "manual"
    if prospect.discovery_version:
        discovery_label = f"{discovery_label} {prospect.discovery_version}"

    website_evidence = (
        "verified discovery URL; classified as linkhub, not a standalone prospect website"
        if audit.source == "linkhub-presence"
        else "verified prospect website URL"
    )

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
            "identity": f"structured discovery record ({discovery_label})",
            "website": website_evidence,
            "source_confidence": (
                f"source existence confidence={prospect.source_confidence}"
                if prospect.source_confidence is not None
                else "not supplied"
            ),
            "operating_status": prospect.operating_status or "not supplied",
            "rating": "structured enrichment data" if prospect.rating is not None else "not observed",
            "review_count": "structured enrichment data" if prospect.review_count is not None else "not observed",
            "services": "human/source-verified services" if prospect.observed_services else "not yet verified",
            "audit": f"normalized audit from {audit.source}",
        },
    )
