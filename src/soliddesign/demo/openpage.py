from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass
from typing import Any

from ..design import DesignProfile, derive_design_profile
from ..models import ConversionBrief, VerifiedFacts


@dataclass(frozen=True)
class SiteConfig:
    """Small subset-compatible representation of OpenPage SiteConfig."""

    name: str
    blocks: tuple[dict[str, Any], ...]
    theme: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {"name": self.name, "blocks": list(self.blocks), "theme": dict(self.theme)}

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)


def build_site_config(
    facts: VerifiedFacts,
    brief: ConversionBrief,
    *,
    design_profile: DesignProfile | None = None,
) -> SiteConfig:
    profile = design_profile or derive_design_profile(facts, brief)
    trust_items = _trust_items(brief)
    services = tuple(facts.services[:6])

    blocks: list[dict[str, Any]] = [
        {
            "id": "block-navbar-1",
            "type": "navbar",
            "variant": "default",
            "props": {
                "logo": facts.company_name,
                "links": ["Diensten", "Contact"],
                "ctaText": brief.primary_cta,
                "ctaUrl": brief.primary_cta_url,
            },
        },
        {
            "id": "block-hero-1",
            "type": "hero",
            "variant": profile.hero_variant,
            "props": {
                "headline": brief.headline,
                "subheadline": brief.subheadline,
                "primaryCta": brief.primary_cta,
                "primaryCtaUrl": brief.primary_cta_url,
                "services": list(services[:3]),
                "location": facts.city,
            },
        },
    ]

    if trust_items:
        blocks.append(
            {
                "id": "block-proof-1",
                "type": "stats",
                "variant": profile.trust_variant,
                "props": {"items": trust_items},
            }
        )

    if services:
        blocks.append(
            {
                "id": "block-services-1",
                "type": "features",
                "variant": profile.services_variant,
                "props": {
                    "label": "Diensten",
                    "title": "Diensten en werkzaamheden",
                    "intro": "Kies het onderwerp dat past bij uw vraag en neem rechtstreeks contact op.",
                    "items": [
                        {
                            "title": service,
                            "description": _service_description(service),
                        }
                        for service in services
                    ],
                },
            }
        )

    primary_service = services[0] if services else facts.category
    blocks.extend(
        [
            {
                "id": "block-cta-1",
                "type": "cta",
                "variant": profile.cta_variant,
                "props": {
                    "eyebrow": "Rechtstreeks contact",
                    "headline": f"Een vraag over {_clean_service(primary_service)}?",
                    "subheadline": _contact_line(facts),
                    "address": facts.address,
                    "buttonText": brief.primary_cta,
                    "buttonUrl": brief.primary_cta_url,
                },
            },
            {
                "id": "block-footer-1",
                "type": "footer",
                "variant": "minimal",
                "props": {
                    "logo": facts.company_name,
                    "copyright": f"Concept voor {facts.company_name}.",
                },
            },
        ]
    )

    return SiteConfig(
        name=f"{facts.company_name} — concept",
        blocks=tuple(blocks),
        theme={
            **profile.palette,
            "fontSans": profile.font_body,
            "fontDisplay": profile.font_display,
            "radius": profile.radius,
            "designProfile": profile.page_type,
            "tone": profile.tone,
            "mediaStrategy": profile.media_strategy,
            "motionLevel": profile.motion_level,
        },
    )


def render_static_html(config: SiteConfig, *, prospect_name: str) -> str:
    theme = config.theme
    accent = _safe_color(theme.get("accent"), "#315E57")
    ink = _safe_color(theme.get("ink"), "#18201D")
    muted = _safe_color(theme.get("muted"), "#59625C")
    paper = _safe_color(theme.get("paper"), "#FBFAF7")
    surface = _safe_color(theme.get("surface"), "#F1EEE7")
    line = _safe_color(theme.get("line"), "#D9D5CC")
    inverse = _safe_color(theme.get("inverse"), "#F8F6F0")
    font_display = _safe_font(theme.get("fontDisplay"), 'Georgia, "Times New Roman", serif')
    font_body = _safe_font(theme.get("fontSans"), 'system-ui, -apple-system, "Segoe UI", sans-serif')
    radius = _safe_radius(theme.get("radius"), 6)
    rendered = "\n".join(_render_block(block) for block in config.blocks)

    return f"""<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>{html.escape(config.name)}</title>
<style>
:root{{--accent:{accent};--ink:{ink};--muted:{muted};--paper:{paper};--surface:{surface};--line:{line};--inverse:{inverse};--radius:{radius}px;--display:{font_display};--body:{font_body}}}
*{{box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.6}}
a{{color:inherit}}
a:focus-visible{{outline:3px solid var(--accent);outline-offset:3px}}
.wrap{{width:min(1120px,calc(100% - 48px));margin:auto}}
.concept{{background:var(--ink);color:var(--inverse);padding:9px 24px;text-align:center;font-size:12px}}
nav{{display:flex;justify-content:space-between;align-items:center;min-height:82px;border-bottom:1px solid var(--line)}}
.brand{{font-family:var(--display);font-size:21px;font-weight:700;letter-spacing:-.02em}}
.links{{display:flex;gap:24px;align-items:center;color:var(--muted);font-size:14px}}
.links>a:not(.btn){{text-decoration:none}}
.btn{{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;background:var(--accent);color:white;text-decoration:none;font-size:14px;font-weight:750;letter-spacing:.01em;border:1px solid transparent;border-radius:var(--radius)}}
.btn.secondary{{background:transparent;color:var(--ink);border-color:var(--line)}}
.hero{{padding:88px 0 76px;display:grid;grid-template-columns:minmax(0,1.22fr) minmax(280px,.78fr);gap:72px;align-items:center}}
.hero-copy,.service-summary{{min-width:0}}
h1,h2,h3{{font-family:var(--display);font-weight:700;letter-spacing:-.035em}}
h1{{max-width:760px;margin:0 0 24px;font-size:clamp(44px,5.8vw,74px);line-height:1.01;text-wrap:balance;overflow-wrap:break-word;hyphens:auto}}
h2{{margin:0 0 18px;font-size:clamp(34px,4vw,50px);line-height:1.06;text-wrap:balance}}
h3{{margin:0;font-size:23px;line-height:1.18}}
.section-label,.cta-eyebrow{{margin:0 0 16px;color:var(--accent);font-size:13px;font-weight:800}}
.lede{{max-width:650px;margin:0 0 30px;color:var(--muted);font-size:19px}}
.hero-actions{{display:flex;gap:12px;flex-wrap:wrap}}
.service-summary{{background:var(--surface);border:1px solid var(--line);padding:30px 32px;border-radius:calc(var(--radius) * 1.5)}}
.summary-kicker{{margin:0 0 8px;color:var(--muted);font-size:13px}}
.service-summary h2{{font-size:30px;margin-bottom:24px}}
.summary-list{{border-top:1px solid var(--line)}}
.summary-row{{display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid var(--line)}}
.summary-dot{{width:8px;height:8px;margin-top:9px;flex:0 0 auto;border-radius:50%;background:var(--accent)}}
.summary-row span{{font-weight:650;overflow-wrap:anywhere}}
.summary-location{{margin:20px 0 0;color:var(--muted);font-size:14px}}
section{{padding:76px 0;border-top:1px solid var(--line)}}
.proof-band{{padding:18px 0}}
.proof-items{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:36px}}
.proof-item{{padding:10px 0}}
.proof-item strong{{display:block;font-family:var(--display);font-size:23px;line-height:1.2}}
.proof-item span{{display:block;margin-top:5px;color:var(--muted);font-size:13px}}
.section-head{{display:grid;grid-template-columns:150px minmax(0,1fr);gap:36px;margin-bottom:42px}}
.section-intro{{max-width:650px;margin:10px 0 0;color:var(--muted)}}
.service-list{{border-top:1px solid var(--line)}}
.service-row{{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(280px,1.28fr);gap:42px;align-items:start;padding:30px 0;border-bottom:1px solid var(--line)}}
.service-row p{{margin:0;color:var(--muted);max-width:620px}}
.cta-wrap{{padding:76px 0}}
.cta{{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:44px;align-items:center;background:var(--surface);border:1px solid var(--line);padding:42px 44px;border-radius:calc(var(--radius) * 1.5)}}
.cta h2{{max-width:720px;margin-bottom:10px}}
.cta p{{margin:0;color:var(--muted)}}
.cta .address{{margin-top:6px;font-size:14px}}
footer{{display:flex;justify-content:space-between;gap:24px;padding:32px 0 48px;color:var(--muted);font-size:13px;border-top:1px solid var(--line)}}
footer strong{{color:var(--ink);font-family:var(--display);font-size:17px}}
@media(max-width:900px){{
  .hero{{grid-template-columns:minmax(0,1fr) minmax(250px,.72fr);gap:40px}}
  h1{{font-size:clamp(42px,7vw,62px)}}
}}
@media(max-width:760px){{
  .wrap{{width:min(100% - 32px,1120px)}}
  nav{{min-height:72px}}
  .links>a:not(.btn){{display:none}}
  .hero{{grid-template-columns:1fr;gap:32px;padding:56px 0 60px}}
  h1{{font-size:clamp(40px,12vw,58px);line-height:1.02}}
  .lede{{font-size:17px}}
  .service-summary{{padding:26px 24px}}
  .proof-items{{grid-template-columns:1fr;gap:8px}}
  .proof-item{{padding:12px 0}}
  section{{padding:60px 0}}
  .section-head{{grid-template-columns:1fr;gap:4px;margin-bottom:32px}}
  .service-row{{grid-template-columns:1fr;gap:10px;padding:24px 0}}
  .cta-wrap{{padding:60px 0}}
  .cta{{grid-template-columns:1fr;padding:30px 26px;gap:24px}}
  footer{{flex-direction:column}}
}}
</style></head><body>
<div class="concept">Concept redesign — niet de officiële website van {html.escape(prospect_name)}</div>
{rendered}
</body></html>"""


def render_snapshot_svg(config: SiteConfig) -> str:
    hero = next((b for b in config.blocks if b.get("type") == "hero"), {"props": {}})
    props = hero.get("props", {})
    accent = _safe_color(config.theme.get("accent"), "#315E57")
    headline = html.escape(str(props.get("headline") or config.name)[:72])
    sub = html.escape(str(props.get("subheadline") or "")[:110])
    services = [str(x) for x in props.get("services", [])][:3]
    service_text = " · ".join(services)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><rect width="1200" height="720" fill="#FBFAF7"/><rect y="0" width="1200" height="64" fill="#18201D"/><text x="55" y="41" font-family="Arial" font-size="15" fill="#F8F6F0">Concept redesign — niet de officiële website</text><text x="70" y="145" font-family="Georgia" font-size="25" font-weight="700" fill="#18201D">{html.escape(config.name[:60])}</text><line x1="70" y1="170" x2="1130" y2="170" stroke="#D9D5CC"/><text x="70" y="230" font-family="Arial" font-size="15" font-weight="700" fill="{accent}">Dienstverlening</text><text x="70" y="310" font-family="Georgia" font-size="43" font-weight="700" fill="#18201D">{headline}</text><text x="70" y="370" font-family="Arial" font-size="19" fill="#59625C">{sub}</text><rect x="735" y="225" width="395" height="240" rx="8" fill="#F1EEE7" stroke="#D9D5CC"/><text x="770" y="270" font-family="Arial" font-size="14" fill="#59625C">Diensten in één oogopslag</text><text x="770" y="325" font-family="Georgia" font-size="21" font-weight="700" fill="#18201D">{html.escape(service_text[:62])}</text><rect x="70" y="470" width="160" height="54" rx="6" fill="{accent}"/><text x="110" y="504" font-family="Arial" font-size="17" font-weight="700" fill="#fff">Bel direct</text></svg>'''


def _render_block(block: dict[str, Any]) -> str:
    t, p, variant = block.get("type"), block.get("props") or {}, block.get("variant")
    if t == "navbar":
        links = "".join(
            f'<a href="#{html.escape(str(x).lower(), quote=True)}">{html.escape(str(x))}</a>'
            for x in p.get("links", [])
        )
        href = html.escape(str(p.get("ctaUrl") or "#"), quote=True)
        return f'<div class="wrap"><nav><div class="brand">{html.escape(str(p.get("logo", "")))}</div><div class="links">{links}<a class="btn secondary" href="{href}">{html.escape(str(p.get("ctaText", "Contact")))}</a></div></nav></div>'
    if t == "hero":
        href = html.escape(str(p.get("primaryCtaUrl") or "#"), quote=True)
        services = [str(x) for x in p.get("services", []) if str(x).strip()]
        rows = "".join(
            f'<div class="summary-row"><span class="summary-dot" aria-hidden="true"></span><span>{html.escape(_clean_service(service))}</span></div>'
            for service in services
        )
        location = html.escape(str(p.get("location") or ""))
        location_html = f'<p class="summary-location">Vestiging: {location}</p>' if location else ""
        return f'<div class="wrap"><section class="hero"><div class="hero-copy"><h1>{html.escape(str(p.get("headline", "")))}</h1><p class="lede">{html.escape(str(p.get("subheadline", "")))}</p><div class="hero-actions"><a class="btn" href="{href}">{html.escape(str(p.get("primaryCta", "Contact")))}</a><a class="btn secondary" href="#diensten">Bekijk diensten</a></div></div><aside class="service-summary" aria-label="Diensten in één oogopslag"><p class="summary-kicker">Diensten in één oogopslag</p><h2>Waarmee u terecht kunt</h2><div class="summary-list">{rows}</div>{location_html}</aside></section></div>'
    if t == "features":
        items = "".join(
            f'<div class="service-row"><h3>{html.escape(_clean_service(str(i.get("title", ""))))}</h3><p>{html.escape(str(i.get("description", "")))}</p></div>'
            for i in p.get("items", [])
        )
        return f'<section id="diensten"><div class="wrap"><div class="section-head"><div class="section-label">{html.escape(str(p.get("label", "Diensten")))}</div><div><h2>{html.escape(str(p.get("title", "Diensten")))}</h2><p class="section-intro">{html.escape(str(p.get("intro", "")))}</p></div></div><div class="service-list">{items}</div></div></section>'
    if t == "stats" and variant == "proof_band":
        items = "".join(
            f'<div class="proof-item"><strong>{html.escape(str(i.get("value", "")))}</strong><span>{html.escape(str(i.get("label", "")))}</span></div>'
            for i in p.get("items", [])
        )
        return f'<div class="proof-band"><div class="wrap"><div class="proof-items">{items}</div></div></div>'
    if t == "cta":
        href = html.escape(str(p.get("buttonUrl") or "#"), quote=True)
        address = str(p.get("address") or "").strip()
        address_html = f'<p class="address">{html.escape(address)}</p>' if address else ""
        return f'<div class="wrap cta-wrap" id="contact"><div class="cta"><div><p class="cta-eyebrow">{html.escape(str(p.get("eyebrow", "Contact")))}</p><h2>{html.escape(str(p.get("headline", "")))}</h2><p>{html.escape(str(p.get("subheadline", "")))}</p>{address_html}</div><a class="btn" href="{href}">{html.escape(str(p.get("buttonText", "Contact")))}</a></div></div>'
    if t == "footer":
        return f'<div class="wrap"><footer><strong>{html.escape(str(p.get("logo", "")))}</strong><span>{html.escape(str(p.get("copyright", "")))}</span></footer></div>'
    return ""


def _trust_items(brief: ConversionBrief) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for point in brief.trust_points[:3]:
        if " op basis van " in point:
            value, label = point.split(" op basis van ", 1)
            items.append({"value": value, "label": f"op basis van {label}"})
        else:
            items.append({"value": point, "label": "geverifieerd"})
    return items


def _service_description(service: str) -> str:
    clean = _clean_service(service)
    normalized = clean.lower()
    if "warmtepomp" in normalized:
        return "Voor vragen en werkzaamheden rond warmtepompen en de installatie daarvan."
    if "verwarming" in normalized or "klimaat" in normalized:
        return "Voor vragen en werkzaamheden aan verwarming en klimaatinstallaties."
    if "groepenkast" in normalized:
        return "Voor vragen en werkzaamheden rond de groepenkast en elektrische verdeling."
    if "brandmeld" in normalized:
        return "Voor vragen en werkzaamheden rond brandmeldinstallaties."
    if "data" in normalized or "bekabel" in normalized:
        return "Voor vragen en werkzaamheden rond databekabeling en aansluitingen."
    if "elektr" in normalized:
        return "Voor vragen en werkzaamheden aan elektrotechnische installaties."
    if "sanitair" in normalized or "loodgiet" in normalized:
        return "Voor vragen en werkzaamheden rond sanitair en leidingwerk."
    return f"Voor vragen en werkzaamheden rond {clean.lower()}."


def _contact_line(facts: VerifiedFacts) -> str:
    if facts.phone:
        return f"Bel {facts.company_name} rechtstreeks om uw vraag of project te bespreken."
    return f"Neem rechtstreeks contact op met {facts.company_name} over uw vraag of project."


def _clean_service(value: str) -> str:
    return " ".join(value.replace("_", " ").split()).strip(" .")


def _safe_color(value: Any, fallback: str) -> str:
    text = str(value or "")
    return text if re.fullmatch(r"#[0-9A-Fa-f]{6}", text) else fallback


def _safe_font(value: Any, fallback: str) -> str:
    text = str(value or "")
    return text if text and all(ch not in text for ch in "{};<>") else fallback


def _safe_radius(value: Any, fallback: int) -> int:
    try:
        radius = int(value)
    except (TypeError, ValueError):
        return fallback
    return min(max(radius, 0), 24)
