from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from ..models import Prospect

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.nationalPhoneNumber,places.websiteUri,places.rating,"
    "places.userRatingCount,places.types"
)


class DiscoveryError(RuntimeError):
    pass


def search_businesses(
    query: str,
    *,
    limit: int = 20,
    api_key: str | None = None,
    language_code: str = "nl",
    region_code: str = "NL",
) -> list[Prospect]:
    """Optional Google Places enrichment/fallback for businesses WITH websites.

    This adapter is intentionally not the canonical Phase-1 discovery path.
    Use Overture Maps first and activate Google only when a measured use case
    justifies provider billing/credentials.
    """
    key = api_key or os.getenv("GOOGLE_PLACES_API_KEY")
    if not key:
        raise DiscoveryError("GOOGLE_PLACES_API_KEY is required for optional Google discovery")

    body = json.dumps(
        {
            "textQuery": query,
            "maxResultCount": min(max(limit * 2, 1), 20),
            "languageCode": language_code,
            "regionCode": region_code,
            "includePureServiceAreaBusinesses": True,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        SEARCH_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": FIELD_MASK,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:500]
        raise DiscoveryError(f"Google Places returned HTTP {exc.code}: {detail}") from exc
    except OSError as exc:
        raise DiscoveryError(f"Google Places request failed: {exc}") from exc

    results: list[Prospect] = []
    for raw in payload.get("places", []):
        website = raw.get("websiteUri")
        if not website:
            continue
        display_name = (raw.get("displayName") or {}).get("text")
        if not display_name:
            continue
        place_id = raw.get("id") or display_name
        results.append(
            Prospect(
                id=f"google:{place_id}",
                name=display_name,
                category=_category(raw.get("types")),
                city="",
                address=raw.get("formattedAddress") or "",
                website_url=website,
                phone=raw.get("nationalPhoneNumber"),
                rating=raw.get("rating"),
                review_count=raw.get("userRatingCount"),
                place_id=raw.get("id"),
                discovery_source="google_places",
                discovery_version="v1",
            )
        )
        if len(results) >= limit:
            break
    return results


def _category(types: Any) -> str:
    if not isinstance(types, list) or not types:
        return "local business"
    return str(types[0]).replace("_", " ")
