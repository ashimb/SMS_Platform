/*
 * CSP style-nonce bootstrap (policy: apps/portal/config/csp.ts).
 *
 * Some libraries add a <style> element at runtime (sonner's toast CSS, Radix's scroll lock).
 * Under `style-src 'self' 'nonce-…'` those are blocked unless they carry the response nonce.
 * nginx writes a fresh nonce into <meta name="csp-nonce">; this script stamps it on <style>
 * elements created through document.createElement and sets __webpack_nonce__ (read by Radix's
 * style singleton via get-nonce).
 *
 * Why this is safe: only scripts already allowed by `script-src 'self'` can call createElement.
 * Markup injection (a <style> smuggled into HTML) never goes through createElement, so it is
 * still blocked.
 *
 * Why a classic script in public/: it must run before ANY module evaluates. Inside the bundle,
 * shared vendor chunks evaluate before the entry's own code, so an import in main.tsx is too late;
 * a synchronous external script in <head> runs during parsing, before deferred module scripts.
 */
(() => {
  "use strict";
  const meta = document.querySelector('meta[name="csp-nonce"]');
  const nonce = meta ? (meta.getAttribute("content") ?? "") : "";
  if (!/^[A-Za-z0-9+/_=-]{16,}$/.test(nonce) || nonce === "__CSP_NONCE__") return;

  window.__webpack_nonce__ = nonce;
  const create = document.createElement;
  document.createElement = function createElementWithNonce(tagName, options) {
    const element = create.call(document, tagName, options);
    if (String(tagName).toLowerCase() === "style") element.setAttribute("nonce", nonce);
    return element;
  };
})();
