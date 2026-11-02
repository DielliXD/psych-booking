import { NextRequest, NextResponse } from "next/server";
import { BOOKING_WINDOW_DAYS, getAvailabilityRange, getAvailableSlots } from "@/lib/availability";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays, DATE_RE, todayInClinic } from "@/lib/timezone";

export const dynamic = "force-dynamic";

// GET /api/availability?date=YYYY-MM-DD[&token=<cancel_token>]
//   → { slots: ["09:00", …] } for one day (clinic time).
//   When rescheduling, the booking's own token is passed so its current slot
//   is not counted as "taken" by itself.
//
// GET /api/availability?range
//   → { days: [{ date, slots }, …] } — every day of the booking window
//   (tomorrow … +14 days), including days with no open times. Used by the
//   booking calendar so it can show "5 free" / "closed" on each day.
//
// GET /api/availability?next=3
//   → { days: [{ date, slots }, …] } — the next N days (starting tomorrow,
//   like the booking calendar) that have at least one open time. Used by the
//   home page so it needs one request instead of one per day.
//
// Only times are returned — never who booked what — so this is safe to expose.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  try {
    const today = todayInClinic();
    const firstDay = addDays(today, 1); // the calendar starts tomorrow
    const lastDay = addDays(today, BOOKING_WINDOW_DAYS);

    if (params.get("range") !== null) {
      return NextResponse.json({ days: await getAvailabilityRange(firstDay, lastDay) });
    }

    const next = params.get("next");
    if (next !== null) {
      const wanted = Math.min(Math.max(parseInt(next, 10) || 3, 1), 5);
      const all = await getAvailabilityRange(firstDay, lastDay);
      return NextResponse.json({ days: all.filter((d) => d.slots.length).slice(0, wanted) });
    }

    const date = params.get("date") ?? "";
    if (!DATE_RE.test(date)) {
      return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    let ignoreBookingId: string | undefined;
    const token = params.get("token");
    if (token) {
      const { data } = await supabaseAdmin.from("bookings").select("id").eq("cancel_token", token).maybeSingle();
      ignoreBookingId = data?.id;
    }

    const slots = await getAvailableSlots(date, { ignoreBookingId });
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Availability lookup failed:", err);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
