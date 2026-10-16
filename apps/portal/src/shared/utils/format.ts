/**
 * Locale-aware formatting for Indian schools.
 *
 * Money arrives from the API as DECIMAL strings ("12500.50") and is formatted from the string,
 * never converted to a float, so paise are never lost to rounding (Intl.NumberFormat accepts
 * exact decimal strings). Grouping follows the Indian system: ₹1,23,456.50.
 */
import { differenceInYears, format, isValid, parseISO } from "date-fns";
import { bn, enIN } from "date-fns/locale";

export type AppLocale = "en" | "bn";

/** The formatting locale for an i18next language code (unknown codes fall back to English). */
export function toAppLocale(language: string | undefined): AppLocale {
  return language?.startsWith("bn") ? "bn" : "en";
}

// Bengali text with Latin (0-9) digits, as the school prefers; `-u-nu-latn` overrides bn-IN's
// default Bengali numerals. date-fns already prints Latin digits.
const NUMBER_LOCALE: Record<AppLocale, string> = { en: "en-IN", bn: "bn-IN-u-nu-latn" };
const DATE_LOCALE = { en: enIN, bn } as const;
const DECIMAL = /^-?\d+(\.\d+)?$/;

type Decimal = `${number}`;

function asDecimal(amount: string | number): Decimal | null {
  const text = typeof amount === "number" ? String(amount) : amount.trim();
  return DECIMAL.test(text) ? (text as Decimal) : null;
}

/** ₹ amount with Indian grouping. Whole rupees drop the paise unless `alwaysPaise` is set. */
export function formatINR(
  amount: string | number,
  options: { locale?: AppLocale; alwaysPaise?: boolean; compact?: boolean } = {},
): string {
  const value = asDecimal(amount);
  if (value === null) return "—";
  const whole = !value.includes(".") || /\.0+$/.test(value);
  const formatter = new Intl.NumberFormat(NUMBER_LOCALE[options.locale ?? "en"], {
    style: "currency",
    currency: "INR",
    notation: options.compact ? "compact" : "standard",
    minimumFractionDigits: options.compact || (whole && !options.alwaysPaise) ? 0 : 2,
    maximumFractionDigits: options.compact ? 1 : 2,
  });
  return formatter.format(value);
}

export function formatNumber(value: number, locale: AppLocale = "en"): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(value);
}

export function formatPercent(value: number, locale: AppLocale = "en", digits = 1): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(value / 100);
}

/** Parse an API date ("2026-06-01") or timestamp as a local calendar date, without TZ shifts. */
export function parseApiDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}

/** 5 Jun 2026 (en) / 5 জুন 2026 (bn). */
export function formatDate(
  value: string | Date | null | undefined,
  locale: AppLocale = "en",
): string {
  if (!value) return "—";
  const date = parseApiDate(value);
  return date ? format(date, "d MMM yyyy", { locale: DATE_LOCALE[locale] }) : "—";
}

/** 5 Jun 2026, 2:30 pm */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale: AppLocale = "en",
): string {
  if (!value) return "—";
  const date = parseApiDate(value);
  return date ? format(date, "d MMM yyyy, h:mm a", { locale: DATE_LOCALE[locale] }) : "—";
}

/** Thursday, 16 October */
export function formatLongDay(value: Date, locale: AppLocale = "en"): string {
  return format(value, "EEEE, d MMMM", { locale: DATE_LOCALE[locale] });
}

export function ageOn(dateOfBirth: string, on: string | Date = new Date()): number | null {
  const dob = parseApiDate(dateOfBirth);
  const at = parseApiDate(on);
  return dob && at ? differenceInYears(at, dob) : null;
}

/** Today's date as YYYY-MM-DD in the user's time zone (for date inputs' max attribute). */
export function todayIsoDate(now: Date = new Date()): string {
  return format(now, "yyyy-MM-dd");
}
