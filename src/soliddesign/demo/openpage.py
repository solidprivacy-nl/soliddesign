from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass
from typing import Any

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


def build_site_config(facts: VerifiedFacts, brief: ConversionBrief) -> SiteConfig:
    accent = facts.brand_colors[0] if facts.brand_colors else "#155EEF"
    secondary = facts.brand_colors[1] if len(facts.brand_colors) > 1 else "#101828"

    blocks: list[dict[str, Any]] = [
        {
            "id": "block-navbar-1",
            "type": "navbar",
            "variant": "default",
            "props": {
                "logo": facts.company_name,
                "links": ["Diensten", "Waarom wij", "Contact"],
                "ctaText": brief.primary_cta,
            },
        },
        {
            "id": "block-hero-1",
            "type": "hero",
            "variant": "split",
            "props": {
                "badge": "Concept redesign",
                "headline": brief.headline,
                "subheadline": brief.subheadline,
                "primaryCta": brief.primary_cta,
                "primaryCtaUrl": brief.primary_cta_url,
            },
        },
    ]

    if facts.services:
        blocks.append(
            {
                "id": "block-features-1",
                "type": "features",
                "variant": "grid",
                "props": {
                    "label": "Diensten",
                    "title": "Waarmee kunnen we helpen?",
                    "items": [
                        {
                            "icon": "Check",
                            "title": service,
                            "description": f"Neem contact op met {facts.company_name} voor informatie over {service}.",
                        }
                        for service in facts.services[:6]
                    ],
                },
            }
        )

    if brief.trust_points:
        blocks.append(
            {
                "id": "block-stats-1",
                "type": "stats",
                "variant": "bar",
                "props": {
                    "title": "Vertrouwen",
                    "items": [
                        {
                            "value": point.split(" ", 1)[0],
                            "label": point.split(" ", 1)[1] if " " in point else point,
                        }
                        for point in brief.trust_points[:3]
                    ],
                },
            }
        )

    blocks.extend(
        [
            {
                "id": "block-cta-1",
                "type": "cta",
                "variant": "simple",
                "props": {
                    "headline": "Snel weten wat er mogelijk is?",
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
            "accent": accent,
            "bg0": "#FFFFFF",
            "bg1": "#F7F8FA",
            "text0": secondary,
            "text1": "#344054",
            "fontSans": "Inter",
            "fontDisplay": "Inter",
            "radius": 14,
        },
    )


def render_static_html(config: SiteConfig, *, prospect_name: str) -> str:
    accent = _safe_color(config.theme.get("accent"), "#155EEF")
    text = _safe_color(config.theme.get("text0"), "#101828")
    rendered = "\n".join(_render_block(block) for block in config.blocks)
    return f"""<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>{html.escape(config.name)}</title>
<style>
:root{{--accent:{accent};--text:{text}}}*{{box-sizing:border-box}}body{{margin:0;font-family:Inter,system-ui,sans-serif;color:var(--text);line-height:1.5}}a{{color:inherit}}.wrap{{max-width:1120px;margin:auto;padding:0 24px}}.concept{{background:#101828;color:#fff;padding:9px;text-align:center;font-size:13px}}nav{{display:flex;justify-content:space-between;align-items:center;padding:22px 0}}.links{{display:flex;gap:20px;color:#667085}}.btn{{display:inline-block;background:var(--accent);color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700}}.hero{{padding:78px 0;display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}}h1{{font-size:clamp(38px,6vw,66px);line-height:1.04;margin:12px 0}}h2{{font-size:32px}}.muted{{color:#667085}}.visual{{height:330px;border-radius:28px;background:linear-gradient(145deg,var(--accent),#101828);box-shadow:0 24px 60px #10182830}}section{{padding:58px 0}}.alt{{background:#f8fafc}}.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}}.card,.stat{{border:1px solid #e4e7ec;border-radius:14px;padding:22px;background:#fff}}.stats{{display:flex;gap:16px;flex-wrap:wrap}}.stat strong{{display:block;font-size:27px}}.cta{{background:#101828;color:#fff;border-radius:26px;padding:38px}}footer{{padding:34px 0;color:#667085}}@media(max-width:760px){{.links{{display:none}}.hero{{grid-template-columns:1fr}}.grid{{grid-template-columns:1fr}}}}
</style></head><body>
<div class="concept">Concept redesign — niet de officiële website van {html.escape(prospect_name)}</div>
{rendered}
</body></html>"""


def render_snapshot_svg(config: SiteConfig) -> str:
    hero = next((b for b in config.blocks if b.get("type") == "hero"), {"props": {}})
    props = hero.get("props", {})
    accent = _safe_color(config.theme.get("accent"), "#155EEF")
    headline = html.escape(str(props.get("headline") or config.name)[:70])
    sub = html.escape(str(props.get("subheadline") or "")[:130])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><rect width="1200" height="720" fill="#fff"/><rect width="1200" height="72" fill="#101828"/><text x="55" y="45" font-family="Arial" font-size="24" fill="#fff">{html.escape(config.name[:70])}</text><rect x="60" y="120" width="1080" height="500" rx="28" fill="#f8fafc"/><rect x="780" y="170" width="300" height="350" rx="28" fill="{accent}"/><text x="110" y="245" font-family="Arial" font-size="42" font-weight="700" fill="#101828">{headline}</text><text x="110" y="325" font-family="Arial" font-size="20" fill="#475467">{sub}</text><rect x="110" y="480" width="190" height="58" rx="14" fill="{accent}"/><text x="145" y="516" font-family="Arial" font-size="18" font-weight="700" fill="#fff">Neem contact op</text></svg>'''


def _render_block(block: dict[str, Any]) -> str:
    t, p = block.get("type"), block.get("props") or {}
    if t == "navbar":
        links = "".join(f"<span>{html.escape(str(x))}</span>" for x in p.get("links", []))
        return f'<div class="wrap"><nav><strong>{html.escape(str(p.get("logo", "")))}</strong><div class="links">{links}</div><span class="btn">{html.escape(str(p.get("ctaText", "Contact")))}</span></nav></div>'
    if t == "hero":
        href = html.escape(str(p.get("primaryCtaUrl") or "#"), quote=True)
        return f'<div class="wrap"><section class="hero"><div><strong>{html.escape(str(p.get("badge", "Concept")))}</strong><h1>{html.escape(str(p.get("headline", "")))}</h1><p class="muted">{html.escape(str(p.get("subheadline", "")))}</p><a class="btn" href="{href}">{html.escape(str(p.get("primaryCta", "Contact")))}</a></div><div class="visual"></div></section></div>'
    if t == "features":
        items = "".join(f'<div class="card"><h3>{html.escape(str(i.get("title", "")))}</h3><div class="muted">{html.escape(str(i.get("description", "")))}</div></div>' for i in p.get("items", []))
        return f'<section class="alt"><div class="wrap"><h2>{html.escape(str(p.get("title", "Diensten")))}</h2><div class="grid">{items}</div></div></section>'
    if t == "stats":
        items = "".join(f'<div class="stat"><strong>{html.escape(str(i.get("value", "")))}</strong><span class="muted">{html.escape(str(i.get("label", "")))}</span></div>' for i in p.get("items", []))
        return f'<section><div class="wrap"><h2>{html.escape(str(p.get("title", "Vertrouwen")))}</h2><div class="stats">{items}</div></div></section>'
    if t == "cta":
        href = html.escape(str(p.get("buttonUrl") or "#"), quote=True)
        return f'<section><div class="wrap"><div class="cta"><h2>{html.escape(str(p.get("headline", "")))}</h2><p>{html.escape(str(p.get("subheadline", "")))}</p><a class="btn" href="{href}">{html.escape(str(p.get("buttonText", "Contact")))}</a></div></div></section>'
    if t == "footer":
        return f'<div class="wrap"><footer><strong>{html.escape(str(p.get("logo", "")))}</strong><br>{html.escape(str(p.get("copyright", "")))}</footer></div>'
    return ""


def _safe_color(value: Any, fallback: str) -> str:
    text = str(value or "")
    return text if re.fullmatch(r"#[0-9A-Fa-f]{6}", text) else fallback
