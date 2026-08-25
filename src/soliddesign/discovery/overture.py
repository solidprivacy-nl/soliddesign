from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Iterable

from ..models import Prospect

STAC_CATALOG_URL = "https://stac.overturemaps.org/catalog.json"
S3_PLACES_TEMPLATE = (
    "s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*"
)
_RELEASE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}\.\d+$")


class DiscoveryError(RuntimeError):
    pass


def parse_bbox(value: str) -> tuple[float, float, float, float]:
    """Parse Overture bbox order: west,south,east,north."""
    parts = [part.strip() for part in value.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must contain west,south,east,north")
    try:
        west, south, east, north = (float(part) for part in parts)
    except ValueError as exc:
        raise ValueError("bbox values must be numeric") from exc
    if not (-180 <= west < east <= 180):
        raise ValueError("bbox must satisfy -180 <= west < east <= 180")
    if not (-90 <= south < north <= 90):
        raise ValueError("bbox must satisfy -90 <= south < north <= 90")
    return west, south, east, north


def latest_release(*, timeout: float = 10.0) -> str:
    """Return the latest release advertised by Overture's official STAC catalog."""
    override = os.getenv("OVERTURE_RELEASE")
    if override:
        return _validate_release(override)
    try:
        with urllib.request.urlopen(STAC_CATALOG_URL, timeout=timeout) as response:
            payload = json.load(response)
    except (OSError, ValueError, urllib.error.URLError) as exc:
        raise DiscoveryError(f"Could not read Overture STAC catalog: {exc}") from exc
    release = payload.get("latest")
    if not isinstance(release, str):
        raise DiscoveryError("Overture STAC catalog did not expose a latest release")
    return _validate_release(release)


def search_businesses(
    bbox: tuple[float, float, float, float] | str,
    *,
    categories: Iterable[str] = (),
    name_contains: str | None = None,
    limit: int = 50,
    release: str | None = None,
) -> list[Prospect]:
    """Query Overture Places via DuckDB and retain active businesses with websites.

    `categories` should use Overture's current `basic_category` or taxonomy labels,
    for example `electrician`, `plumber`, or another label from the official taxonomy.
    The old `categories` property is intentionally not used because it is deprecated.
    """
    if isinstance(bbox, str):
        west, south, east, north = parse_bbox(bbox)
    else:
        west, south, east, north = bbox
        parse_bbox(f"{west},{south},{east},{north}")
    if limit < 1 or limit > 1000:
        raise ValueError("limit must be between 1 and 1000")

    resolved_release = _validate_release(release) if release else latest_release()
    category_terms = tuple(_normalize_category(term) for term in categories if term.strip())

    try:
        import duckdb
    except ImportError as exc:
        raise DiscoveryError(
            "Overture discovery requires DuckDB. Install project dependencies first."
        ) from exc

    connection = duckdb.connect()
    try:
        connection.execute("INSTALL httpfs")
        connection.execute("LOAD httpfs")
        connection.execute("SET s3_region='us-west-2'")
        sql, params = _build_query(
            release=resolved_release,
            west=west,
            south=south,
            east=east,
            north=north,
            categories=category_terms,
            name_contains=name_contains,
            limit=limit,
        )
        rows = connection.execute(sql, params).fetchall()
    except Exception as exc:  # DuckDB exposes several runtime exception classes.
        raise DiscoveryError(f"Overture query failed: {exc}") from exc
    finally:
        connection.close()

    prospects: list[Prospect] = []
    for row in rows:
        prospect = _row_to_prospect(row, resolved_release)
        if prospect is not None:
            prospects.append(prospect)
    return prospects


def _build_query(
    *,
    release: str,
    west: float,
    south: float,
    east: float,
    north: float,
    categories: tuple[str, ...],
    name_contains: str | None,
    limit: int,
) -> tuple[str, list[Any]]:
    s3_path = S3_PLACES_TEMPLATE.format(release=_validate_release(release))
    filters = [
        "bbox.xmin BETWEEN ? AND ?",
        "bbox.ymin BETWEEN ? AND ?",
        "names.primary IS NOT NULL",
        "websites IS NOT NULL",
        "length(websites) > 0",
        "(operating_status IS NULL OR operating_status <> 'permanently_closed')",
    ]
    params: list[Any] = [west, east, south, north]

    if categories:
        category_clauses: list[str] = []
        for category in categories:
            category_clauses.append(
                "("
                "lower(coalesce(basic_category, '')) = ? OR "
                "lower(coalesce(taxonomy.primary, '')) = ? OR "
                "list_contains(taxonomy.hierarchy, ?) OR "
                "list_contains(taxonomy.alternates, ?)"
                ")"
            )
            params.extend([category, category, category, category])
        filters.append("(" + " OR ".join(category_clauses) + ")")

    if name_contains and name_contains.strip():
        filters.append("lower(names.primary) LIKE ?")
        params.append(f"%{name_contains.strip().lower()}%")

    sql = f"""
        SELECT
            id,
            names.primary AS name,
            basic_category,
            taxonomy.primary AS taxonomy_primary,
            websites,
            phones,
            CASE
                WHEN addresses IS NOT NULL AND length(addresses) > 0
                THEN addresses[1].freeform
            END AS address_freeform,
            CASE
                WHEN addresses IS NOT NULL AND length(addresses) > 0
                THEN addresses[1].locality
            END AS city,
            confidence,
            operating_status
        FROM read_parquet('{s3_path}', hive_partitioning=1)
        WHERE {' AND '.join(filters)}
        LIMIT {int(limit)}
    """
    return sql, params


def _row_to_prospect(row: tuple[Any, ...], release: str) -> Prospect | None:
    (
        place_id,
        name,
        basic_category,
        taxonomy_primary,
        websites,
        phones,
        address_freeform,
        city,
        confidence,
        operating_status,
    ) = row
    if not name or operating_status == "permanently_closed":
        return None
    website = _normalize_website(websites)
    if not website:
        return None
    category = str(basic_category or taxonomy_primary or "local business").replace("_", " ")
    return Prospect(
        id=f"overture:{place_id or name}",
        name=str(name),
        category=category,
        city=str(city or ""),
        address=str(address_freeform or ""),
        website_url=website,
        phone=_first_string(phones),
        rating=None,
        review_count=None,
        place_id=str(place_id) if place_id else None,
        discovery_source="overture",
        discovery_version=release,
        source_confidence=float(confidence) if confidence is not None else None,
        operating_status=str(operating_status) if operating_status else None,
    )


def _normalize_website(value: Any) -> str | None:
    website = _first_string(value)
    if not website:
        return None
    if website.startswith(("http://", "https://")):
        return website
    return f"https://{website}"


def _first_string(value: Any) -> str | None:
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, (list, tuple)):
        for item in value:
            if isinstance(item, str) and item.strip():
                return item.strip()
    return None


def _normalize_category(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def _validate_release(value: str | None) -> str:
    if not value or not _RELEASE_RE.fullmatch(value):
        raise ValueError("invalid Overture release identifier")
    return value
