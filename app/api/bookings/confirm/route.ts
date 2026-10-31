import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendBookingConfirmation } from "@/lib/notifications";

// Admin-only: (re)send the confirmation email for a booking.
// New bookings get their confirmation automatically from /api/bookings/create
// on the server, so the public booking page never calls this anymore —
// previously anyone who knew a booking id could trigger emails with it.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await req.json().catch(() => ({}));
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    await sendBookingConfirmation(bookingId, siteUrl);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
