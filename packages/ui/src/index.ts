/** @school-platform/ui — design tokens, tenant theming, and accessible React components. */

// Theme and tokens
export { cn } from "./lib/cn.ts";
export { controlHeight, fieldBase, focusRing, touchHitArea } from "./lib/styles.ts";

// Responsive hooks (breakpoints, media queries, swipe-to-dismiss, scroll affordance)
export * from "./hooks/index.ts";
export * from "./theme/index.ts";
export * as tokens from "./tokens/index.ts";

// Components
export { Avatar, type AvatarProps, initials } from "./components/Avatar.tsx";
export { Badge, type BadgeProps, badgeVariants } from "./components/Badge.tsx";
export { Button, type ButtonProps, buttonVariants } from "./components/Button.tsx";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  type CardProps,
  CardTitle,
} from "./components/Card.tsx";
export { Checkbox, type CheckboxProps } from "./components/Checkbox.tsx";
export {
  createDataTableColumnHelper,
  DataTable,
  type DataTableFeatures,
  dataTableFeatures,
  type DataTableProps,
  DataTableView,
  useDataTable,
} from "./components/DataTable.tsx";
export {
  Dialog,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogFooter,
  DialogOverlay,
  DialogTrigger,
} from "./components/Dialog.tsx";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/DropdownMenu.tsx";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState.tsx";
export { FilterSheet, type FilterSheetProps } from "./components/FilterSheet.tsx";
export {
  type FieldControlProps,
  FormField,
  type FormFieldProps,
  useFormField,
} from "./components/FormField.tsx";
export { FormGrid, FormGridFull, type FormGridProps } from "./components/FormGrid.tsx";
export { Input, type InputProps } from "./components/Input.tsx";
export { PageContainer, type PageContainerProps } from "./components/PageContainer.tsx";
export { PageHeader, type PageHeaderProps } from "./components/PageHeader.tsx";
export {
  type MobileCardLayout,
  ResponsiveDataTable,
  type ResponsiveDataTableProps,
} from "./components/ResponsiveDataTable.tsx";
export {
  ResponsiveSheet,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  type ResponsiveSheetContentProps,
  ResponsiveSheetFooter,
  ResponsiveSheetOverlay,
  ResponsiveSheetTrigger,
} from "./components/ResponsiveSheet.tsx";
export { Select, type SelectOption, type SelectProps } from "./components/Select.tsx";
export {
  Sheet,
  SheetClose,
  SheetContent,
  type SheetContentProps,
  SheetTrigger,
} from "./components/Sheet.tsx";
export { Skeleton } from "./components/Skeleton.tsx";
export { Spinner, type SpinnerProps } from "./components/Spinner.tsx";
export { StatCard, type StatCardProps, type StatDelta } from "./components/StatCard.tsx";
export { StatCardGrid } from "./components/StatCardGrid.tsx";
export { StickyActionBar, type StickyActionBarProps } from "./components/StickyActionBar.tsx";
export { Switch, type SwitchProps } from "./components/Switch.tsx";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/Tabs.tsx";
export { Textarea, type TextareaProps } from "./components/Textarea.tsx";
export { toast, Toaster } from "./components/Toast.tsx";
export { Tooltip, type TooltipProps, TooltipProvider } from "./components/Tooltip.tsx";
