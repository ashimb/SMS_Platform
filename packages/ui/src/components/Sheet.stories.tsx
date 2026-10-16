import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button.tsx";
import { Checkbox } from "./Checkbox.tsx";
import { Sheet, SheetContent, SheetTrigger } from "./Sheet.tsx";

const meta = {
  title: "Overlays/Sheet",
  component: SheetContent,
  args: {
    title: "Filter students",
    description: "Narrow the list by class and status.",
    side: "right",
  },
  argTypes: { side: { control: "inline-radio", options: ["right", "left", "bottom"] } },
} satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const renderSheet: NonNullable<Story["render"]> = (args) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="secondary">Filters</Button>
    </SheetTrigger>
    <SheetContent {...args}>
      <div className="flex flex-col gap-4">
        <Checkbox label="Enrolled" defaultChecked />
        <Checkbox label="Provisional" />
        <Checkbox label="Withdrawn" />
      </div>
    </SheetContent>
  </Sheet>
);

export const Right: Story = { render: renderSheet };
export const BottomOnMobile: Story = { args: { side: "bottom" }, render: renderSheet };
