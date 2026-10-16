import { type ReactNode } from "react";

import { cn } from "../lib/cn.ts";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Breadcrumb trail (rendered above the title, inside a labelled nav by the caller). */
  breadcrumbs?: ReactNode;
  /** Primary and secondary page actions (right-aligned on wide screens, stacked on mobile). */
  actions?: ReactNode;
  className?: string;
}

/** Page title block: the single <h1> of a screen, with context and actions. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {breadcrumbs ? <div className="text-sm text-fg-muted">{breadcrumbs}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-fg-muted md:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
