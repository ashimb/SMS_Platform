import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar } from "./Avatar.tsx";

const meta = {
  title: "Data display/Avatar",
  component: Avatar,
  args: { name: "Priya Sharma" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar name="Aarav Sharma" size="xs" />
      <Avatar name="Diya Iyer" size="sm" />
      <Avatar name="Kabir Khan" size="md" />
      <Avatar name="Meera Nair" size="lg" />
      <Avatar name="प्रिया शर्मा" size="xl" />
    </div>
  ),
};
