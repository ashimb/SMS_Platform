/** Metadata and structured-data helpers (Next.js Metadata API, schema.org via schema-dts). */
import type { Metadata } from "next";
import type { EducationalOrganization, WithContext } from "schema-dts";

import type { SiteProfile } from "@/lib/cms-types.ts";

export const OG_IMAGE = { url: "/images/og.jpg", width: 1200, height: 630 } as const;

export interface PageMetaInput {
  site: SiteProfile;
  /** Page title without the site name (the layout template appends it). */
  title: string;
  description: string;
  /** Root-relative path, used for the canonical URL and og:url. */
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
}

export function pageMetadata({
  site,
  title,
  description,
  path,
  type = "website",
  publishedTime,
}: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: site.name,
      title,
      description,
      url: path,
      locale: "en_IN",
      images: [{ ...OG_IMAGE, alt: site.name }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** schema.org EducationalOrganization for the whole site (rendered once in the root layout). */
export function educationalOrganizationJsonLd(
  site: SiteProfile,
  origin: string,
): WithContext<EducationalOrganization> {
  const { contact } = site;
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.name,
    description: site.description,
    url: origin,
    ...(site.logoUrl ? { logo: new URL(site.logoUrl, origin).toString() } : {}),
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.street,
      addressLocality: contact.city,
      addressRegion: contact.region,
      postalCode: contact.postalCode,
      addressCountry: contact.country,
    },
    sameAs: site.social.map((link) => link.href).filter((href) => href.startsWith("https://")),
  };
}
