/**
 * Security headers for the public website (FRD FR-SEC-024).
 *
 * Plain ESM so next.config.mjs can import it and unit tests can too (config/security-headers.d.mts
 * types it for TypeScript).
 *
 * Content-Security-Policy and nonces: a per-request nonce forces every page to render
 * dynamically, which disables ISR, CDN caching and the LCP budget this site is built around
 * (Next.js docs, "Content Security Policy"). The public pages are therefore ISR-rendered and the
 * policy is static:
 *   - everything defaults to 'self'; framing, plugins, <base> and cross-origin form posts are off;
 *   - scripts/styles allow 'unsafe-inline' because Next.js emits inline bootstrap scripts and the
 *     server-rendered tenant theme is an inline <style> (no flash of unbranded content). Content
 *     injection is blocked at the source instead: CMS HTML is sanitised (components/security).
 *   - images come from 'self' plus explicitly listed HTTPS media hosts (WEBSITE_MEDIA_HOSTS).
 * Tracked in docs/DEFERRED.md (P5-01): move scripts to hash-based CSP via Next's experimental SRI.
 */

/** @param {{ isDev?: boolean, mediaHosts?: readonly string[] }} [options] */
export function buildCsp({ isDev = false, mediaHosts = [] } = {}) {
  const imgHosts = mediaHosts.map((host) => `https://${host}`);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${["'self'", "data:", "blob:", ...imgHosts].join(" ")}`,
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "media-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
  ];
  // No `upgrade-insecure-requests`: the edge redirects http to https and sends HSTS, and the
  // directive would break plain-http local previews of a production build.
  return directives.join("; ");
}

/** @param {{ isDev?: boolean, mediaHosts?: readonly string[] }} [options] */
export function securityHeaders(options = {}) {
  return [
    { key: "Content-Security-Policy", value: buildCsp(options) },
    // Same value as the edge proxy (infra/nginx/nginx.conf), so the duplicate header is harmless.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // The public site needs none of these capabilities; browsers intersect duplicate policies.
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];
}

/** Hostnames from a comma-separated env value; anything that is not a bare hostname is dropped. */
export function parseMediaHosts(raw) {
  return String(raw ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter((host) =>
      /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(host),
    );
}
