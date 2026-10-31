// Time zone helpers. Every booking time in this app is "clinic time" —
// the zone the psychologist works in — no matter where the server runs
// (Vercel runs in UTC) or where the patient's browser is.
//
// Dates travel around as plain strings: "YYYY-MM-DD" and "HH:mm".
// They are only turned into real UTC instants (for the database) via
// clinicTimeToUtc(), and back into clinic time via utcToClinic().

export const CLINIC_TIMEZONE = process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "Europe/Belgrade";

function partsInZone(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24, // some engines print midnight as "24"
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

// How far ahead of UTC the zone is at a given instant, in ms (e.g. +1h in winter).
function offsetMs(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-11-03" + "14:00" in clinic time → the real UTC instant. Handles DST. */
export function clinicTimeToUtc(date: string, time: string, timeZone = CLINIC_TIMEZONE): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  const first = naive - offsetMs(new Date(naive), timeZone);
  const second = naive - offsetMs(new Date(first), timeZone);
  return new Date(second);
}

/** UTC instant → { date: "YYYY-MM-DD", time: "HH:mm" } in clinic time. */
export function utcToClinic(instant: Date | string, timeZone = CLINIC_TIMEZONE) {
  const p = partsInZone(new Date(instant), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** Today's date in clinic time, "YYYY-MM-DD". */
export function todayInClinic(timeZone = CLINIC_TIMEZONE): string {
  return utcToClinic(new Date(), timeZone).date;
}

/** Pure calendar arithmetic on "YYYY-MM-DD" strings — no time zone involved. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a "YYYY-MM-DD" calendar date. */
export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Short label like "Tue, 3 Nov" for a calendar date in the given UI locale. */
export function formatDateLabel(date: string, locale: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(toIntlLocale(locale), {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Format a stored UTC timestamp for display, always in clinic time. */
export function formatClinicDateTime(
  instant: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }
): string {
  return new Date(instant).toLocaleString(toIntlLocale(locale), { ...options, timeZone: CLINIC_TIMEZONE });
}

function toIntlLocale(locale: string): string {
  if (locale === "sq") return "sq-AL";
  if (locale === "en") return "en-GB";
  return locale;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
