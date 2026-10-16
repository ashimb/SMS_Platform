import { Badge, Button, Card } from "@school-platform/ui";
import { ArrowLeft, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ROUTES } from "@/shared/constants/routes.ts";

import { PageHeader } from "./PageHeader.tsx";

export interface ComingSoonProps {
  title: string;
  description: string;
  icon: ReactNode;
  /** What the module will do, in the user's words (from the FRD). */
  highlights: readonly string[];
}

/**
 * Designed placeholder for modules that are not built yet: real page layout and navigation,
 * a clear "in progress" status, and what the module will offer, so navigation feels complete
 * instead of leading to blank screens.
 */
export function ComingSoon({ title, description, icon, highlights }: ComingSoonProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary-subtle opacity-70 blur-3xl"
        />
        <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr] md:items-start">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary-subtle text-primary-subtle-fg shadow-1 [&_svg]:size-8">
            {icon}
          </span>
          <div className="space-y-5">
            <div className="space-y-2">
              <Badge tone="primary" dot>
                {t("comingSoon.badge")}
              </Badge>
              <h2 className="font-display text-xl font-semibold text-fg">
                {t("comingSoon.heading", { module: title })}
              </h2>
              <p className="max-w-prose text-sm text-fg-muted">{t("comingSoon.body")}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("comingSoon.planned")}>
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-fg">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="secondary">
              <Link to={ROUTES.home}>
                <ArrowLeft aria-hidden="true" />
                {t("actions.backToDashboard")}
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
