/**
 * Sign-in layout: school-branded panel (logo/monogram, name, brand colours from the tenant theme)
 * beside the form on desktop; a compact single column on phones. No images, so the sign-in page
 * stays fast on low-end Android devices.
 */
import { CalendarCheck, ShieldCheck, Wallet } from "lucide-react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";

import { SchoolMark, useBranding } from "@/app/branding.tsx";
import { type Language, LANGUAGES, setLanguage } from "@/lib/i18n.ts";
import { FullPageLoader } from "@/shared/components/FullPageLoader.tsx";
import { cn } from "@/shared/utils/cn.ts";

function LanguageSwitch() {
  const { t, i18n } = useTranslation("common");
  return (
    <div role="group" aria-label={t("language.label")} className="flex items-center gap-1 text-sm">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={i18n.language === code}
          onClick={() => {
            void setLanguage(code as Language);
          }}
          className={cn(
            "inline-flex min-h-11 items-center rounded-md px-3 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            i18n.language === code
              ? "bg-surface-sunken font-semibold text-fg"
              : "text-fg-muted hover:text-fg",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function AuthLayout() {
  const { t } = useTranslation("auth");
  const { name } = useBranding();
  const highlights = [
    { icon: CalendarCheck, text: t("layout.highlightAttendance") },
    { icon: Wallet, text: t("layout.highlightFees") },
    { icon: ShieldCheck, text: t("layout.highlightPrivacy") },
  ];

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-primary-700 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,var(--sp-primary-500)_0%,transparent_60%),radial-gradient(90%_70%_at_100%_100%,var(--sp-primary-900)_0%,transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)] [background-size:40px_40px]"
        />
        <div className="relative flex items-center gap-3">
          <span className="rounded-xl bg-white/10 p-1 ring-1 ring-white/20">
            <SchoolMark size="md" />
          </span>
          <span className="font-display text-lg font-semibold">{name}</span>
        </div>
        <div className="relative max-w-md space-y-8">
          <p className="font-display text-3xl leading-tight font-semibold tracking-tight">
            {t("layout.tagline")}
          </p>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/70">{t("layout.footer")}</p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5 lg:invisible">
            <SchoolMark size="sm" />
            <span className="font-display text-sm font-semibold text-fg">{name}</span>
          </div>
          <LanguageSwitch />
        </header>
        <main
          id="main"
          className="flex flex-1 items-start justify-center px-5 pt-6 pb-12 sm:items-center sm:px-8"
        >
          <div className="w-full max-w-sm">
            <Suspense fallback={<FullPageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
