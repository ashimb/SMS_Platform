import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, MoreHorizontal, Pencil, Printer } from "lucide-react";

import { Button } from "./Button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu.tsx";

const meta = {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RowActions: Story = {
  render: (args) => (
    <div className="flex justify-end p-10">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Actions for Aarav Sharma">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Student</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil aria-hidden="true" /> Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Printer aria-hidden="true" /> Print bonafide certificate
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Transfer (pending dues check)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>
            <Archive aria-hidden="true" /> Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};
