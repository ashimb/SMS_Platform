# @school-platform/api-client

Typed client for the School Platform API, generated from its OpenAPI schema and built on
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/).

```bash
npm run gen      # regenerate src/generated/schema.d.ts from a running API
                 # (API_OPENAPI_URL, default http://127.0.0.1:8000/api/v1/openapi.json)
npm run build    # dist/
npm run test:unit
```

## Usage

```ts
import { createApiClient, createMemoryTokenStore } from "@school-platform/api-client";

const tokens = createMemoryTokenStore();
const api = createApiClient(window.location.origin, tokens.get, (token) => {
  if (token) tokens.set(token);
  else {
    tokens.clear();
    redirectToLogin();
  }
});

const { data, error } = await api.GET("/api/v1/students", { params: { query: { page: 1 } } });
```

## Token handling (security)

- The **access token lives in memory only**: a closure, or your own state via `getToken`. This
  package never touches `localStorage`, `sessionStorage` or cookies itself, and a test asserts
  that.
- The **refresh token is an httpOnly, Secure, SameSite cookie** set by the API. JavaScript can't
  read it. On a `401`, the client:
  1. calls `POST /api/v1/auth/refresh` (configurable with `refreshPath`) with `credentials: "include"` and the `X-SP-CSRF` header;
  2. passes the new access token (or `null` on failure) to `onRefresh`;
  3. retries the original request **once**.
- Refresh is **single-flight**: concurrent 401s share one refresh call, so rotating refresh
  tokens don't trip reuse detection.
- Auth endpoints (login, refresh, logout, MFA) are never retried through refresh.
- `onRefresh(null)` means the session is over, so the app should send the user to sign in.
- After a full page reload there is no access token. Call refresh once at app start to restore
  the session from the cookie.
