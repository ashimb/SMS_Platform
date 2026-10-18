import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import type { SiteProfile } from "@/lib/cms-types.ts";
import { formatDate } from "@/lib/format.ts";

export function AdmissionsCTA({ site }: { site: SiteProfile }) {
  const { admissions, contact } = site;
  return (
    <section aria-labelledby="cta-title" className="py-16 sm:py-20">
      <Container>
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary-800 px-6 py-14 text-center text-white shadow-4 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(60%_90%_at_10%_0%,var(--sp-primary-500)_0%,transparent_65%),radial-gradient(60%_90%_at_90%_100%,var(--sp-primary-950)_0%,transparent_70%)] opacity-80"
          />
          <h2 id="cta-title" className="mx-auto max-w-2xl text-3xl font-semibold sm:text-5xl">
            {admissions.open
              ? `Admissions are open for ${admissions.academicYear}`
              : "Admissions will reopen soon"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
            {admissions.open
              ? "Tell us about your child and our admissions team will call you within two working days."
              : "Leave your details and we will let you know as soon as applications open."}
            {admissions.open && admissions.deadline
              ? ` Applications close on ${formatDate(`${admissions.deadline}T00:00:00Z`, "UTC")}.`
              : ""}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary-900 hover:bg-primary-50 [&_svg]:size-5"
            >
              <Link href="/admissions#enquiry">
                Start your enquiry <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-white ring-1 ring-white/40 hover:bg-white/10"
            >
              <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>
                <Phone aria-hidden="true" /> {contact.phone}
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
