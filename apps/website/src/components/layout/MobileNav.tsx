"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button, Sheet, SheetContent, SheetTrigger } from "@/components/ui.tsx";
import type { NavLink } from "@/lib/navigation.ts";

interface MobileNavProps {
  links: readonly NavLink[];
  portalHref: string;
}

/** Full-screen menu on phones (a slide-over from `sm`) for screens below `lg`. A Radix dialog: focus is trapped and Esc closes. */
export function MobileNav({ links, portalHref }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        title="Menu"
        closeLabel="Close menu"
        className="h-dvh w-full max-w-none sm:w-[min(24rem,100vw)]"
      >
        <nav aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {links.map((link) => {
              const current = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => {
                      setOpen(false);
                    }}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-12 items-center rounded-md px-3 text-lg font-medium hover:bg-surface-hover ${
                      current ? "bg-primary-subtle text-primary-subtle-fg" : "text-fg"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
            <Button asChild>
              <Link
                href="/admissions#enquiry"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Apply now
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <a href={portalHref}>Parent &amp; staff login</a>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
