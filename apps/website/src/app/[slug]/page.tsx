import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/blocks/BlockRenderer.tsx";
import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { getPage, getPageSlugs, getSite, RESERVED_SLUGS } from "@/lib/cms-client.ts";
import { pageMetadata } from "@/lib/seo.ts";

/** Generic CMS pages (facilities, policies, ...). Dedicated routes win over this one. */
export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  try {
    return (await getPageSlugs())
      .filter((slug) => !RESERVED_SLUGS.includes(slug))
      .map((slug) => ({ slug }));
  } catch {
    return []; // CMS unreachable at build time: pages render on first request (ISR)
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) return {};
  const [site, page] = await Promise.all([getSite(), getPage(slug)]);
  if (!page) return {};
  return pageMetadata({
    site,
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
  });
}

export default async function CmsPage({ params }: { params: Params }) {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug)) notFound();
  const page = await getPage(slug);
  if (!page) notFound();

  const hasHero = page.blocks[0]?.type === "hero";
  return (
    <>
      {hasHero ? null : <PageHeader title={page.title} description={page.description} />}
      <BlockRenderer blocks={page.blocks} />
    </>
  );
}
