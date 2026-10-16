import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button.tsx";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "./Dialog.tsx";

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const renderConfirmation: NonNullable<Story["render"]> = (args) => (
  <Dialog {...args}>
    <DialogTrigger asChild>
      <Button>Publish results</Button>
    </DialogTrigger>
    <DialogContent
      title="Publish results for VII-A and VII-B?"
      description="84 families will be notified on WhatsApp and in the app."
    >
      <p className="text-sm text-fg-muted">
        Changes after publishing need principal approval and create a new version.
      </p>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <Button>Publish to 84 families</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const Confirmation: Story = { render: renderConfirmation };
export const OpenByDefault: Story = { args: { defaultOpen: true }, render: renderConfirmation };
