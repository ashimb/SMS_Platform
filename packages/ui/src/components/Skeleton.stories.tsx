import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "./Skeleton.tsx";

const meta = {
  title: "Feedback/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileCard: Story = {
  render: () => (
    <div aria-busy="true" aria-label="Loading profile" className="flex max-w-sm items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  ),
};
