/**
 * Tenant branding: the public school profile (GET /api/v1/tenant, available before sign-in),
 * applied as design-token overrides with `applyTenantTheme()` and exposed to layouts.
 */
import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";

import { unwrap } from "@/lib/api.ts";
import { api } from "@/lib/auth-store.ts";
import { applyBranding, brandingFromTenant, type TenantBranding } from "@/lib/theme.ts";

export const TENANT_QUERY_KEY = ["tenant", "public"] as const;

const DEFAULT_BRANDING: TenantBranding = {
  name: "School Portal",
  monogram: "SP",
  logoUrl: null,
  theme: {},
};

const BrandingContext = createContext<TenantBranding>(DEFAULT_BRANDING);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: TENANT_QUERY_KEY,
    queryFn: () => unwrap(api.GET("/api/v1/tenant")),
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });
  const branding = useMemo(() => (data ? brandingFromTenant(data) : DEFAULT_BRANDING), [data]);

  useEffect(() => {
    applyBranding(branding);
  }, [branding]);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding(): TenantBranding {
  return useContext(BrandingContext);
}

/** School logo, or a monogram tile in the brand colour when there is no logo. */
export function SchoolMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { name, monogram, logoUrl } = useBranding();
  const box = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" }[size];
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={`${box} rounded-lg object-contain`} />;
  }
  return (
    <span
      aria-hidden="true"
      title={name}
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-lg bg-primary font-display font-semibold text-primary-fg shadow-1`}
    >
      {monogram}
    </span>
  );
}
