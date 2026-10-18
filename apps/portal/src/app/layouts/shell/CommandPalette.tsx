/**
 * Command palette (Ctrl/⌘ + K): jump to any section the user can access. Built as an ARIA
 * combobox with a listbox popup, fully keyboard operable. Today it searches navigation; later
 * phases can register record search (students, receipts) through the same component.
 */
import { Dialog, DialogContent } from "@school-platform/ui";
import { CornerDownLeft, Search } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { cn } from "@/shared/utils/cn.ts";

import { OPEN_PALETTE_EVENT } from "./command-palette-events.ts";
import type { ResolvedNavGroup } from "./useNavigation.ts";

export function CommandPalette({ groups }: { groups: readonly ResolvedNavGroup[] }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => {
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return groups
      .flatMap((group) => group.items)
      .map((item) => ({ ...item, label: t(`nav.${item.key}`) }))
      .filter((item) => !needle || item.label.toLocaleLowerCase().includes(needle));
  }, [groups, query, t]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const go = (index: number) => {
    const item = items[index];
    if (!item) return;
    close();
    void navigate(item.path);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(active);
    }
  };

  const optionId = (index: number) => `${listId}-option-${String(index)}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else close();
      }}
    >
      <DialogContent
        title={t("palette.title")}
        description={t("palette.description")}
        closeLabel={t("actions.close")}
        className="md:top-[15dvh] md:translate-y-0"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search aria-hidden="true" className="size-4 text-fg-subtle" />
          <input
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={items[active] ? optionId(active) : undefined}
            aria-label={t("palette.inputLabel")}
            placeholder={t("palette.placeholder")}
            className="h-11 w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle md:pointer-fine:text-sm"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label={t("palette.results")}
          className="mt-3 max-h-80 overflow-y-auto"
        >
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-fg-muted">{t("palette.empty")}</p>
          ) : (
            items.map(({ key, label, icon: Icon }, index) => (
              // Options stay out of the tab order: focus remains in the combobox input and the
              // active option is exposed through aria-activedescendant (ARIA combobox pattern).
              <div
                key={key}
                id={optionId(index)}
                role="option"
                tabIndex={-1}
                aria-selected={index === active}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                  index === active ? "bg-primary-subtle text-primary-subtle-fg" : "text-fg",
                )}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onClick={() => {
                  go(index);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") go(index);
                }}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {index === active ? (
                  <CornerDownLeft aria-hidden="true" className="size-3.5 opacity-70" />
                ) : null}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
