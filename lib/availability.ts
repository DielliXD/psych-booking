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

  const today = todayInClinic();
  if (date < today || date > addDays(today, BOOKING_WINDOW_DAYS)) return [];

  const { data: exception } = await supabaseAdmin
    .from("availability_exceptions")
    .select("id")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .eq("date", date)
    .limit(1)
    .maybeSingle();
  if (exception) return [];

  // A day can have several rules (e.g. 09–12 and 15–19), so don't use maybeSingle().
  const { data: rules } = await supabaseAdmin
    .from("availability_rules")
    .select("start_time, end_time")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .eq("day_of_week", dayOfWeek(date));
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
  const { data: existingBookings } = await query;

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
