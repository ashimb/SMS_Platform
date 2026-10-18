import type { ComponentType } from "react";

import { ColumnsBlock } from "@/components/blocks/ColumnsBlock.tsx";
import { CtaBlock } from "@/components/blocks/CtaBlock.tsx";
import { FaqBlock } from "@/components/blocks/FaqBlock.tsx";
import { GalleryBlock } from "@/components/blocks/GalleryBlock.tsx";
import { HeroBlock } from "@/components/blocks/HeroBlock.tsx";
import { ImageBlock } from "@/components/blocks/ImageBlock.tsx";
import { RichTextBlock } from "@/components/blocks/RichTextBlock.tsx";
import type { BlockOf, BlockType } from "@/lib/cms-types.ts";

export type BlockComponent<T extends BlockType> = ComponentType<{ block: BlockOf<T> }>;

/**
 * One renderer per block type. The mapped type makes the registry exhaustive: adding a block to
 * the CMS schema (cms-types.ts) is a compile error here until a component is registered for it.
 */
export type BlockRegistry = { [T in BlockType]: BlockComponent<T> };

export const blockRegistry: BlockRegistry = {
  hero: HeroBlock,
  "rich-text": RichTextBlock,
  image: ImageBlock,
  gallery: GalleryBlock,
  cta: CtaBlock,
  faq: FaqBlock,
  columns: ColumnsBlock,
};
