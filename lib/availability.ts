import { supabase } from "./supabase";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

function toTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  let [h, m] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  while (h < endH || (h === endH && m < endM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 60; // one session per hour — adjust if session length differs
    if (m >= 60) {
      h += 1;
      m = 0;
    }
  }
  return slots;
}

/**
 * Real Supabase-backed availability:
 * 1. Checks availability_exceptions (vacation/blocked days) — returns [] if blocked
 * 2. Reads the recurring weekly rule for that day of week
 * 3. Removes any time already taken in `bookings` for that date
 */
export async function getAvailableSlots(date: Date): Promise<string[]> {
  const isoDate = date.toISOString().slice(0, 10);
  const dayOfWeek = date.getDay();

  const { data: exception } = await supabase
    .from("availability_exceptions")
    .select("id")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .eq("date", isoDate)
    .maybeSingle();

  if (exception) return [];

  const { data: rule } = await supabase
    .from("availability_rules")
    .select("start_time, end_time")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (!rule) return [];

  const allSlots = toTimeSlots(rule.start_time, rule.end_time);

  const dayStart = `${isoDate}T00:00:00.000Z`;
  const dayEnd = `${isoDate}T23:59:59.999Z`;
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_at")
    .eq("psychologist_id", PSYCHOLOGIST_ID)
    .neq("status", "cancelled")
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd);

  const takenTimes = new Set(
    (existingBookings ?? []).map((b) => new Date(b.scheduled_at).toISOString().slice(11, 16))
  );

  return allSlots.filter((slot) => !takenTimes.has(slot));
}
