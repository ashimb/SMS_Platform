/**
 * Route table. Every page is code-split (route-level `lazy`), so the sign-in page ships only
 * what it needs. Guards wrap groups of routes; they shape the UI only, as the API authorizes
 * every request itself.
 */
import { createBrowserRouter, Outlet, type RouteObject, useNavigation } from "react-router-dom";

import { FullPageLoader } from "@/shared/components/FullPageLoader.tsx";
import { PERMISSIONS } from "@/shared/constants/permissions.ts";
import { PORTAL_ROLES } from "@/shared/constants/roles.ts";

import {
  RedirectIfAuthenticated,
  RequireAuth,
  RequirePermission,
  RequireRole,
} from "./guards/index.ts";
import { AuthLayout } from "./layouts/AuthLayout.tsx";
import { type ModuleKey, MODULES } from "./modules.ts";
import { ForbiddenPage } from "./pages/ForbiddenPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { RouteErrorPage } from "./pages/RouteErrorPage.tsx";

type PageModule = Promise<{ default: React.ComponentType }>;

/** Adapt `() => import("./Page.tsx")` (default export) to a router `lazy` route. */
function page(load: () => PageModule): Pick<RouteObject, "lazy"> {
  return { lazy: async () => ({ Component: (await load()).default }) };
}

// Page modules are imported directly (not through feature barrels), so the entry chunk never
// pulls in a feature's components, schemas or libraries until that route is visited.
const authPages = {
  login: () => import("@/features/auth/pages/LoginPage.tsx"),
  mfa: () => import("@/features/auth/pages/MfaPage.tsx"),
  forgotPassword: () => import("@/features/auth/pages/ForgotPasswordPage.tsx"),
  resetPassword: () => import("@/features/auth/pages/ResetPasswordPage.tsx"),
};
const dashboardPage = () => import("@/features/dashboard/pages/DashboardPage.tsx");
const studentPages = {
  list: () => import("@/features/students/pages/StudentsListPage.tsx"),
  detail: () => import("@/features/students/pages/StudentDetailPage.tsx"),
  create: () => import("@/features/students/pages/StudentCreatePage.tsx"),
  edit: () => import("@/features/students/pages/StudentEditPage.tsx"),
};

const placeholderPages: Record<Exclude<ModuleKey, "dashboard" | "students">, () => PageModule> = {
  guardians: () => import("@/features/guardians/pages/GuardiansPage.tsx"),
  staff: () => import("@/features/staff/pages/StaffPage.tsx"),
  academics: () => import("@/features/academics/pages/AcademicsPage.tsx"),
  timetable: () => import("@/features/timetable/pages/TimetablePage.tsx"),
  attendance: () => import("@/features/attendance/pages/AttendancePage.tsx"),
  exams: () => import("@/features/exams/pages/ExamsPage.tsx"),
  admissions: () => import("@/features/admissions/pages/AdmissionsPage.tsx"),
  fees: () => import("@/features/fees/pages/FeesPage.tsx"),
  communication: () => import("@/features/communication/pages/CommunicationPage.tsx"),
  cms: () => import("@/features/cms/pages/CmsPage.tsx"),
  reports: () => import("@/features/reports/pages/ReportsPage.tsx"),
  settings: () => import("@/features/settings/pages/SettingsPage.tsx"),
  audit: () => import("@/features/audit/pages/AuditPage.tsx"),
};

/** A module route guarded by its registry entry (portal roles + optional permission). */
function moduleRoute(key: keyof typeof placeholderPages): RouteObject {
  const module = MODULES[key];
  const roles = module.portals.flatMap((portal) => PORTAL_ROLES[portal]);
  const inner: RouteObject = { index: true, ...page(placeholderPages[key]) };
  return {
    path: module.path.slice(1),
    element: <RequireRole roles={roles} />,
    children: module.permission
      ? [{ element: <RequirePermission permission={module.permission} />, children: [inner] }]
      : [inner],
  };
}

/** Thin progress bar while a lazy route loads. */
function NavigationProgress() {
  const navigation = useNavigation();
  if (navigation.state === "idle") return null;
  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-primary-subtle"
    >
      <div className="h-full w-1/3 animate-[sp-progress_1s_ease-in-out_infinite] bg-primary motion-reduce:animate-none" />
    </div>
  );
}

function Root() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
    </>
  );
}

export const routes: RouteObject[] = [
  {
    element: <Root />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <FullPageLoader />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            element: <RedirectIfAuthenticated />,
            children: [
              { path: "login", ...page(authPages.login) },
              { path: "login/mfa", ...page(authPages.mfa) },
            ],
          },
          { path: "forgot-password", ...page(authPages.forgotPassword) },
          { path: "reset-password", ...page(authPages.resetPassword) },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            // The signed-in shell (navigation, menus, dialogs) is its own chunk, so the sign-in
            // page never downloads it.
            lazy: async () => ({
              Component: (await import("./layouts/RoleLayout.tsx")).RoleLayout,
            }),
            children: [
              { index: true, ...page(dashboardPage) },
              {
                path: "students",
                element: <RequirePermission permission={PERMISSIONS.studentsRead} />,
                children: [
                  { index: true, ...page(studentPages.list) },
                  {
                    path: "new",
                    element: <RequirePermission permission={PERMISSIONS.studentsCreate} />,
                    children: [{ index: true, ...page(studentPages.create) }],
                  },
                  { path: ":studentId", ...page(studentPages.detail) },
                  {
                    path: ":studentId/edit",
                    element: <RequirePermission permission={PERMISSIONS.studentsUpdate} />,
                    children: [{ index: true, ...page(studentPages.edit) }],
                  },
                ],
              },
              ...(Object.keys(placeholderPages) as (keyof typeof placeholderPages)[]).map(
                moduleRoute,
              ),
              { path: "403", element: <ForbiddenPage /> },
              { path: "*", element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
