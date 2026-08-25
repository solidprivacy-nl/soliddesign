from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class SupabaseStorageError(RuntimeError):
    pass


class SupabaseRestStore:
    """Small server-side PostgREST adapter for operational state."""

    def __init__(self, url: str | None = None, secret_key: str | None = None) -> None:
        self.url = (url or os.getenv("SUPABASE_URL") or "").rstrip("/")
        self.secret_key = (
            secret_key
            or os.getenv("SUPABASE_SECRET_KEY")
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or ""
        )
        if not self.url or not self.secret_key:
            raise SupabaseStorageError("SUPABASE_URL and SUPABASE_SECRET_KEY are required")

    def upsert(self, table: str, record: dict[str, Any], *, on_conflict: str = "id") -> list[dict[str, Any]]:
        endpoint = f"{self.url}/rest/v1/{urllib.parse.quote(table)}?on_conflict={urllib.parse.quote(on_conflict)}"
        return self._request(endpoint, method="POST", body=record, headers={"Prefer": "resolution=merge-duplicates,return=representation"})

    def insert(self, table: str, record: dict[str, Any]) -> list[dict[str, Any]]:
        endpoint = f"{self.url}/rest/v1/{urllib.parse.quote(table)}"
        return self._request(endpoint, method="POST", body=record, headers={"Prefer": "return=representation"})

    def _request(self, endpoint: str, *, method: str, body: dict[str, Any], headers: dict[str, str] | None = None) -> list[dict[str, Any]]:
        payload = json.dumps(body).encode("utf-8")
        all_headers = {
            "Content-Type": "application/json",
            "apikey": self.secret_key,
            "Authorization": f"Bearer {self.secret_key}",
        }
        all_headers.update(headers or {})
        request = urllib.request.Request(endpoint, data=payload, method=method, headers=all_headers)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.load(response)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:1000]
            raise SupabaseStorageError(f"Supabase HTTP {exc.code}: {detail}") from exc
        except OSError as exc:
            raise SupabaseStorageError(f"Supabase request failed: {exc}") from exc
        return data if isinstance(data, list) else [data]
