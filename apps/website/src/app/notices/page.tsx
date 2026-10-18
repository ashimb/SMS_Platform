import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { CATEGORY_LABEL, CATEGORY_TONE } from "@/components/sections/NoticeBoard.tsx";
import { Badge } from "@/components/ui.tsx";
import { getNotices, getSite } from "@/lib/cms-client.ts";
import { formatDate } from "@/lib/format.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    site,
    title: "Notices",
    description: `Circulars, schedules and announcements from ${site.name}.`,
    path: "/notices",
  });
}

export default async function NoticesPage() {
  const [site, notices] = await Promise.all([getSite(), getNotices()]);
  return (
    <>
      <PageHeader
        title="Notices"
        description="Circulars, schedules and announcements for parents and students."
      />
      <Container className="py-12 sm:py-16">
        {notices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong p-10 text-center text-fg-muted">
            No notices have been published yet.
          </p>
        ) : (
          <ul className="mx-auto max-w-4xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-1">
            {notices.map((notice) => (
              <li key={notice.slug}>
                <Link
                  href={`/notices/${notice.slug}`}
                  className="block p-5 transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={CATEGORY_TONE[notice.category]}>
                      {CATEGORY_LABEL[notice.category]}
                    </Badge>
                    <time dateTime={notice.publishedAt} className="text-sm text-fg-muted">
                      {formatDate(notice.publishedAt, site.timezone)}
                    </time>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{notice.title}</h2>
                  <p className="mt-1 text-fg-muted">{notice.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
