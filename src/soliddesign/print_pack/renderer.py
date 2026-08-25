from __future__ import annotations

import html
import io
from pathlib import Path

try:
    import segno  # type: ignore
except ImportError:  # restricted/offline test fallback
    segno = None

from ..demo.openpage import SiteConfig, render_snapshot_svg
from ..models import AuditResult, ConversionBrief, Prospect


def render_print_pack(
    prospect: Prospect,
    audit: AuditResult,
    brief: ConversionBrief,
    site_config: SiteConfig,
    *,
    preview_url: str,
) -> str:
    qr_svg = _qr_svg(preview_url)
    concept_svg = render_snapshot_svg(site_config)
    current_html = _current_state_html(audit)
    opportunity_items = "".join(
        f"<li>{html.escape(item)}</li>" for item in brief.opportunities[:3]
    )
    opportunity_count = min(len(brief.opportunities), 3)
    opportunity_heading = (
        "Drie kansen die ons opvielen"
        if opportunity_count == 3
        else f"{opportunity_count} concrete kans{'en' if opportunity_count != 1 else ''} die ons opviel{'en' if opportunity_count != 1 else ''}"
    )
    return f"""<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><title>Concept voor {html.escape(prospect.name)}</title>
<style>
@page{{size:A4;margin:12mm}}*{{box-sizing:border-box}}body{{font-family:Arial,sans-serif;color:#101828;margin:0}}h1{{font-size:26px;margin:0 0 8px}}h2{{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#475467}}p,li{{font-size:12.5px;line-height:1.45}}.lead{{font-size:15px;color:#344054}}.compare{{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}}.panel{{border:1px solid #d0d5dd;border-radius:10px;overflow:hidden}}.panel h3{{font-size:12px;margin:0;padding:8px 10px;background:#f2f4f7}}.panel img,.panel svg{{display:block;width:100%;height:210px;object-fit:cover;object-position:top}}.placeholder{{height:210px;background:#f2f4f7;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;padding:25px;text-align:center;color:#667085}}.placeholder strong{{font-size:16px;color:#101828}}.placeholder span{{font-size:12px;line-height:1.4;max-width:360px}}.bottom{{display:grid;grid-template-columns:1fr 135px;gap:20px;align-items:end;border-top:2px solid #101828;padding-top:14px;margin-top:15px}}.qr svg{{width:125px;height:125px}}.url{{font-family:monospace;font-size:10px;word-break:break-all}}.disclaimer{{font-size:9px;color:#667085;margin-top:12px}}
</style></head><body>
<h1>We zagen concrete ruimte voor verbetering bij {html.escape(prospect.name)}</h1>
<p class="lead">Uw bedrijf heeft al zichtbare marktactiviteit. Daarom hebben we niet alleen een audit gemaakt, maar ook een beperkt concept dat laat zien hoe de route van bezoek naar contact duidelijker kan.</p>
<div class="compare"><div class="panel"><h3>HUIDIGE WEBSITE / LIVE AUDIT</h3>{current_html}</div><div class="panel"><h3>CONCEPT</h3>{concept_svg}</div></div>
<h2>{html.escape(opportunity_heading)}</h2><ul>{opportunity_items}</ul>
<div class="bottom"><div><h2>Bekijk het volledige concept</h2><p>Scan de QR-code of open de persoonlijke link.</p><div class="url">{html.escape(preview_url)}</div></div><div class="qr">{qr_svg}</div></div>
<p class="disclaimer">Dit is een vrijblijvend concept en niet de officiële website van {html.escape(prospect.name)}. Bedrijfsinformatie in het concept is beperkt tot geverifieerde of expliciet goedgekeurde gegevens.</p>
</body></html>"""


def _current_state_html(audit: AuditResult) -> str:
    if audit.current_screenshot_data_uri:
        return f'<img src="{html.escape(audit.current_screenshot_data_uri, quote=True)}" alt="Huidige website">'

    reachability = next(
        (
            finding
            for finding in audit.findings
            if finding.key == "reachability" and finding.severity == "critical"
        ),
        None,
    )
    if reachability is not None:
        impact = reachability.business_impact or "De website kon tijdens de live audit niet betrouwbaar worden geladen."
        return (
            '<div class="placeholder">'
            '<strong>Website niet bereikbaar tijdens live audit</strong>'
            f'<span>{html.escape(impact)}</span>'
            '</div>'
        )

    return '<div class="placeholder"><span>Geen actuele website-screenshot beschikbaar.</span></div>'


def write_print_pack(path: str | Path, html_text: str) -> Path:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html_text, encoding="utf-8")
    return target


def _qr_svg(url: str) -> str:
    if segno is not None:
        qr = segno.make(url, error="m")
        buffer = io.BytesIO()
        qr.save(buffer, kind="svg", scale=4, border=1, xmldecl=False)
        return buffer.getvalue().decode("utf-8")
    # Explicitly not a fake QR. The canonical URL remains visible; normal installs
    # include the pinned QR dependency.
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 125" role="img" aria-label="QR dependency not installed"><rect width="125" height="125" fill="white"/><rect x="1" y="1" width="123" height="123" fill="none" stroke="black"/><text x="62" y="58" text-anchor="middle" font-size="10">QR bij build</text><text x="62" y="74" text-anchor="middle" font-size="8">zie URL links</text></svg>'
