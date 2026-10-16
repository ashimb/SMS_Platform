/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { msw } from "msw/vite";
import { defaultClientConditions, defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { pwaOptions } from "./config/pwa.ts";
import { cspPreview, forbidInlineScripts } from "./config/vite-plugins.ts";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isTest = mode === "test";
  const apiTarget = env["API_PROXY_TARGET"] ?? "http://127.0.0.1:8000";

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Serves the MSW worker in dev; emitted only if a bundle imports `virtual:msw`, which
      // src/main.tsx does behind `import.meta.env.DEV`, so production builds never ship it.
      ...(isTest ? [] : [msw(), VitePWA(pwaOptions), cspPreview(), forbidInlineScripts()]),
    ],
    resolve: {
      alias: { "@": src },
      // Workspace packages expose a "source" condition, so the portal compiles their TypeScript
      // directly (no stale dist/, no build-order coupling between workspaces).
      conditions: ["source", ...defaultClientConditions],
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // Same-origin API in dev: the refresh cookie (SameSite=Strict, path /api/v1/auth) works
        // exactly as behind nginx. The Host header is kept so the API resolves the tenant.
        "/api": { target: apiTarget, changeOrigin: false, xfwd: true },
      },
    },
    preview: { port: 4173, strictPort: true },
    build: {
      target: "es2022",
      sourcemap: false,
      // No data: URIs for fonts/images; keeps the CSP narrow and assets cacheable.
      assetsInlineLimit: 0,
      // The polyfill would be an inline script; all supported browsers have modulepreload.
      modulePreload: { polyfill: false },
      cssCodeSplit: true,
      reportCompressedSize: true,
      rolldownOptions: {
        output: {
          // Long-lived vendor chunks for cache hits across deploys. Groups pull in their
          // dependencies, so only self-contained libraries are grouped; everything else (incl.
          // recharts, reachable only via the lazy chart) is split automatically per route.
          codeSplitting: {
            groups: [
              {
                name: "react",
                test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
              },
              { name: "i18n", test: /node_modules[\\/](i18next|react-i18next)[\\/]/ },
            ],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}", "config/**/*.test.ts"],
      css: false,
      restoreMocks: true,
      testTimeout: 30_000,
      env: { VITE_API_MOCKING: "off" },
    },
  };
});
