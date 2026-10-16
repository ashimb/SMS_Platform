import { useQuery } from "@tanstack/react-query";

import { isApiError, unwrap } from "@/lib/api.ts";
import { api } from "@/lib/auth-store.ts";

import { dashboardSchemas } from "../schemas.ts";
import type { DashboardDataByRole, DashboardRole } from "../types.ts";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  role: (role: DashboardRole) => ["dashboard", role] as const,
};

export async function fetchDashboard<R extends DashboardRole>(
  role: R,
): Promise<DashboardDataByRole[R]> {
  const data = await unwrap(api.GET("/api/v1/dashboards/{role}", { params: { path: { role } } }));
  return dashboardSchemas[role].parse(data) as DashboardDataByRole[R];
}

/** Role dashboard data; widgets are ≤ 60 s fresh per FR-RPT-001, so refetch each minute. */
export function useDashboard<R extends DashboardRole>(role: R) {
  return useQuery({
    queryKey: dashboardKeys.role(role),
    queryFn: () => fetchDashboard(role),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

/** The API answers 404 until dashboards are implemented server-side. */
export function isDashboardUnavailable(error: unknown): boolean {
  return isApiError(error, 404);
}
