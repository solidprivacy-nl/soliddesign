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

    headline = _customer_headline(facts)
    subheadline = _customer_subheadline(facts)

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


def _customer_headline(facts: VerifiedFacts) -> str:
    services = [_headline_service_label(s) for s in facts.services if s.strip()]
    if not services:
        services = [_headline_service_label(facts.category)]

    if len(services) >= 2:
        subject = f"{services[0]} en {services[1]}"
    else:
        subject = services[0]

    subject = _sentence_case(subject)
    return f"{subject} in {facts.city}." if facts.city else f"{subject}."


def _customer_subheadline(facts: VerifiedFacts) -> str:
    remaining = [_clean_service(s).lower() for s in facts.services[2:4] if s.strip()]
    if remaining:
        extra = _join_nl(remaining)
        return f"Ook voor {extra}. Neem rechtstreeks contact op voor een vraag of project."
    return "Neem rechtstreeks contact op voor een vraag of project."


def _headline_service_label(value: str) -> str:
    """Short customer-readable label for the hero only; source facts stay unchanged."""
    clean = _clean_service(value).lower()
    if "warmtepomp" in clean:
        return "warmtepompen"
    if "elektrotechn" in clean:
        return "elektrotechniek"
    if "klimaatinstall" in clean:
        return "klimaat"
    if "loodgieter" in clean:
        return "loodgieterswerk"
    if "duurzame woninginstall" in clean:
        return "duurzame installaties"
    return clean


def _clean_service(value: str) -> str:
    return " ".join(value.replace("_", " ").split()).strip(" .")


def _sentence_case(value: str) -> str:
    return value[:1].upper() + value[1:] if value else value


def _join_nl(items: list[str]) -> str:
    if len(items) == 1:
        return items[0]
    return f"{', '.join(items[:-1])} en {items[-1]}"


def _plain_opportunity(title: str, impact: str) -> str:
    impact = " ".join(impact.split())
    return f"{title}: {impact}" if impact else title
