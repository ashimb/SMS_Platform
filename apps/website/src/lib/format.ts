/** Date helpers. Pure functions on ISO strings, always rendered in the school's timezone. */
const LOCALE = "en-IN";

export function formatDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone }).format(new Date(iso));
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { timeStyle: "short", timeZone }).format(new Date(iso));
}

export function formatDateRange(startIso: string, endIso: string | undefined, timeZone: string) {
  const start = formatDate(startIso, timeZone);
  if (!endIso) return start;
  const end = formatDate(endIso, timeZone);
  return start === end ? start : `${start} – ${end}`;
}

/** Day number and short month for calendar tiles. */
export function dateTile(iso: string, timeZone: string): { day: string; month: string } {
  const date = new Date(iso);
  return {
    day: new Intl.DateTimeFormat(LOCALE, { day: "numeric", timeZone }).format(date),
    month: new Intl.DateTimeFormat(LOCALE, { month: "short", timeZone }).format(date),
  };
}

/** Compact number for stats (1,850). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}
