import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DATE_RE } from "@/lib/timezone";

export const dynamic = "force-dynamic";

// GET /api/availability?date=YYYY-MM-DD[&token=<cancel_token>]
// Returns open slots in clinic time. Only times are returned — never who
// booked what — so this is safe to expose publicly.
// When rescheduling, the booking's own token is passed so its current slot
// is not counted as "taken" by itself.
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const token = req.nextUrl.searchParams.get("token");

  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  let ignoreBookingId: string | undefined;
  if (token) {
    const { data } = await supabaseAdmin.from("bookings").select("id").eq("cancel_token", token).maybeSingle();
    ignoreBookingId = data?.id;
  }

  try {
    const slots = await getAvailableSlots(date, { ignoreBookingId });
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Availability lookup failed:", err);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
