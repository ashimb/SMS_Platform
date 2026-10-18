import { CalendarDays, Phone } from "lucide-react";
import type { Metadata } from "next";

import { BlockRenderer } from "@/components/blocks/BlockRenderer.tsx";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm.tsx";
import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { getPage, getSite } from "@/lib/cms-client.ts";
import { formatDate } from "@/lib/format.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    site,
    title: "Admissions",
    description: `Apply to ${site.name} for ${site.admissions.academicYear}. Send an enquiry and our admissions team will call you.`,
    path: "/admissions",
  });
}

export default async function AdmissionsPage() {
  const [site, page] = await Promise.all([getSite(), getPage("admissions")]);
  const { admissions, contact } = site;
  return (
    <>
      <PageHeader
        eyebrow={`Academic year ${admissions.academicYear}`}
        title="Admissions"
        description={
          admissions.open
            ? "Join a school where every child is known by name. Start with a short enquiry."
            : "Admissions are currently closed. Leave an enquiry and we will contact you when they reopen."
        }
      />
      {page ? <BlockRenderer blocks={page.blocks} /> : null}
      <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-20 py-12 sm:py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-2 sm:p-8">
            <h2 id="enquiry-title" className="text-2xl font-semibold sm:text-3xl">
              Send an enquiry
            </h2>
            <p className="mt-2 mb-8 text-fg-muted">
              Fields marked required help us reach you. We reply within two working days.
            </p>
            <EnquiryForm />
          </div>
          <aside aria-label="Admissions help" className="space-y-5">
            {admissions.deadline ? (
              <div className="rounded-2xl border border-border bg-surface-sunken p-6">
                <CalendarDays aria-hidden="true" className="size-6 text-primary" />
                <h3 className="mt-3 text-lg font-semibold">Application deadline</h3>
                <p className="mt-1 text-fg-muted">
                  {formatDate(`${admissions.deadline}T00:00:00Z`, "UTC")}
                </p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-border bg-surface-sunken p-6">
              <Phone aria-hidden="true" className="size-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">Prefer to talk?</h3>
              <p className="mt-1 text-fg-muted">
                Call the admissions desk on{" "}
                <a
                  className="font-medium text-primary-subtle-fg underline underline-offset-4"
                  href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                >
                  {contact.phone}
                </a>
                .
              </p>
              {contact.hours ? (
                <p className="mt-2 text-sm text-fg-subtle">{contact.hours}</p>
              ) : null}
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
