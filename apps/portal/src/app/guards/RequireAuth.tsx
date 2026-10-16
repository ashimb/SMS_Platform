/**
 * Route guards decide what the portal *shows*. They are not the security boundary: the backend
 * is the real gate and authenticates and authorizes every API request on its own, so bypassing a
 * guard in the browser reveals an empty screen at most, never data.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";

import { useAuth } from "@/lib/auth-store.ts";
import { FullPageLoader } from "@/shared/components/FullPageLoader.tsx";
import { ROUTES, safeNextPath } from "@/shared/constants/routes.ts";

/** Signed-in users only; others go to sign-in and come back afterwards (`?next=`). */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const status = useAuth((state) => state.status);
  const location = useLocation();
  const { t } = useTranslation("common");

  if (status === "unknown") return <FullPageLoader label={t("states.restoringSession")} />;
  if (status === "anonymous") {
    const next = `${location.pathname}${location.search}`;
    const search = next === ROUTES.home ? "" : `?next=${encodeURIComponent(next)}`;
    return <Navigate to={`${ROUTES.login}${search}`} replace />;
  }
  return children ?? <Outlet />;
}

/**
 * The inverse, for sign-in pages: a signed-in user is sent on to the app (to `?next=` when it is
 * a safe in-app path, so it agrees with where the sign-in form itself navigates).
 */
export function RedirectIfAuthenticated({ children }: { children?: ReactNode }) {
  const status = useAuth((state) => state.status);
  const [params] = useSearchParams();
  if (status === "authenticated") {
    return <Navigate to={safeNextPath(params.get("next"))} replace />;
  }
  return children ?? <Outlet />;
}
