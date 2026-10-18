import Link from "next/link";

import { Container } from "@/components/layout/Section.tsx";

interface PageHeaderProps {
  title: string;
  description?: string | undefined;
  eyebrow?: string | undefined;
  /** Trail of parent pages; the current page is the title. */
  trail?: { label: string; href: string }[];
}

/** Banner for inner pages. Renders the page's single h1. */
export function PageHeader({ title, description, eyebrow, trail = [] }: PageHeaderProps) {
  return (
    <header className="relative isolate overflow-hidden bg-primary-900 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(90%_120%_at_0%_0%,var(--sp-primary-600)_0%,transparent_60%),radial-gradient(70%_100%_at_100%_100%,var(--sp-primary-950)_0%,transparent_70%)] opacity-90"
      />
      <Container className="py-14 sm:py-20">
        {trail.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/75">
            <ol className="flex flex-wrap items-center gap-2">
              {trail.map((item) => (
                <li key={item.href} className="flex items-center gap-2">
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                  <span aria-hidden="true">/</span>
                </li>
              ))}
              <li aria-current="page" className="text-white">
                {title}
              </li>
            </ol>
          </nav>
        ) : null}
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary-200 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-lg text-white/85">{description}</p> : null}
      </Container>
    </header>
  );
}
