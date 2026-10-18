import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { DevOverflowDetector } from "@/components/dev/DevOverflowDetector.tsx";
import { Footer } from "@/components/layout/Footer.tsx";
import { Header } from "@/components/layout/Header.tsx";
import { StickyMobileCta } from "@/components/layout/StickyMobileCta.tsx";
import { JsonLd } from "@/components/security/JsonLd.tsx";
import { getSite } from "@/lib/cms-client.ts";
import { siteOrigin } from "@/lib/env.ts";
import { educationalOrganizationJsonLd, OG_IMAGE } from "@/lib/seo.ts";
import { siteTheme } from "@/lib/theme.ts";

/**
 * One self-hosted variable font (Inter, latin subset, SIL OFL: see src/fonts). `swap` shows text
 * immediately; next/font generates a metric-matched fallback so the swap does not shift layout.
 */
const inter = localFont({
  src: "../fonts/Inter-latin-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    metadataBase: new URL(siteOrigin()),
    title: { default: site.name, template: `%s | ${site.shortName}` },
    description: site.description,
    applicationName: site.name,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_IN",
      images: [{ ...OG_IMAGE, alt: site.name }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const site = await getSite();
  const origin = siteOrigin();
  const theme = siteTheme(site);

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Tenant brand variables, rendered into the first HTML bytes: no flash of unbranded content. */}
        {theme.css ? <style id="tenant-theme">{theme.css}</style> : null}
      </head>
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-fg antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Header site={site} origin={origin} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer site={site} origin={origin} />
        <StickyMobileCta />
        {process.env.NODE_ENV === "development" ? <DevOverflowDetector /> : null}
        <JsonLd data={educationalOrganizationJsonLd(site, origin)} />
      </body>
    </html>
  );
}
