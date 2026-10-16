import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./Badge.tsx";
import { Button } from "./Button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card.tsx";

const meta = {
  title: "Layout/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quarter 2 fees</CardTitle>
          <Badge tone="warning" dot>
            Due 20 Oct
          </Badge>
        </div>
        <CardDescription>Aarav Sharma · Class VII-B</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-semibold tabular-nums">₹18,500</p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary">View breakdown</Button>
        <Button>Pay now</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  args: { interactive: true },
  render: (args) => (
    <Card {...args} className="max-w-xs p-5">
      <a
        href="#attendance"
        className="flex flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="font-semibold">Attendance</span>
        <span className="text-sm text-fg-muted">Mark today's register for VII-B</span>
      </a>
    </Card>
  ),
};
