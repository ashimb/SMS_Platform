import { ArrowRight, Pin } from "lucide-react";
import Link from "next/link";

import { Section, SectionHeading } from "@/components/layout/Section.tsx";
import { Badge, Button } from "@/components/ui.tsx";
import type { Notice } from "@/lib/cms-types.ts";
import { formatDate } from "@/lib/format.ts";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const CATEGORY_TONE: Record<Notice["category"], Tone> = {
  general: "neutral",
  academic: "info",
  exam: "warning",
  holiday: "success",
  admission: "primary",
  event: "primary",
};

export const CATEGORY_LABEL: Record<Notice["category"], string> = {
  general: "General",
  academic: "Academic",
  exam: "Examination",
  holiday: "Holiday",
  admission: "Admissions",
  event: "Event",
};

interface NoticeBoardProps {
  notices: readonly Notice[];
  timeZone: string;
  limit?: number;
}

/** Latest notices, pinned first. Server-rendered list: every title is a real link. */
export function NoticeBoard({ notices, timeZone, limit = 5 }: NoticeBoardProps) {
  const ordered = [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, limit);
  return (
    <Section labelledBy="notices-title" id="notices">
      <SectionHeading
        id="notices-title"
        eyebrow="Notice board"
        title="What's happening at school"
        description="Circulars, schedules and announcements for parents and students."
        action={
          <Button asChild variant="secondary">
            <Link href="/notices">
              All notices <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      {ordered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-fg-muted">
          No notices have been published yet.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-1">
          {ordered.map((notice) => (
            <li key={notice.slug}>
              <Link
                href={`/notices/${notice.slug}`}
                className="group flex flex-col gap-3 p-5 transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover sm:flex-row sm:items-center sm:gap-6 sm:p-6"
              >
                <div className="flex shrink-0 items-center gap-3 sm:w-52 sm:flex-col sm:items-start sm:gap-2">
                  <Badge tone={CATEGORY_TONE[notice.category]}>
                    {CATEGORY_LABEL[notice.category]}
                  </Badge>
                  <time dateTime={notice.publishedAt} className="text-sm text-fg-muted">
                    {formatDate(notice.publishedAt, timeZone)}
                  </time>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-lg font-semibold group-hover:text-primary-subtle-fg">
                    {notice.pinned ? (
                      <>
                        <Pin aria-hidden="true" className="size-4 shrink-0 text-primary" />
                        <span className="sr-only">Pinned: </span>
                      </>
                    ) : null}
                    <span>{notice.title}</span>
                  </h3>
                  <p className="mt-1 text-fg-muted">{notice.summary}</p>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="hidden size-5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary sm:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
