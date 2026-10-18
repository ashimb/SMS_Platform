import type { ComponentType } from "react";

import { type BlockRegistry, blockRegistry } from "@/components/blocks/registry.tsx";
import type { Block } from "@/lib/cms-types.ts";

interface BlockRendererProps {
  blocks: readonly Block[];
  /** Override for tests or alternative themes. */
  registry?: BlockRegistry;
}

/** Renders validated CMS blocks in order through the typed registry. */
export function BlockRenderer({ blocks, registry = blockRegistry }: BlockRendererProps) {
  return (
    <>
      {blocks.map((block) => {
        // `block.type` selects the matching component; TypeScript cannot correlate the two
        // halves of the union here, so the lookup is widened in this one place.
        const Component = registry[block.type] as ComponentType<{ block: Block }> | undefined;
        return Component ? <Component key={block.id} block={block} /> : null;
      })}
    </>
  );
}
