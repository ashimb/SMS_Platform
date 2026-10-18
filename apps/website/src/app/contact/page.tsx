import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import { getSite } from "@/lib/cms-client.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    site,
    title: "Contact",
    description: `Address, phone and email for ${site.name}, and how to book a campus visit.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const site = await getSite();
  const { contact } = site;
  const rows = [
    {
      icon: MapPin,
      label: "Address",
      value: `${contact.street}, ${contact.city}, ${contact.region} ${contact.postalCode}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/[^+\d]/g, "")}`,
    },
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    ...(contact.hours ? [{ icon: Clock, label: "Office hours", value: contact.hours }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Contact us"
        description="We would love to hear from you. Visit, call or write to us."
      />
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-2">
        <section aria-labelledby="contact-details" className="min-w-0">
          <h2 id="contact-details" className="text-2xl font-semibold">
            Get in touch
          </h2>
          <dl className="mt-6 space-y-6">
            {rows.map(({ icon: Icon, label, value, ...rest }) => (
              <div key={label} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-subtle text-primary-subtle-fg"
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm font-semibold text-fg-muted">{label}</dt>
                  <dd className="text-lg break-words">
                    {"href" in rest ? (
                      <a
                        href={rest.href}
                        className="inline-flex min-h-11 max-w-full items-center break-all text-primary-subtle-fg underline underline-offset-4"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <div className="mt-10 rounded-2xl border border-border bg-surface-sunken p-6">
            <h3 className="text-lg font-semibold">Book a campus visit</h3>
            <p className="mt-1 text-fg-muted">
              Tours run every Saturday, 10:00–12:00. Send an enquiry and we will confirm a slot.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admissions#enquiry">Send an enquiry</Link>
            </Button>
          </div>
        </section>
        <section aria-labelledby="map-title" className="min-w-0">
          <h2 id="map-title" className="text-2xl font-semibold">
            Find us
          </h2>
          {/* Placeholder until a map provider is approved (docs/DEFERRED.md P5-04). */}
          <div
            role="img"
            aria-label="Map of the school location (placeholder)"
            className="mt-6 grid aspect-[4/3] place-items-center rounded-2xl border border-border bg-[linear-gradient(135deg,var(--sp-primary-100)_25%,transparent_25%,transparent_50%,var(--sp-primary-100)_50%,var(--sp-primary-100)_75%,transparent_75%)] bg-[length:28px_28px] text-center"
          >
            <span className="flex flex-col items-center gap-2 rounded-xl bg-surface/90 px-5 py-4 shadow-2">
              <MapPin aria-hidden="true" className="size-7 text-primary" />
              <span className="font-medium">{site.name}</span>
              <span className="text-sm text-fg-muted">Interactive map coming soon</span>
            </span>
          </div>
        </section>
      </Container>
    </>
  );
}
