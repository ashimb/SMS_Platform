import type { Meta, StoryObj } from "@storybook/react-vite";

import { VIEWPORTS } from "../../.storybook/viewports.ts";
import { Button } from "./Button.tsx";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetTrigger,
} from "./ResponsiveSheet.tsx";

const meta = {
  title: "Responsive/ResponsiveSheet",
  component: ResponsiveSheet,
  parameters: { viewport: { options: VIEWPORTS } },
  render: (args) => (
    <ResponsiveSheet {...args}>
      <ResponsiveSheetTrigger asChild>
        <Button>Publish results</Button>
      </ResponsiveSheetTrigger>
      <ResponsiveSheetContent
        title="Publish results?"
        description="84 families will be notified by SMS and email."
      >
        <p className="text-sm text-fg-muted">Marks become visible in the parent portal.</p>
        <ResponsiveSheetFooter>
          <Button>Publish</Button>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  ),
} satisfies Meta<typeof ResponsiveSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Bottom sheet with grab handle: swipe down, tap outside or press Escape to dismiss. */
export const Mobile: Story = {
  globals: { viewport: { value: "iphoneSe", isRotated: false } },
};

export const Tablet: Story = {
  globals: { viewport: { value: "ipadPortrait", isRotated: false } },
};

/** Centred modal dialog. */
export const Desktop: Story = {
  globals: { viewport: { value: "desktop1440", isRotated: false } },
};
