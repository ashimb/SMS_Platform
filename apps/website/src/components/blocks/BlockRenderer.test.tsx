// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BlockRenderer } from "@/components/blocks/BlockRenderer.tsx";
import { blockRegistry } from "@/components/blocks/registry.tsx";
import { type Block, blockSchema } from "@/lib/cms-types.ts";

const image = { src: "/images/gallery-1.jpg", alt: "Library", width: 1200, height: 800 };

const blocks: Block[] = [
  {
    type: "hero",
    id: "h",
    heading: "Welcome",
    subheading: "Sub",
    cta: { label: "Apply", href: "/admissions" },
  },
  {
    type: "rich-text",
    id: "r",
    html: '<h2>Story</h2><p>Hi</p><script>window.__pwned = 1</script><img src=x onerror="window.__pwned=1">',
  },
  { type: "image", id: "i", image, caption: "A caption" },
  { type: "gallery", id: "g", heading: "Photos", images: [image, { ...image, alt: "Two" }] },
  {
    type: "cta",
    id: "c",
    heading: "Join us",
    body: "Today",
    button: { label: "Visit", href: "/contact" },
  },
  {
    type: "faq",
    id: "f",
    heading: "Questions",
    items: [{ question: "Is it open?", answerHtml: "<p>Yes</p>" }],
  },
  {
    type: "columns",
    id: "col",
    columns: [
      { heading: "Learn", html: "<p>A</p>" },
      { heading: "Grow", html: "<p>B</p>" },
    ],
  },
];

describe("BlockRenderer", () => {
  it("renders every block type through the registry", () => {
    render(<BlockRenderer blocks={blocks} />);

    expect(screen.getByRole("heading", { level: 1, name: "Welcome" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Apply" })).toHaveAttribute("href", "/admissions");
    expect(screen.getByRole("heading", { name: "Story" })).toBeInTheDocument();
    expect(screen.getByText("A caption")).toBeInTheDocument();
    const gallery = screen.getByRole("region", { name: "Photos" });
    expect(within(gallery).getAllByRole("img")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Visit" })).toHaveAttribute("href", "/contact");
    expect(screen.getByText("Is it open?")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Grow" })).toBeInTheDocument();
  });

  it("sanitises rich text: no scripts or event handlers reach the DOM", () => {
    const { container } = render(<BlockRenderer blocks={blocks} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector(".prose-cms img")).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<BlockRenderer blocks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("registers a renderer for every block type in the CMS schema", () => {
    const schemaTypes = blockSchema.options.map((option) => option.shape.type.value).sort();
    expect(Object.keys(blockRegistry).sort()).toEqual(schemaTypes);
  });
});
