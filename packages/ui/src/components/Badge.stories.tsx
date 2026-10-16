import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./Badge.tsx";

const meta = {
  title: "Data display/Badge",
  component: Badge,
  args: { children: "Enrolled", tone: "success", dot: true },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="primary">New</Badge>
      <Badge tone="success" dot>
        Paid
      </Badge>
      <Badge tone="warning" dot>
        Due in 3 days
      </Badge>
      <Badge tone="danger" dot>
        Overdue
      </Badge>
      <Badge tone="info">Leave approved</Badge>
    </div>
  ),
};
