/**
 * Authenticated layout shared by the role layouts: skip link, desktop sidebar, sticky header,
 * mobile bottom navigation, command palette and idle-timeout warning. Route content renders in
 * <main> inside an error boundary (reset on navigation) and a Suspense boundary for lazy routes.
 */
import { Suspense, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";

import { ErrorBoundary } from "@/shared/components/ErrorBoundary.tsx";
import { FullPageLoader } from "@/shared/components/FullPageLoader.tsx";
import type { PortalKind } from "@/shared/constants/roles.ts";

import { BottomNav } from "./BottomNav.tsx";
import { CommandPalette } from "./CommandPalette.tsx";
import { IdleTimeoutDialog } from "./IdleTimeoutDialog.tsx";
import { Sidebar } from "./Sidebar.tsx";
import { TopBar } from "./TopBar.tsx";
import { useNavigation } from "./useNavigation.ts";

/** Move focus to <main> after client-side navigation, so screen readers start at the new page. */
function useRouteFocus() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);
  return pathname;
}

export function AppShell({ portal }: { portal: PortalKind }) {
  const { t } = useTranslation("common");
  const groups = useNavigation(portal);
  const pathname = useRouteFocus();

  return (
    <div className="flex min-h-dvh bg-bg">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("nav.skipToContent")}
      </a>
      <Sidebar portal={portal} groups={groups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar portal={portal} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-24 outline-none sm:px-6 lg:px-8 lg:pb-10"
        >
          <ErrorBoundary resetKeys={[pathname]}>
            <Suspense fallback={<FullPageLoader label={t("states.loading")} />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav portal={portal} groups={groups} />
      <CommandPalette groups={groups} />
      <IdleTimeoutDialog />
    </div>
  );
}
