import type { ReactNode } from "react";

import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle.ts";

export interface StatusPageProps {
  /** Large decorative code, e.g. "404". Hidden from screen readers (the title says it). */
  code: string;
  title: string;
  description: ReactNode;
  icon: ReactNode;
  actions: ReactNode;
}

/** Shared layout for 403/404/no-access pages. */
export function StatusPage({ code, title, description, icon, actions }: StatusPageProps) {
  useDocumentTitle(title);
  return (
    <section className="relative mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-6 bg-gradient-to-b from-primary-200 to-transparent bg-clip-text font-display text-[8rem] leading-none font-bold text-transparent select-none sm:text-[10rem] dark:from-primary-800"
      >
        {code}
      </p>
      <span className="relative mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-surface-raised text-primary shadow-2 ring-1 ring-border [&_svg]:size-7">
        {icon}
      </span>
      <h1 className="relative font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
        {title}
      </h1>
      <div className="relative mt-3 max-w-md text-fg-muted">{description}</div>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
    </section>
  );
}
