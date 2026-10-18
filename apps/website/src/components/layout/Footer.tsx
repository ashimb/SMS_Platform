import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/Section.tsx";
import type { SiteProfile } from "@/lib/cms-types.ts";
import { NAV_LINKS, portalUrl } from "@/lib/navigation.ts";

function mapsSearchUrl(site: SiteProfile): string {
  const { street, city, region, postalCode } = site.contact;
  const query = encodeURIComponent(`${site.name}, ${street}, ${city}, ${region} ${postalCode}`);
  return `https://www.openstreetmap.org/search?query=${query}`;
}

export function Footer({ site, origin }: { site: SiteProfile; origin: string }) {
  const { contact } = site;
  const year = new Date().getUTCFullYear();
  return (
    <footer className="mt-auto bg-primary-950 text-white/85">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.8fr_1.2fr_1.2fr]">
          <div>
            <p className="flex items-center gap-2.5 font-display text-xl font-semibold text-white">
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20"
              >
                <GraduationCap className="size-5" />
              </span>
              {site.name}
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">{site.tagline}</p>
            {site.social.length > 0 ? (
              <ul aria-label="Social media" className="mt-6 flex flex-wrap gap-x-5 text-sm">
                {site.social.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:text-white hover:underline"
                    >
                      {link.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Explore</h2>
            <ul className="mt-4 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={portalUrl(origin)}
                  className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:text-white hover:underline"
                >
                  Parent &amp; staff login
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Contact</h2>
            <address className="mt-4 space-y-3 text-sm not-italic">
              <p className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-300" />
                <span>
                  {contact.street}, {contact.city}, {contact.region} {contact.postalCode}
                </span>
              </p>
              <p className="flex gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-300" />
                <a
                  href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:text-white hover:underline"
                >
                  {contact.phone}
                </a>
              </p>
              <p className="flex gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-300" />
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:text-white hover:underline"
                >
                  {contact.email}
                </a>
              </p>
              {contact.hours ? <p className="pl-7 text-white/70">{contact.hours}</p> : null}
            </address>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Find us</h2>
            {/* Placeholder until an approved map provider is chosen (see docs/DEFERRED.md P5-04). */}
            <a
              href={mapsSearchUrl(site)}
              rel="noopener noreferrer"
              target="_blank"
              className="mt-4 grid aspect-[4/3] place-items-center rounded-xl border border-white/15 bg-[linear-gradient(135deg,rgb(255_255_255/0.06)_25%,transparent_25%,transparent_50%,rgb(255_255_255/0.06)_50%,rgb(255_255_255/0.06)_75%,transparent_75%)] bg-[length:24px_24px] text-center text-sm transition-colors hover:border-white/40"
            >
              <span className="flex flex-col items-center gap-2">
                <MapPin aria-hidden="true" className="size-6 text-primary-300" />
                <span>
                  Open campus location
                  <span className="sr-only"> in a new tab</span>
                </span>
              </span>
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>
            <Link
              href="/privacy-policy"
              className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:text-white hover:underline"
            >
              Privacy policy
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
