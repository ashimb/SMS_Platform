"use client";

/**
 * Client boundary for the shared UI kit.
 *
 * `@school-platform/ui` mixes hook-based and presentational components in one entry, and some
 * modules create React context at import time, which React Server Components cannot evaluate.
 * Re-exporting from a "use client" module makes every symbol a client reference, so server
 * components can render `<Button asChild><Link/></Button>` or `<Badge>` without importing the
 * kit's internals. Only import UI kit components through this file.
 */
export {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
  Input,
  Select,
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
  Textarea,
} from "@school-platform/ui";
