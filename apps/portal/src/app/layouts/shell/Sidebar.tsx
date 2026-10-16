import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { SchoolMark, useBranding } from "@/app/branding.tsx";
import type { PortalKind } from "@/shared/constants/roles.ts";
import { cn } from "@/shared/utils/cn.ts";

import type { ResolvedNavGroup } from "./useNavigation.ts";

export function NavList({
  groups,
  onNavigate,
}: {
  groups: readonly ResolvedNavGroup[];
  onNavigate?: () => void;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, index) => (
        <div key={group.labelKey ?? `group-${String(index)}`} className="flex flex-col gap-1">
          {group.labelKey ? (
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
              {t(`navGroups.${group.labelKey}`)}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ key, path, icon: Icon }) => (
              <li key={key}>
                <NavLink
                  to={path}
                  end={path === "/"}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                  className={({ isActive }) =>
                    cn(
                      "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      isActive
                        ? "bg-primary-subtle text-primary-subtle-fg"
                        : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                  <span className="truncate">{t(`nav.${key}`)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Desktop sidebar (lg and up). Phones and tablets use the bottom bar and the "More" sheet. */
export function Sidebar({ portal, groups }: { portal: PortalKind; groups: ResolvedNavGroup[] }) {
  const { t } = useTranslation("common");
  const { name } = useBranding();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <SchoolMark size="sm" />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-fg">{name}</p>
          <p className="truncate text-xs text-fg-subtle">{t(`portal.${portal}`)}</p>
        </div>
      </div>
      <nav aria-label={t("nav.label")} className="flex-1 overflow-y-auto px-3 py-5">
        <NavList groups={groups} />
      </nav>
    </aside>
  );
}
