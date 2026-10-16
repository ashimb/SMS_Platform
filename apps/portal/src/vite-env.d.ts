/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />
/// <reference types="msw/vite/client" />

interface ImportMetaEnv {
  /** Dev-only MSW mode: "all" (default in dev), "pending", or "off". Ignored in production. */
  readonly VITE_API_MOCKING?: "all" | "pending" | "off";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
