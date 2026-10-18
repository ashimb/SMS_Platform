import { ArrowRight, CalendarCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import type { HomeContent, SiteProfile } from "@/lib/cms-types.ts";
import { formatDate } from "@/lib/format.ts";

interface HeroProps {
  hero: HomeContent["hero"];
  site: SiteProfile;
}

/**
 * Full-bleed home hero. The image is the LCP element: it is preloaded (`priority`), responsive
 * (`sizes`), served as AVIF/WebP at a modest quality, and occupies a fixed aspect so nothing
 * shifts while it loads. No entrance animation on the headline, to keep LCP fast.
 */
export function Hero({ hero, site }: HeroProps) {
  const { admissions } = site;
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-primary-950 text-white"
    >
      <Image
        src={hero.image.src}
        alt=""
        fill
        priority
        fetchPriority="high"
        quality={60}
        sizes="100vw"
        className="-z-20 object-cover object-[65%_center] sm:object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-950/90 via-primary-900/70 to-primary-900/20"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-primary-950/60 to-transparent"
      />
      <Container className="pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pt-40 lg:pb-48">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/25 backdrop-blur">
            <CalendarCheck aria-hidden="true" className="size-4" />
            {admissions.open ? hero.eyebrow : site.tagline}
          </p>
          <h1
            id="hero-title"
            className="mt-6 text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.05] font-semibold text-balance"
          >
            {hero.heading}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/90 sm:text-xl">{hero.subheading}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full bg-white text-primary-900 hover:bg-primary-50 sm:w-auto [&_svg]:size-5"
            >
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full text-white ring-1 ring-white/40 hover:bg-white/10 sm:w-auto"
            >
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
          {admissions.open && admissions.deadline ? (
            <p className="mt-6 text-sm text-white/80">
              Applications for {admissions.academicYear} close on{" "}
              <strong className="font-semibold text-white">
                {formatDate(`${admissions.deadline}T00:00:00Z`, "UTC")}
              </strong>
              .
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
