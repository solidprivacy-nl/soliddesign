from __future__ import annotations

from .models import AuditResult, ConversionBrief, VerifiedFacts

_SEVERITY_ORDER = {"critical": 0, "warning": 1, "ok": 2}


def build_conversion_brief(facts: VerifiedFacts, audit: AuditResult) -> ConversionBrief:
    ranked = sorted(
        (f for f in audit.findings if f.verified and f.severity != "ok"),
        key=lambda f: (_SEVERITY_ORDER.get(f.severity, 9), f.key),
    )
    opportunities = tuple(
        _plain_opportunity(f.title, f.business_impact) for f in ranked[:3]
    )

    service = facts.services[0] if facts.services else facts.category
    if facts.city:
        headline = f"{facts.company_name}. {service} in {facts.city}."
    else:
        headline = f"{facts.company_name}. {service}."
    subheadline = (
        "Een helder overzicht van de dienstverlening en een directe route naar contact "
        "voor uw project of vraag."
    )

    if facts.phone:
        primary_cta = "Bel direct"
        primary_cta_url = f"tel:{facts.phone.replace(' ', '')}"
    else:
        primary_cta = "Neem contact op"
        primary_cta_url = "#contact"

    trust_points: list[str] = []
    if facts.rating is not None and facts.review_count is not None:
        trust_points.append(
            f"{facts.rating:.1f}/5 op basis van {facts.review_count} Google-beoordelingen"
        )
    trust_points.extend(facts.approved_claims[:2])

    return ConversionBrief(
        headline=headline,
        subheadline=subheadline,
        primary_cta=primary_cta,
        primary_cta_url=primary_cta_url,
        opportunities=opportunities,
        trust_points=tuple(trust_points),
        sections=("hero", "services", "trust", "contact"),
    )


def _plain_opportunity(title: str, impact: str) -> str:
    impact = " ".join(impact.split())
    return f"{title}: {impact}" if impact else title
