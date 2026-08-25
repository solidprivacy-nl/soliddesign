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
    trust_items = _trust_items(facts, brief)

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
                "location": facts.city,
                "service": facts.services[0] if facts.services else facts.category,
            },
        },
    ]

    if trust_items:
        blocks.append(
            {
                "id": "block-proof-1",
                "type": "stats",
                "variant": profile.trust_variant,
                "props": {"title": "Geverifieerde gegevens", "items": trust_items},
            }
        )

    if facts.services:
        blocks.append(
            {
                "id": "block-services-1",
                "type": "features",
                "variant": profile.services_variant,
                "props": {
                    "label": "Diensten",
                    "title": "Waarvoor u contact kunt opnemen",
                    "items": [
                        {
                            "title": service,
                            "description": f"Neem contact op met {facts.company_name} voor informatie over {service}.",
                        }
                        for service in facts.services[:6]
                    ],
                },
            }
        )

    blocks.extend(
        [
            {
                "id": "block-cta-1",
                "type": "cta",
                "variant": profile.cta_variant,
                "props": {
                    "eyebrow": facts.city or facts.category,
                    "headline": "Bespreek uw vraag rechtstreeks",
                    "subheadline": facts.address,
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
                    "links": ["Contact"],
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
    muted = _safe_color(theme.get("muted"), "#66706A")
    paper = _safe_color(theme.get("paper"), "#FBFAF7")
    surface = _safe_color(theme.get("surface"), "#F1EEE7")
    line = _safe_color(theme.get("line"), "#D9D5CC")
    inverse = _safe_color(theme.get("inverse"), "#F8F6F0")
    font_display = _safe_font(theme.get("fontDisplay"), 'Georgia, "Times New Roman", serif')
    font_body = _safe_font(theme.get("fontSans"), 'system-ui, -apple-system, "Segoe UI", sans-serif')
    radius = _safe_radius(theme.get("radius"), 8)
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
body{{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.65}}
a{{color:inherit}}
.wrap{{width:min(1160px,calc(100% - 48px));margin:auto}}
.concept{{background:var(--ink);color:var(--inverse);padding:10px 24px;text-align:center;font-size:12px}}
nav{{display:flex;justify-content:space-between;align-items:center;min-height:84px;border-bottom:1px solid var(--line)}}
.brand{{font-family:var(--display);font-size:21px;font-weight:700;letter-spacing:-.02em}}
.links{{display:flex;gap:28px;align-items:center;color:var(--muted);font-size:14px}}
.btn{{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;background:var(--accent);color:white;text-decoration:none;font-size:14px;font-weight:750;letter-spacing:.01em;border:1px solid transparent;border-radius:var(--radius)}}
.btn.secondary{{background:transparent;color:var(--ink);border-color:var(--line)}}
.hero{{padding:88px 0 72px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);gap:64px;align-items:end}}
h1,h2,h3{{font-family:var(--display);font-weight:700;letter-spacing:-.035em}}
h1{{max-width:820px;margin:0 0 24px;font-size:clamp(48px,7vw,86px);line-height:.98}}
h2{{margin:0 0 24px;font-size:clamp(34px,4vw,52px);line-height:1.05}}
h3{{margin:0;font-size:24px;line-height:1.15}}
.lede{{max-width:660px;margin:0 0 30px;color:var(--muted);font-size:19px}}
.hero-actions{{display:flex;gap:12px;flex-wrap:wrap}}
.hero-panel{{min-height:420px;background:var(--ink);color:var(--inverse);padding:36px;display:flex;flex-direction:column;justify-content:space-between;border-radius:calc(var(--radius) * 1.5)}}
.hero-panel .mark{{font-family:var(--display);font-size:clamp(68px,10vw,132px);line-height:.8;color:var(--inverse);opacity:.94}}
.hero-panel .meta{{border-top:1px solid #ffffff33;padding-top:22px}}
.hero-panel strong{{display:block;font-family:var(--display);font-size:26px;line-height:1.1}}
.hero-panel span{{display:block;margin-top:8px;color:#d9ded9;font-size:14px}}
section{{padding:84px 0;border-top:1px solid var(--line)}}
.proof-band{{padding:28px 12px;background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}}
.proof-items{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;padding:0 12px}}
.proof-item{{padding:12px 28px;border-left:1px solid var(--line)}}
.proof-item:first-child{{border-left:0}}
.proof-item strong{{display:block;font-family:var(--display);font-size:24px}}
.proof-item span{{color:var(--muted);font-size:13px}}
.section-head{{display:grid;grid-template-columns:160px 1fr;gap:36px;margin-bottom:46px}}
.section-label{{color:var(--accent);font-size:12px;font-weight:800;letter-spacing:.08em}}
.service-list{{border-top:1px solid var(--line)}}
.service-row{{display:grid;grid-template-columns:minmax(180px,.7fr) minmax(260px,1.3fr);gap:42px;align-items:start;padding:32px 0;border-bottom:1px solid var(--line)}}
.service-row p{{margin:0;color:var(--muted);max-width:620px}}
.eyebrow{{margin:0 0 14px;color:#df8964;font-size:13px;font-weight:750}}
.cta-wrap{{padding:88px 0}}
.cta{{display:grid;grid-template-columns:1fr auto;gap:48px;align-items:end;background:var(--ink);color:var(--inverse);padding:54px;border-radius:calc(var(--radius) * 1.5)}}
.cta h2{{max-width:700px;margin-bottom:12px}}
.cta p{{margin:0;color:#d9ded9}}
footer{{display:flex;justify-content:space-between;gap:24px;padding:34px 0 50px;color:var(--muted);font-size:13px;border-top:1px solid var(--line)}}
footer strong{{color:var(--ink);font-family:var(--display);font-size:17px}}
@media(max-width:820px){{
  .wrap{{width:min(100% - 32px,1160px)}}
  .links span{{display:none}}
  .hero{{grid-template-columns:1fr;gap:36px;padding:60px 0}}
  .hero-panel{{min-height:300px}}
  .proof-items{{grid-template-columns:1fr;padding:0}}
  .proof-item,.proof-item:first-child{{padding:18px 14px;border-left:0;border-top:1px solid var(--line)}}
  .proof-item:first-child{{border-top:0}}
  .section-head{{grid-template-columns:1fr;gap:8px}}
  .service-row{{grid-template-columns:1fr;gap:12px}}
  .cta{{grid-template-columns:1fr;padding:36px 28px}}
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
    headline = html.escape(str(props.get("headline") or config.name)[:78])
    sub = html.escape(str(props.get("subheadline") or "")[:130])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><rect width="1200" height="720" fill="#FBFAF7"/><rect y="0" width="1200" height="72" fill="#18201D"/><text x="55" y="45" font-family="Georgia" font-size="24" fill="#F8F6F0">{html.escape(config.name[:70])}</text><text x="70" y="180" font-family="Arial" font-size="15" font-weight="700" fill="{accent}">Concept redesign</text><text x="70" y="265" font-family="Georgia" font-size="46" font-weight="700" fill="#18201D">{headline}</text><text x="70" y="345" font-family="Arial" font-size="20" fill="#66706A">{sub}</text><rect x="760" y="130" width="360" height="430" rx="12" fill="#18201D"/><text x="800" y="310" font-family="Georgia" font-size="110" fill="#F8F6F0">{html.escape((str(props.get("service") or "S")[:1]).upper())}</text><rect x="70" y="465" width="190" height="58" rx="8" fill="{accent}"/><text x="112" y="501" font-family="Arial" font-size="18" font-weight="700" fill="#fff">Neem contact op</text></svg>'''


def _render_block(block: dict[str, Any]) -> str:
    t, p, variant = block.get("type"), block.get("props") or {}, block.get("variant")
    if t == "navbar":
        links = "".join(f"<span>{html.escape(str(x))}</span>" for x in p.get("links", []))
        href = html.escape(str(p.get("ctaUrl") or "#"), quote=True)
        return f'<div class="wrap"><nav><div class="brand">{html.escape(str(p.get("logo", "")))}</div><div class="links">{links}<a class="btn secondary" href="{href}">{html.escape(str(p.get("ctaText", "Contact")))}</a></div></nav></div>'
    if t == "hero":
        href = html.escape(str(p.get("primaryCtaUrl") or "#"), quote=True)
        location = html.escape(str(p.get("location") or ""))
        service = html.escape(str(p.get("service") or "Dienstverlening"))
        mark = (service[:1] or "S").upper()
        return f'<div class="wrap"><section class="hero"><div><h1>{html.escape(str(p.get("headline", "")))}</h1><p class="lede">{html.escape(str(p.get("subheadline", "")))}</p><div class="hero-actions"><a class="btn" href="{href}">{html.escape(str(p.get("primaryCta", "Contact")))}</a></div></div><aside class="hero-panel" aria-label="Dienst en locatie"><div class="mark">{html.escape(mark)}</div><div class="meta"><strong>{service}</strong><span>{location}</span></div></aside></section></div>'
    if t == "features":
        items = "".join(
            f'<div class="service-row"><h3>{html.escape(str(i.get("title", "")))}</h3><p>{html.escape(str(i.get("description", "")))}</p></div>'
            for i in p.get("items", [])
        )
        return f'<section id="diensten"><div class="wrap"><div class="section-head"><div class="section-label">{html.escape(str(p.get("label", "Diensten")))}</div><h2>{html.escape(str(p.get("title", "Diensten")))}</h2></div><div class="service-list">{items}</div></div></section>'
    if t == "stats" and variant == "proof_band":
        items = "".join(
            f'<div class="proof-item"><strong>{html.escape(str(i.get("value", "")))}</strong><span>{html.escape(str(i.get("label", "")))}</span></div>'
            for i in p.get("items", [])
        )
        return f'<div class="proof-band"><div class="wrap"><div class="proof-items">{items}</div></div></div>'
    if t == "cta":
        href = html.escape(str(p.get("buttonUrl") or "#"), quote=True)
        return f'<div class="wrap cta-wrap" id="contact"><div class="cta"><div><p class="eyebrow">{html.escape(str(p.get("eyebrow", "")))}</p><h2>{html.escape(str(p.get("headline", "")))}</h2><p>{html.escape(str(p.get("subheadline", "")))}</p></div><a class="btn" href="{href}">{html.escape(str(p.get("buttonText", "Contact")))}</a></div></div>'
    if t == "footer":
        return f'<div class="wrap"><footer><strong>{html.escape(str(p.get("logo", "")))}</strong><span>{html.escape(str(p.get("copyright", "")))}</span></footer></div>'
    return ""


def _trust_items(facts: VerifiedFacts, brief: ConversionBrief) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for point in brief.trust_points[:3]:
        if " op basis van " in point:
            value, label = point.split(" op basis van ", 1)
            items.append({"value": value, "label": f"op basis van {label}"})
        else:
            items.append({"value": point, "label": "geverifieerd"})
    if len(items) < 3 and facts.city:
        items.append({"value": facts.city, "label": "vestigingsplaats"})
    if len(items) < 3 and facts.phone:
        items.append({"value": "Direct", "label": "telefonisch contact"})
    return items[:3]


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
