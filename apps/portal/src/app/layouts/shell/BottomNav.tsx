import { Sheet, SheetContent, SheetTrigger } from "@school-platform/ui";
import { Ellipsis } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { BOTTOM_NAV, MODULES } from "@/app/modules.ts";
import type { PortalKind } from "@/shared/constants/roles.ts";
import { cn } from "@/shared/utils/cn.ts";

import { NavList } from "./Sidebar.tsx";
import type { ResolvedNavGroup } from "./useNavigation.ts";

const itemClass =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/**
 * Mobile/tablet navigation: four primary destinations within thumb reach plus "More", which opens
 * the full navigation in a bottom sheet. Targets are 56px tall (WCAG 2.5.8).
 */
export function BottomNav({ portal, groups }: { portal: PortalKind; groups: ResolvedNavGroup[] }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const visible = new Set(groups.flatMap((group) => group.items.map((item) => item.key)));
  const primary = BOTTOM_NAV[portal].filter((key) => visible.has(key)).map((key) => MODULES[key]);

  return (
    <nav
      aria-label={t("nav.mobileLabel")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-3 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex h-14 max-w-xl items-stretch gap-1 px-2">
        {primary.map(({ key, path, icon: Icon }) => (
          <li key={key} className="flex flex-1">
            <NavLink
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                cn(itemClass, isActive ? "text-primary" : "text-fg-muted hover:text-fg")
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="max-w-full truncate">{t(`nav.${key}`)}</span>
            </NavLink>
          </li>
        ))}
        <li className="flex flex-1">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className={cn(itemClass, "text-fg-muted hover:text-fg")}>
              <Ellipsis aria-hidden="true" className="size-5" />
              <span>{t("nav.more")}</span>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              title={t("nav.allSections")}
              closeLabel={t("actions.close")}
            >
              <nav aria-label={t("nav.label")} className="max-h-[65dvh] overflow-y-auto pb-4">
                <NavList
                  groups={groups}
                  onNavigate={() => {
                    setOpen(false);
                  }}
                />
              </nav>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
