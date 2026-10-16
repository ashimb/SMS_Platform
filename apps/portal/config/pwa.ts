/**
 * PWA (vite-plugin-pwa / Workbox generateSW) options.
 *
 * Caching policy (security first):
 * - Precache only the hashed static build output (JS, CSS, icons) and the offline page.
 * - index.html is NOT precached: it carries a per-response CSP nonce and must always come from the
 *   server. Navigations are network-only, with offline.html as the fallback when offline.
 * - API responses are NEVER cached: no runtime route matches /api/, so those requests bypass the
 *   service worker cache entirely (authenticated data must not persist on shared devices).
 * - The worker is registered from application code (`virtual:pwa-register/react`), never by an
 *   injected inline script, and updates wait for the user ("prompt") so a form is never reloaded
 *   mid-edit.
 */
import type { VitePWAOptions } from "vite-plugin-pwa";

export const OFFLINE_FALLBACK = "offline.html";

export const pwaOptions: Partial<VitePWAOptions> = {
  registerType: "prompt",
  injectRegister: null,
  // The manifest is a static file: public/manifest.webmanifest (linked from index.html).
  manifest: false,
  workbox: {
    globPatterns: ["**/*.{js,css,svg,png,webmanifest}", OFFLINE_FALLBACK],
    globIgnores: ["**/index.html", "**/mockServiceWorker.js"],
    navigateFallback: null,
    cleanupOutdatedCaches: true,
    clientsClaim: false,
    skipWaiting: false,
    runtimeCaching: [
      {
        // Serialised into sw.js, so it must be self-contained.
        urlPattern: ({ request, url }) =>
          request.mode === "navigate" && !url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
        options: { precacheFallback: { fallbackURL: OFFLINE_FALLBACK } },
      },
    ],
  },
  devOptions: { enabled: false },
};
