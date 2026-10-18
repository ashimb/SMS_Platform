import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defaultClientConditions } from "vite";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": src },
    // Workspace packages expose a "source" condition, so tests compile their TypeScript directly.
    conditions: ["source", ...defaultClientConditions],
  },
  test: {
    // Node by default (route handlers, lib); component tests opt in with `// @vitest-environment jsdom`.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "config/**/*.test.ts"],
    restoreMocks: true,
    testTimeout: 30_000,
  },
});
