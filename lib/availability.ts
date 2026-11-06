// SERVER-SIDE ONLY — uses the service role key (via supabaseAdmin) so it can
// see existing bookings, which are intentionally hidden from the public by RLS.
// The browser asks for slots through /api/availability instead (see
// lib/availabilityClient.ts).
import { supabaseAdmin } from "./supabaseAdmin";
import { addDays, clinicTimeToUtc, dayOfWeek, DATE_RE, todayInClinic } from "./timezone";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

/** How far ahead patients can book, in days. */
export const BOOKING_WINDOW_DAYS = 14;

/** Minimum notice before a session, so nobody books a slot starting in 5 minutes. */
const MIN_NOTICE_MS = 2 * 60 * 60 * 1000;

function toTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  let [h, m] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  // A slot is only offered if the full hour fits before the end time.
  while (h * 60 + m + 60 <= endH * 60 + endM) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    h += 1; // one session per hour — adjust if session length differs
  }
  return slots;
}

function checkConfig() {
  // Make missing .env.local values obvious in the terminal instead of
  // silently showing "no available times".
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_PSYCHOLOGIST_ID"].filter(
    (name) => !process.env[name]
  );
  if (missing.length) throw new Error(`Missing env vars in .env.local: ${missing.join(", ")}`);
}

/**
 * Open slots ("HH:mm", clinic time) for a calendar date ("YYYY-MM-DD", clinic time):
 * 1. Outside the booking window → []
 * 2. Blocked day (availability_exceptions) → []
 * 3. Every weekly rule for that weekday is expanded into hourly slots
 * 4. Slots already taken by an active booking, or too soon, are removed
 *
 * `ignoreBookingId` lets a reschedule keep seeing its own current slot as free.
 */
export async function getAvailableSlots(
  date: string,
  options: { ignoreBookingId?: string } = {}
): Promise<string[]> {
  if (!DATE_RE.test(date)) return [];
  checkConfig();

  const today = todayInClinic();
  if (date < today || date > addDays(today, BOOKING_WINDOW_DAYS)) return [];

  const { data: exception, error: exceptionError } = await supabaseAdmin
    .from("availability_exceptions")
    .select("id")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .eq("date", date)
    .limit(1)
    .maybeSingle();
  if (exceptionError) throw new Error(`availability_exceptions query failed: ${exceptionError.message}`);
  if (exception) return [];

  // A day can have several rules (e.g. 09–12 and 15–19), so don't use maybeSingle().
  const { data: rules, error: rulesError } = await supabaseAdmin
    .from("availability_rules")
    .select("start_time, end_time")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .eq("day_of_week", dayOfWeek(date));
  if (rulesError) throw new Error(`availability_rules query failed: ${rulesError.message}`);
  if (!rules || rules.length === 0) return [];

  const allSlots = Array.from(new Set(rules.flatMap((r) => toTimeSlots(r.start_time, r.end_time)))).sort();

  // Clinic-day boundaries as real UTC instants (a day can be 23 or 25h around DST).
  const dayStart = clinicTimeToUtc(date, "00:00").toISOString();
  const dayEnd = clinicTimeToUtc(addDays(date, 1), "00:00").toISOString();

  let query = supabaseAdmin
    .from("bookings")
    .select("scheduled_at")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .neq("status", "cancelled")
    .gte("scheduled_at", dayStart)
    .lt("scheduled_at", dayEnd);
  if (options.ignoreBookingId) query = query.neq("id", options.ignoreBookingId);
  const { data: existingBookings, error: bookingsError } = await query;
  if (bookingsError) throw new Error(`bookings query failed: ${bookingsError.message}`);

  const taken = new Set((existingBookings ?? []).map((b) => new Date(b.scheduled_at).getTime()));
  const earliest = Date.now() + MIN_NOTICE_MS;

  return allSlots.filter((slot) => {
    const instant = clinicTimeToUtc(date, slot).getTime();
    return instant >= earliest && !taken.has(instant);
  });
}

/** Server-side guard used by create/reschedule so the API can't be tricked into any time. */
export async function isSlotAvailable(
  date: string,
  time: string,
  options: { ignoreBookingId?: string } = {}
): Promise<boolean> {
  const slots = await getAvailableSlots(date, options);
  return slots.includes(time);
}

/**
 * Open slots for every day from `from` to `to` (inclusive, "YYYY-MM-DD", clinic
 * time) in 3 queries total instead of 3 per day. Used by the booking calendar
 * and the home page. Same rules as getAvailableSlots().
 */
export async function getAvailabilityRange(
  from: string,
  to: string,
  options: { ignoreBookingId?: string } = {}
): Promise<{ date: string; slots: string[] }[]> {
  if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) return [];
  checkConfig();

  const today = todayInClinic();
  const lastBookable = addDays(today, BOOKING_WINDOW_DAYS);
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);

  let bookingsQuery = supabaseAdmin
    .from("bookings")
    .select("scheduled_at")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .neq("status", "cancelled")
    .gte("scheduled_at", clinicTimeToUtc(from, "00:00").toISOString())
    .lt("scheduled_at", clinicTimeToUtc(addDays(to, 1), "00:00").toISOString());
  if (options.ignoreBookingId) bookingsQuery = bookingsQuery.neq("id", options.ignoreBookingId);

  const [exceptionsRes, rulesRes, bookingsRes] = await Promise.all([
    supabaseAdmin
      .from("availability_exceptions")
      .select("date")
      .eq("psychologist_id", PSYCHOLOGIST_ID)
      .gte("date", from)
      .lte("date", to),
    supabaseAdmin.from("availability_rules").select("day_of_week, start_time, end_time").eq("psychologist_id", PSYCHOLOGIST_ID),
    bookingsQuery,
  ]);
  if (exceptionsRes.error) throw new Error(`availability_exceptions query failed: ${exceptionsRes.error.message}`);
  if (rulesRes.error) throw new Error(`availability_rules query failed: ${rulesRes.error.message}`);
  if (bookingsRes.error) throw new Error(`bookings query failed: ${bookingsRes.error.message}`);

  const blocked = new Set((exceptionsRes.data ?? []).map((e) => String(e.date).slice(0, 10)));
  const taken = new Set((bookingsRes.data ?? []).map((b) => new Date(b.scheduled_at).getTime()));
  const earliest = Date.now() + MIN_NOTICE_MS;

  return dates.map((date) => {
    if (date < today || date > lastBookable || blocked.has(date)) return { date, slots: [] };
    const weekday = dayOfWeek(date);
    const rules = (rulesRes.data ?? []).filter((r) => r.day_of_week === weekday);
    const all = Array.from(new Set(rules.flatMap((r) => toTimeSlots(r.start_time, r.end_time)))).sort();
    const slots = all.filter((slot) => {
      const instant = clinicTimeToUtc(date, slot).getTime();
      return instant >= earliest && !taken.has(instant);
    });
    return { date, slots };
  });
}

/** Every day the booking calendar shows (tomorrow … +14 days) with its open times. */
export async function getBookableDays(options: { ignoreBookingId?: string } = {}) {
  const today = todayInClinic();
  return getAvailabilityRange(addDays(today, 1), addDays(today, BOOKING_WINDOW_DAYS), options);
}
