import { GraduationCap } from "lucide-react";
import Link from "next/link";

import { MobileNav } from "@/components/layout/MobileNav.tsx";
import { NavLinks } from "@/components/layout/NavLinks.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import type { SiteProfile } from "@/lib/cms-types.ts";
import { NAV_LINKS, portalUrl } from "@/lib/navigation.ts";

export function Header({ site, origin }: { site: SiteProfile; origin: string }) {
  const portal = portalUrl(origin);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 pt-safe backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex min-h-11 min-w-11 items-center gap-2.5 rounded-md font-display text-lg font-semibold focus-visible:outline-2"
          aria-label={`${site.name} home`}
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-primary text-primary-fg shadow-1"
          >
            <GraduationCap className="size-5" />
          </span>
          <span className="hidden sm:inline">{site.shortName}</span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks links={NAV_LINKS} />
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <a href={portal}>Parent &amp; staff login</a>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/admissions#enquiry">Apply now</Link>
          </Button>
          <MobileNav links={NAV_LINKS} portalHref={portal} />
        </div>
      </Container>
    </header>
  );
}
