/**
 * Content-Security-Policy for the portal (FRD FR-SEC-024, CNF-07).
 *
 * The production header is sent by the portal image's nginx (infra/docker/portal.Dockerfile) with
 * a fresh per-response nonce; `vite preview` uses the same builder (config/vite-plugins.ts), so
 * a production build is verified under the policy it ships with. Keep the two in sync: the
 * Dockerfile test in config/config.test.ts fails if they drift.
 *
 * - Scripts: same-origin files only. The build emits no inline scripts (no inline service-worker
 *   registration, no module-preload polyfill), so neither 'unsafe-inline' nor a script nonce is
 *   needed.
 * - Styles: same-origin files plus a per-response nonce. The nonce is stamped only on <style>
 *   elements created through the DOM API by our own (CSP-allowed) scripts (public/csp-nonce.js),
 *   so a <style> tag injected through markup is still blocked.
 * - Everything else defaults to 'self'; framing, plugins and <base> are disabled.
 */
export const NONCE_PLACEHOLDER = "__CSP_NONCE__";

export interface CspOptions {
  /** Upgrade http subresource requests (production only: breaks http://localhost previews). */
  upgradeInsecureRequests?: boolean;
}

export function buildCsp(nonce: string, options: CspOptions = {}): string {
  if (!/^[A-Za-z0-9+/_=-]{16,}$/.test(nonce)) throw new Error("CSP nonce is malformed");
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
  ];
  if (options.upgradeInsecureRequests) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
