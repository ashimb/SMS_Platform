import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { CATEGORY_LABEL } from "@/components/sections/NoticeBoard.tsx";
import { SafeHtml } from "@/components/security/SafeHtml.tsx";
import { getNotice, getNotices, getSite } from "@/lib/cms-client.ts";
import { formatDate } from "@/lib/format.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  try {
    return (await getNotices()).map((notice) => ({ slug: notice.slug }));
  } catch {
    return []; // CMS unreachable at build time: pages render on first request (ISR)
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [site, notice] = await Promise.all([getSite(), getNotice(slug)]);
  if (!notice) return {};
  return pageMetadata({
    site,
    title: notice.title,
    description: notice.summary,
    path: `/notices/${notice.slug}`,
    type: "article",
    publishedTime: notice.publishedAt,
  });
}

export default async function NoticePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [site, notice] = await Promise.all([getSite(), getNotice(slug)]);
  if (!notice) notFound();

  return (
    <>
      <PageHeader
        eyebrow={CATEGORY_LABEL[notice.category]}
        title={notice.title}
        trail={[{ label: "Notices", href: "/notices" }]}
      />
      <Container className="py-12 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <p className="mb-8 text-sm text-fg-muted">
            Published{" "}
            <time dateTime={notice.publishedAt}>
              {formatDate(notice.publishedAt, site.timezone)}
            </time>
          </p>
          <SafeHtml html={notice.bodyHtml} />
          <Link
            href="/notices"
            className="mt-12 inline-flex min-h-11 items-center gap-2 font-medium text-primary-subtle-fg underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> All notices
          </Link>
        </article>
      </Container>
    </>
  );
}
