import { Button } from "@school-platform/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber, toAppLocale } from "@/shared/utils/format.ts";

export interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** Server-side pagination controls with a live "Showing x–y of z" summary. */
export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  disabled,
}: PaginationProps) {
  const { t, i18n } = useTranslation("common");
  const locale = toAppLocale(i18n.language);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row"
    >
      <p className="text-sm text-fg-muted" aria-live="polite">
        {t("pagination.summary", {
          from: formatNumber(from, locale),
          to: formatNumber(to, locale),
          total: formatNumber(total, locale),
        })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            onPageChange(page - 1);
          }}
          disabled={disabled === true || page <= 1}
        >
          <ChevronLeft aria-hidden="true" />
          {t("pagination.previous")}
        </Button>
        <span className="min-w-20 text-center text-sm text-fg-muted tabular-nums">
          {t("pagination.page", { page, pages: Math.max(pageCount, 1) })}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            onPageChange(page + 1);
          }}
          disabled={disabled === true || page >= pageCount}
        >
          {t("pagination.next")}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
