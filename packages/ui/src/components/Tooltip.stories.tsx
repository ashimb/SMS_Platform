import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download } from "lucide-react";

import { Button } from "./Button.tsx";
import { Tooltip } from "./Tooltip.tsx";

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  args: { content: "Export as CSV", children: null },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnIconButton: Story = {
  render: (args) => (
    <div className="p-10">
      <Tooltip {...args}>
        <Button size="icon" variant="secondary" aria-label="Export">
          <Download aria-hidden="true" />
        </Button>
      </Tooltip>
    </div>
  ),
};
