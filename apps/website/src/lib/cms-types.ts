/**
 * Typed contract for the public CMS endpoints (served by the API's cms module, FRD FR-CMS-*).
 *
 * Every response is validated against these schemas at the boundary, so a malformed or malicious
 * payload fails loudly instead of reaching a component. Links and image sources are restricted to
 * safe forms; rich text is plain HTML that is sanitised again at render time (components/security).
 */
import { z } from "zod";

function hasControlCharacter(value: string): boolean {
  return [...value].some((char) => char.charCodeAt(0) < 0x20);
}

/** Root-relative path, or an http(s)/mailto/tel URL. Rejects javascript:, data:, `//host`. */
export function isSafeHref(value: string): boolean {
  if (hasControlCharacter(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/\\");
  if (value.startsWith("#")) return true;
  try {
    return ["https:", "http:", "mailto:", "tel:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Images are served from this site (`/images/...`) or an https media host. */
export function isSafeImageSrc(value: string): boolean {
  if (hasControlCharacter(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/\\");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const hrefSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(isSafeHref, "Unsafe or malformed link");

export const imageSchema = z.object({
  src: z.string().min(1).max(2048).refine(isSafeImageSrc, "Unsafe image source"),
  /** Empty string marks a decorative image. */
  alt: z.string().max(300),
  width: z.number().int().positive().max(8000),
  height: z.number().int().positive().max(8000),
});
export type CmsImage = z.infer<typeof imageSchema>;

const linkSchema = z.object({ label: z.string().min(1).max(60), href: hrefSchema });
export type CmsLink = z.infer<typeof linkSchema>;

const idSchema = z.string().min(1).max(64);
const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug")
  .max(80);
const isoDateTime = z.iso.datetime({ offset: true });
const html = z.string().max(100_000);

// ---- Blocks -------------------------------------------------------------------------------------

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    id: idSchema,
    heading: z.string().min(1).max(160),
    subheading: z.string().max(400).optional(),
    image: imageSchema.optional(),
    cta: linkSchema.optional(),
  }),
  z.object({ type: z.literal("rich-text"), id: idSchema, html }),
  z.object({
    type: z.literal("image"),
    id: idSchema,
    image: imageSchema,
    caption: z.string().max(300).optional(),
  }),
  z.object({
    type: z.literal("gallery"),
    id: idSchema,
    heading: z.string().max(160).optional(),
    images: z.array(imageSchema).min(1).max(24),
  }),
  z.object({
    type: z.literal("cta"),
    id: idSchema,
    heading: z.string().min(1).max(160),
    body: z.string().max(400).optional(),
    button: linkSchema,
  }),
  z.object({
    type: z.literal("faq"),
    id: idSchema,
    heading: z.string().max(160).optional(),
    items: z
      .array(z.object({ question: z.string().min(1).max(300), answerHtml: html }))
      .min(1)
      .max(40),
  }),
  z.object({
    type: z.literal("columns"),
    id: idSchema,
    columns: z
      .array(
        z.object({
          heading: z.string().max(120).optional(),
          html,
          image: imageSchema.optional(),
        }),
      )
      .min(2)
      .max(4),
  }),
]);
export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

// ---- Content types ------------------------------------------------------------------------------

export const pageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(160),
  description: z.string().max(320),
  updatedAt: isoDateTime,
  blocks: z.array(blockSchema).max(60),
});
export type CmsPage = z.infer<typeof pageSchema>;

export const NOTICE_CATEGORIES = [
  "general",
  "academic",
  "exam",
  "holiday",
  "admission",
  "event",
] as const;

export const noticeSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  summary: z.string().max(400),
  category: z.enum(NOTICE_CATEGORIES),
  publishedAt: isoDateTime,
  pinned: z.boolean().default(false),
  bodyHtml: html,
});
export type Notice = z.infer<typeof noticeSchema>;

export const eventSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  summary: z.string().max(400),
  startsAt: isoDateTime,
  endsAt: isoDateTime.optional(),
  location: z.string().max(200),
  image: imageSchema.optional(),
  bodyHtml: html,
});
export type CmsEvent = z.infer<typeof eventSchema>;

export const galleryItemSchema = imageSchema.extend({
  id: idSchema,
  caption: z.string().max(300).optional(),
});
export type GalleryItem = z.infer<typeof galleryItemSchema>;

export const testimonialSchema = z.object({
  id: idSchema,
  quote: z.string().min(1).max(600),
  author: z.string().min(1).max(100),
  role: z.string().max(120),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

export const statSchema = z.object({
  label: z.string().min(1).max(60),
  value: z.number().nonnegative().max(1_000_000_000),
  suffix: z.string().max(8).optional(),
});
export type Stat = z.infer<typeof statSchema>;

/** Site-wide identity, contact details and tenant brand (applied server-side as CSS variables). */
export const siteSchema = z.object({
  name: z.string().min(1).max(120),
  shortName: z.string().min(1).max(40),
  tagline: z.string().max(200),
  description: z.string().max(320),
  timezone: z.string().max(64).default("Asia/Kolkata"),
  logoUrl: z.string().max(2048).refine(isSafeImageSrc, "Unsafe logo URL").optional(),
  theme: z.object({
    primaryColor: z.string().max(9).optional(),
    font: z.string().max(40).optional(),
  }),
  contact: z.object({
    street: z.string().max(200),
    city: z.string().max(80),
    region: z.string().max(80),
    postalCode: z.string().max(20),
    country: z.string().length(2),
    phone: z.string().max(40),
    email: z.email().max(254),
    hours: z.string().max(120).optional(),
  }),
  social: z.array(linkSchema).max(8),
  admissions: z.object({
    open: z.boolean(),
    academicYear: z.string().max(20),
    deadline: z.iso.date().optional(),
  }),
});
export type SiteProfile = z.infer<typeof siteSchema>;

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string().max(80),
    heading: z.string().min(1).max(160),
    subheading: z.string().max(400),
    image: imageSchema,
    primaryCta: linkSchema,
    secondaryCta: linkSchema,
  }),
  stats: z.array(statSchema).min(1).max(6),
  testimonials: z.array(testimonialSchema).max(12),
});
export type HomeContent = z.infer<typeof homeSchema>;

export const noticeListSchema = z.array(noticeSchema).max(500);
export const eventListSchema = z.array(eventSchema).max(500);
export const galleryListSchema = z.array(galleryItemSchema).max(500);
export const pageSlugListSchema = z.array(slugSchema).max(500);
