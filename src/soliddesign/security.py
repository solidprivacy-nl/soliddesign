from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse


class UnsafeUrlError(ValueError):
    pass


def validate_public_http_url(url: str, *, resolve_dns: bool = True) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise UnsafeUrlError("Only http/https URLs are allowed")
    if not parsed.hostname:
        raise UnsafeUrlError("URL must contain a hostname")
    if parsed.username or parsed.password:
        raise UnsafeUrlError("Credential-bearing URLs are not allowed")

    host = parsed.hostname.strip("[]")
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None

    if ip is not None:
        _assert_public_ip(ip)
    elif resolve_dns:
        try:
            infos = socket.getaddrinfo(
                host,
                parsed.port or (443 if parsed.scheme == "https" else 80),
            )
        except socket.gaierror as exc:
            raise UnsafeUrlError(f"Hostname could not be resolved: {host}") from exc
        if not infos:
            raise UnsafeUrlError(f"Hostname could not be resolved: {host}")
        for info in infos:
            _assert_public_ip(ipaddress.ip_address(info[4][0]))
    return url


def _assert_public_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> None:
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        raise UnsafeUrlError(f"Blocked non-public address: {ip}")
