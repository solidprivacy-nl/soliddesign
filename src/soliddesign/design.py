from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any

from .models import ConversionBrief, VerifiedFacts


@dataclass(frozen=True)
class DesignProfile:
    """Small deterministic art-direction contract for pre-sale concepts."""

    page_type: str
    tone: str
    palette: dict[str, str]
    font_display: str
    font_body: str
    radius: int
    hero_variant: str
    services_variant: str
    trust_variant: str
    cta_variant: str
    media_strategy: str
    motion_level: str
    anti_patterns: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["anti_patterns"] = list(self.anti_patterns)
        return data


def derive_design_profile(facts: VerifiedFacts, brief: ConversionBrief) -> DesignProfile:
    """Derive one restrained premium service-business profile.

    Premium v2 intentionally keeps a single composition. The correction is better
    hierarchy, copy and responsive robustness, not more templates.
    """
    accent = _first_valid_color(facts.brand_colors) or _category_accent(
        f"{facts.category} {' '.join(facts.services)}"
    )
    return DesignProfile(
        page_type="authority_service",
        tone="premium_trustworthy",
        palette={
            "accent": accent,
            "ink": "#18201D",
            "muted": "#59625C",
            "paper": "#FBFAF7",
            "surface": "#F1EEE7",
            "line": "#D9D5CC",
            "inverse": "#F8F6F0",
        },
        font_display='Georgia, "Times New Roman", serif',
        font_body='system-ui, -apple-system, "Segoe UI", sans-serif',
        radius=6,
        hero_variant="service_split",
        services_variant="editorial_list",
        trust_variant="proof_band",
        cta_variant="light",
        media_strategy="verified_company_image_else_editorial_no_photo",
        motion_level="low",
        anti_patterns=(
            "no_fake_proof",
            "no_decorative_gradients",
            "no_glowing_ai_aesthetic",
            "no_excessive_rounding",
            "no_repetitive_equal_card_grid",
            "no_decorative_empty_hero_panel",
            "no_placeholder_copy",
            "no_motion_without_function",
        ),
    )


def _first_valid_color(colors: tuple[str, ...]) -> str | None:
    for color in colors:
        if re.fullmatch(r"#[0-9A-Fa-f]{6}", color):
            return color.upper()
    return None


def _category_accent(text: str) -> str:
    normalized = text.lower()
    if any(term in normalized for term in ("warmtepomp", "duurzaam", "verwarming")):
        return "#3F6754"
    if any(term in normalized for term in ("klimaat", "loodgiet", "sanitair")):
        return "#356A67"
    if any(term in normalized for term in ("elektr", "groepenkast", "brandmeld", "data", "domotica")):
        return "#9A4726"
    if any(term in normalized for term in ("bouw", "aannem", "onderhoud")):
        return "#8A633F"
    if any(term in normalized for term in ("zorg", "health", "therap", "praktijk")):
        return "#2E746C"
    if any(term in normalized for term in ("interieur", "hout", "schilder", "renov")):
        return "#8A633F"
    return "#315E57"
