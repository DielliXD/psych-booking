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

// ── Display formatting ────────────────────────────────────────────────
// Albanian names are spelled out here instead of relying on Intl: many
// browsers and runtimes ship without "sq" locale data and silently fall
// back to English ("Tue, Nov 3"). English uses Intl (en-GB), which every
// engine has.
const SQ = {
  weekdays: ["e diel", "e hënë", "e martë", "e mërkurë", "e enjte", "e premte", "e shtunë"],
  weekdaysShort: ["Die", "Hën", "Mar", "Mër", "Enj", "Pre", "Sht"],
  months: ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"],
  monthsShort: ["jan", "shk", "mar", "pri", "maj", "qer", "korr", "gush", "sht", "tet", "nën", "dhj"],
};

function calendarDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Pieces of a calendar date for custom layouts: { weekday: "Mar", day: 3, month: "nën" }. */
export function dateParts(date: string, locale: string): { weekday: string; day: number; month: string } {
  const dt = calendarDate(date);
  if (locale === "sq") {
    return { weekday: SQ.weekdaysShort[dt.getUTCDay()], day: dt.getUTCDate(), month: SQ.monthsShort[dt.getUTCMonth()] };
  }
  const fmt = (o: Intl.DateTimeFormatOptions) => dt.toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
  return { weekday: fmt({ weekday: "short" }), day: dt.getUTCDate(), month: fmt({ month: "short" }) };
}

/** Short label like "Tue 3 Nov" / "Mar, 3 nën" for a calendar date. */
export function formatDateLabel(date: string, locale: string): string {
  const { weekday, day, month } = dateParts(date, locale);
  return locale === "sq" ? `${weekday}, ${day} ${month}` : `${weekday} ${day} ${month}`;
}

/** Heading for a run of dates: "Nëntor 2026", or "Nëntor – Dhjetor 2026" when it spans two months. */
export function formatMonthRange(dates: string[], locale: string): string {
  if (!dates.length) return "";
  const label = (date: string, withYear: boolean) => {
    const dt = calendarDate(date);
    const name =
      locale === "sq"
        ? SQ.months[dt.getUTCMonth()]
        : dt.toLocaleDateString("en-GB", { timeZone: "UTC", month: "long" });
    const cap = name.charAt(0).toUpperCase() + name.slice(1);
    return withYear ? `${cap} ${dt.getUTCFullYear()}` : cap;
  };
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.slice(0, 7) === last.slice(0, 7)) return label(first, true);
  const sameYear = first.slice(0, 4) === last.slice(0, 4);
  return `${label(first, !sameYear)} – ${label(last, true)}`;
}

/** Long date like "3 November 2026" / "3 nëntor 2026" for a calendar date. */
export function formatLongDate(date: string, locale: string): string {
  const dt = calendarDate(date);
  if (locale === "sq") return `${dt.getUTCDate()} ${SQ.months[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
  return dt.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
}

/**
 * Format a stored UTC timestamp for display, always in clinic time.
 * dateStyle "full" → "e martë, 3 nëntor 2026, 14:00" / "Tuesday 3 November 2026 at 14:00";
 * otherwise → "3 nën 2026, 14:00" / "3 Nov 2026, 14:00". Time is added when timeStyle is set.
 */
export function formatClinicDateTime(
  instant: string | Date,
  locale: string,
  options: Pick<Intl.DateTimeFormatOptions, "dateStyle" | "timeStyle"> = { dateStyle: "medium", timeStyle: "short" }
): string {
  if (locale !== "sq") {
    return new Date(instant).toLocaleString("en-GB", { ...options, timeZone: CLINIC_TIMEZONE });
  }
  const { date, time } = utcToClinic(instant);
  const dt = calendarDate(date);
  const d = dt.getUTCDate();
  const y = dt.getUTCFullYear();
  const datePart =
    options.dateStyle === "full"
      ? `${SQ.weekdays[dt.getUTCDay()]}, ${d} ${SQ.months[dt.getUTCMonth()]} ${y}`
      : `${d} ${SQ.monthsShort[dt.getUTCMonth()]} ${y}`;
  return options.timeStyle ? `${datePart}, ${time}` : datePart;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
