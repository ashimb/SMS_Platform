import { useMemo } from "react";

import { type ModuleDef, MODULES, moduleVisible, NAVIGATION } from "@/app/modules.ts";
import { useAuth } from "@/lib/auth-store.ts";
import type { PortalKind } from "@/shared/constants/roles.ts";

export interface ResolvedNavGroup {
  labelKey: string | null;
  items: ModuleDef[];
}

/** The portal's navigation, minus modules the user lacks permission for (and empty groups). */
export function useNavigation(portal: PortalKind): ResolvedNavGroup[] {
  const permissions = useAuth((state) => state.user?.permissions);
  return useMemo(
    () =>
      NAVIGATION[portal]
        .map((group) => ({
          labelKey: group.labelKey,
          items: group.items
            .map((key) => MODULES[key])
            .filter((module) => moduleVisible(module, portal, permissions ?? [])),
        }))
        .filter((group) => group.items.length > 0),
    [portal, permissions],
  );
}
