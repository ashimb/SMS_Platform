/**
 * Small Vite plugins for the portal build.
 *
 * - `cspPreview()`: makes `vite preview` behave like the production nginx. HTML responses get a
 *   fresh nonce substituted into index.html and the same Content-Security-Policy header, so
 *   Lighthouse and manual checks run under the real policy.
 * - `forbidInlineScripts()`: fails the build if index.html ever contains an inline <script>.
 */
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Plugin } from "vite";

import { buildCsp, NONCE_PLACEHOLDER } from "./csp.ts";

export function cspPreview(): Plugin {
  return {
    name: "sp-csp-preview",
    configurePreviewServer(server) {
      const outDir = server.config.build.outDir;
      const root = server.config.root;
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const wantsHtml = (req.headers.accept ?? "").includes("text/html");
        const isFile = /\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.endsWith(".html");
        if (req.method !== "GET" || !wantsHtml || isFile || url.pathname.startsWith("/api/")) {
          next();
          return;
        }
        const page = url.pathname === "/offline.html" ? "offline.html" : "index.html";
        readFile(join(root, outDir, page), "utf8")
          .then((html) => {
            const nonce = randomBytes(16).toString("hex");
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Content-Security-Policy", buildCsp(nonce));
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            res.end(html.replaceAll(NONCE_PLACEHOLDER, nonce));
          })
          .catch(next);
      });
    },
  };
}

export function forbidInlineScripts(): Plugin {
  return {
    name: "sp-forbid-inline-scripts",
    apply: "build",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const inline = /<script\b(?![^>]*\bsrc=)[^>]*>/i.exec(html);
        if (inline) {
          throw new Error(`Inline <script> found in index.html (blocked by CSP): ${inline[0]}`);
        }
        return html;
      },
    },
  };
}
