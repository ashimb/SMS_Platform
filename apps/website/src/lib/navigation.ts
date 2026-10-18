export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Admissions", href: "/admissions" },
  { label: "Notices", href: "/notices" },
  { label: "Events", href: "/events" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

/** Same-site targets use next/link; everything else (mailto:, tel:, https:) is a plain anchor. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#");
}

/** The portal lives on the `portal.` subdomain of the public site (see infra/nginx/nginx.conf). */
export function portalUrl(origin: string): string {
  const url = new URL(origin);
  url.hostname = `portal.${url.hostname.replace(/^www\./, "")}`;
  return url.origin;
}
