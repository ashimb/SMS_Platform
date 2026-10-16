"""Security headers for every API response (FRD FR-SEC-024).

The API serves JSON only, so its CSP denies everything. The interactive docs (development only)
need the Swagger UI assets from jsDelivr, so `/api/docs` gets a narrower, docs-specific policy.
"""

from __future__ import annotations

from starlette.types import ASGIApp, Message, Receive, Scope, Send

API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
DOCS_CSP = (
    "default-src 'none'; "
    "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; "
    "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; "
    "img-src 'self' data: https://fastapi.tiangolo.com; "
    "connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"
)

_STATIC_HEADERS: list[tuple[bytes, bytes]] = [
    (b"strict-transport-security", b"max-age=63072000; includeSubDomains"),
    (b"x-content-type-options", b"nosniff"),
    (b"x-frame-options", b"DENY"),
    (b"referrer-policy", b"no-referrer"),
    (b"permissions-policy", b"camera=(), microphone=(), geolocation=(), payment=()"),
    (b"cross-origin-opener-policy", b"same-origin"),
    (b"cross-origin-resource-policy", b"same-origin"),
]
_MANAGED = {name for name, _ in _STATIC_HEADERS} | {
    b"content-security-policy",
    b"cache-control",
    b"server",
}


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp, *, docs_path: str | None = None) -> None:
        self.app = app
        self.docs_path = docs_path

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path: str = scope.get("path", "")
        is_docs = self.docs_path is not None and path.startswith(self.docs_path)
        csp = DOCS_CSP if is_docs else API_CSP

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = [
                    (k, v) for k, v in message.get("headers", []) if k.lower() not in _MANAGED
                ]
                headers.extend(_STATIC_HEADERS)
                headers.append((b"content-security-policy", csp.encode()))
                # Authenticated JSON must never be stored by browsers or shared caches.
                headers.append((b"cache-control", b"no-store"))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_with_headers)
