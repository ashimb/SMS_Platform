import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
} from "@school-platform/ui";
import { Check, ChevronDown, Languages, LogOut, Monitor, Moon, Search, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SchoolMark, useBranding } from "@/app/branding.tsx";
import { auth, useAuth } from "@/lib/auth-store.ts";
import { type Language, LANGUAGES, setLanguage } from "@/lib/i18n.ts";
import { type ColorMode, setColorMode, useColorMode } from "@/lib/theme.ts";
import type { PortalKind } from "@/shared/constants/roles.ts";

import { openCommandPalette } from "./command-palette-events.ts";

const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

function ThemeMenu() {
  const { t } = useTranslation("common");
  const mode = useColorMode();
  const Icon = MODE_ICONS[mode];
  return (
    <DropdownMenu>
      <Tooltip content={t("theme.label")}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("theme.change", { mode: t(`theme.${mode}`) })}
          >
            <Icon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
        {(["light", "dark", "system"] as const satisfies readonly ColorMode[]).map((option) => {
          const OptionIcon = MODE_ICONS[option];
          return (
            <DropdownMenuItem
              key={option}
              onSelect={() => {
                setColorMode(option);
              }}
            >
              <OptionIcon aria-hidden="true" />
              <span className="flex-1">{t(`theme.${option}`)}</span>
              {option === mode ? <Check aria-label={t("states.selected")} /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ portal }: { portal: PortalKind }) {
  const { t, i18n } = useTranslation("common");
  const user = useAuth((state) => state.user);
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-1.5 sm:pr-2.5">
          {/* The button is named from its content (no aria-label override), so the visible text is
              always part of the accessible name (WCAG 2.5.3 Label in Name): the avatar and the
              visible name are hidden from assistive tech, and the screen-reader text carries both
              the purpose and the person's name, also on phones where the name is not shown. */}
          <span aria-hidden="true" className="inline-flex">
            <Avatar name={user.full_name} size="sm" />
          </span>
          <span className="sr-only">{t("user.menu", { name: user.full_name })}</span>
          <span
            aria-hidden="true"
            className="hidden max-w-36 truncate text-sm font-medium text-fg sm:inline"
          >
            {user.full_name}
          </span>
          <ChevronDown aria-hidden="true" className="hidden text-fg-subtle sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-semibold text-fg">{user.full_name}</span>
          <span className="block truncate text-xs text-fg-muted">{user.email}</span>
          <span className="mt-1 block text-xs text-fg-subtle">{t(`portal.${portal}`)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-fg-subtle">
          <Languages aria-hidden="true" className="size-3.5" />
          {t("language.label")}
        </DropdownMenuLabel>
        {LANGUAGES.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            lang={code}
            onSelect={() => {
              void setLanguage(code as Language);
            }}
          >
            <span className="flex-1">{label}</span>
            {i18n.language === code ? <Check aria-label={t("states.selected")} /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => {
            void auth.logout();
          }}
        >
          <LogOut aria-hidden="true" />
          {t("user.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Header: brand (mobile), command palette trigger, theme, account. */
export function TopBar({ portal }: { portal: PortalKind }) {
  const { t } = useTranslation("common");
  const { name } = useBranding();
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

  return (
    <header className="sticky top-0 z-30 flex h-[calc(3.5rem+var(--sp-safe-top))] items-center gap-3 border-b border-border bg-bg/85 pt-safe pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] backdrop-blur sm:h-[calc(4rem+var(--sp-safe-top))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))]">
      <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
        <SchoolMark size="sm" />
        <span className="truncate font-display text-sm font-semibold text-fg">{name}</span>
      </div>
      <button
        type="button"
        onClick={openCommandPalette}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className="ml-auto flex h-11 min-w-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-fg-subtle shadow-1 transition-colors hover:border-border-strong hover:text-fg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:ml-0 lg:w-80 md:pointer-fine:h-10"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{t("palette.trigger")}</span>
        <span className="sr-only sm:hidden">{t("palette.trigger")}</span>
        <kbd className="ml-auto hidden rounded border border-border bg-surface-sunken px-1.5 font-sans text-[11px] text-fg-subtle lg:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      <div className="flex items-center gap-1 lg:ml-auto">
        <ThemeMenu />
        <UserMenu portal={portal} />
      </div>
    </header>
  );
}
