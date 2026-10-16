// The CSP style-nonce patch runs before this entry as a classic script (public/csp-nonce.js).
import "./styles/index.css";
import "./lib/zod-config.ts";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App.tsx";
import { auth } from "./lib/auth-store.ts";
import { initI18n } from "./lib/i18n.ts";
import { captureResetToken } from "./lib/reset-token.ts";
import { initColorMode } from "./lib/theme.ts";

// Before any network request: move a password-reset token out of the URL (no Referer leaks).
captureResetToken();
initColorMode();

/** Dev-only API mocks (MSW). The import is behind import.meta.env.DEV, so production omits it. */
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return;
  const mode = import.meta.env.VITE_API_MOCKING ?? "all";
  if (mode === "off") return;
  const [{ network }, { handlersFor }] = await Promise.all([
    import("virtual:msw"),
    import("./test/mocks/handlers.ts"),
  ]);
  network.configure({ handlers: handlersFor(mode) });
  await network.enable();
}

await enableMocking();
// Translations, the silent sign-in and the first route chunk all load in parallel; components
// suspend until their namespace is ready. Sign-in pages also need "auth" straight away.
const onAuthPage = /^\/(login|forgot-password|reset-password)/.test(window.location.pathname);
void initI18n(undefined, onAuthPage ? ["common", "auth"] : ["common"]);
// Silent sign-in from the HttpOnly refresh cookie; guards show a loader until it settles.
void auth.init();

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing from index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD) {
  void import("./app/pwa.ts").then(({ registerServiceWorker }) => {
    registerServiceWorker();
  });
}
