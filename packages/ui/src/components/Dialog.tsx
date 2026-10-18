import {
  ResponsiveSheet,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  type ResponsiveSheetContentProps,
  ResponsiveSheetFooter,
  ResponsiveSheetOverlay,
  ResponsiveSheetTrigger,
} from "./ResponsiveSheet.tsx";

/**
 * Dialog: the ResponsiveSheet under its established name. A centered modal from `md` up and a
 * swipe-dismissible bottom sheet on phones. Focus is trapped and returned to the trigger on
 * close, Escape closes, the background is inert, and a title is mandatory (it names the dialog).
 */
export const Dialog = ResponsiveSheet;
export const DialogTrigger = ResponsiveSheetTrigger;
export const DialogClose = ResponsiveSheetClose;
export const DialogOverlay = ResponsiveSheetOverlay;
export const DialogContent = ResponsiveSheetContent;
export type DialogContentProps = ResponsiveSheetContentProps;
export const DialogFooter = ResponsiveSheetFooter;
