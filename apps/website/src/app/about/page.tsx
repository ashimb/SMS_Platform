import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/blocks/BlockRenderer.tsx";
import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { getPage, getSite } from "@/lib/cms-client.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [site, page] = await Promise.all([getSite(), getPage("about")]);
  if (!page) return {};
  return pageMetadata({ site, title: page.title, description: page.description, path: "/about" });
}

export default async function AboutPage() {
  const page = await getPage("about");
  if (!page) notFound();
  // A leading hero block carries the page's h1; otherwise use the standard header.
  const hasHero = page.blocks[0]?.type === "hero";
  return (
    <>
      {hasHero ? null : <PageHeader title={page.title} description={page.description} />}
      <BlockRenderer blocks={page.blocks} />
    </>
  );
}
