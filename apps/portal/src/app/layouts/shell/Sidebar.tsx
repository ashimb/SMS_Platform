import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { SchoolMark, useBranding } from "@/app/branding.tsx";
import type { PortalKind } from "@/shared/constants/roles.ts";
import { cn } from "@/shared/utils/cn.ts";

import type { ResolvedNavGroup } from "./useNavigation.ts";

/**
 * `rail` shows icons only between md and lg (the tablet icon rail); labels stay in the DOM as
 * screen-reader text so every link keeps its accessible name.
 */
export function NavList({
  groups,
  onNavigate,
  rail = false,
}: {
  groups: readonly ResolvedNavGroup[];
  onNavigate?: () => void;
  rail?: boolean;
}) {
  const { t } = useTranslation("common");
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        rail && "md:items-center md:gap-3 lg:items-stretch lg:gap-6",
      )}
    >
      {groups.map((group, index) => (
        <div key={group.labelKey ?? `group-${String(index)}`} className="flex flex-col gap-1">
          {group.labelKey ? (
            <p
              className={cn(
                "px-3 pb-1 text-xs font-semibold tracking-wide text-fg-subtle uppercase",
                rail && "md:sr-only lg:not-sr-only",
              )}
            >
              {t(`navGroups.${group.labelKey}`)}
            </p>
          ) : null}
          <ul className={cn("flex flex-col gap-0.5", rail && "md:items-center lg:items-stretch")}>
            {group.items.map(({ key, path, icon: Icon }) => (
              <li key={key} className={cn(rail && "md:w-11 lg:w-auto")}>
                <NavLink
                  to={path}
                  end={path === "/"}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                  {...(rail ? { title: t(`nav.${key}`) } : {})}
                  className={({ isActive }) =>
                    cn(
                      "group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors md:pointer-fine:h-10",
                      rail && "md:justify-center md:px-0 lg:justify-start lg:px-3",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      isActive
                        ? "bg-primary-subtle text-primary-subtle-fg"
                        : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                  <span className={cn("truncate", rail && "md:sr-only lg:not-sr-only")}>
                    {t(`nav.${key}`)}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Sidebar: full width from lg, icon rail from md to lg. Phones use the bottom bar and its "More"
 * sheet instead.
 */
export function Sidebar({ portal, groups }: { portal: PortalKind; groups: ResolvedNavGroup[] }) {
  const { t } = useTranslation("common");
  const { name } = useBranding();
  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface pl-safe md:flex md:w-[4.5rem] lg:w-64">
      <div className="flex h-16 items-center gap-3 border-b border-border px-3 md:justify-center lg:justify-start lg:px-5">
        <SchoolMark size="sm" />
        <div className="min-w-0 md:sr-only lg:not-sr-only">
          <p className="truncate font-display text-sm font-semibold text-fg">{name}</p>
          <p className="truncate text-xs text-fg-subtle">{t(`portal.${portal}`)}</p>
        </div>
      </div>
      <nav aria-label={t("nav.label")} className="flex-1 overflow-y-auto px-3 py-5">
        <NavList groups={groups} rail />
      </nav>
    </aside>
  );
}
