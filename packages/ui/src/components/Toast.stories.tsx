import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button.tsx";
import { toast, Toaster } from "./Toast.tsx";

const meta = {
  title: "Feedback/Toast",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Toaster is mounted once in the Storybook preview (as in the app shell). */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() =>
          toast.success("Attendance submitted", {
            description: "Parents of 2 absent students will be notified at 09:12.",
            action: { label: "Undo", onClick: () => undefined },
          })
        }
      >
        Success
      </Button>
      <Button variant="secondary" onClick={() => toast.info("Timetable updated from Monday")}>
        Info
      </Button>
      <Button variant="secondary" onClick={() => toast.warning("2 sections not marked by 10:00")}>
        Warning
      </Button>
      <Button variant="danger" onClick={() => toast.error("Couldn't send the notice. Try again.")}>
        Error
      </Button>
    </div>
  ),
};
