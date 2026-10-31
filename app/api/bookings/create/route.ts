import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSlotAvailable } from "@/lib/availability";
import { sendBookingConfirmation } from "@/lib/notifications";
import { clinicTimeToUtc, DATE_RE, TIME_RE } from "@/lib/timezone";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

export async function POST(req: NextRequest) {
  try {
    const { sessionType, format, date, time, name, email, phone, note, locale } = await req.json();

    if (!sessionType || !format || !date || !time || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!DATE_RE.test(date) || !TIME_RE.test(time)) {
      return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
    }

    // Never trust the browser: the slot must really be open in her schedule.
    if (!(await isSlotAvailable(date, time))) {
      return NextResponse.json({ error: "SLOT_TAKEN" }, { status: 409 });
    }

    // Find or create the patient by email
    const { data: existingPatient } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let patientId = existingPatient?.id;

    if (!patientId) {
      const { data: newPatient, error: patientError } = await supabaseAdmin
        .from("patients")
        .insert({ name, email, phone })
        .select("id")
        .single();
      if (patientError) throw patientError;
      patientId = newPatient.id;
    }

    // date/time are clinic time (e.g. Kosovo), not server time (UTC on Vercel)
    const scheduledAt = clinicTimeToUtc(date, time).toISOString();

    // Auto-attach her recurring Zoom/Meet link for video sessions
    let meetingLink: string | null = null;
    if (format === "video") {
      const { data: psychologist } = await supabaseAdmin
        .from("psychologists")
        .select("default_meeting_link")
        .eq("id", PSYCHOLOGIST_ID)
        .maybeSingle();
      meetingLink = psychologist?.default_meeting_link ?? null;
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        patient_id: patientId,
        psychologist_id: PSYCHOLOGIST_ID,
        session_type: sessionType,
        format,
        scheduled_at: scheduledAt,
        note: note || null,
        meeting_link: meetingLink,
        locale: locale === "en" ? "en" : "sq",
      })
      .select()
      .single();

    if (bookingError) {
      if (bookingError.code === "23505") {
        return NextResponse.json({ error: "SLOT_TAKEN" }, { status: 409 });
      }
      throw bookingError;
    }

    // Confirmation email is sent here, server-side, instead of the browser
    // calling a separate public endpoint. A failed email must not fail the booking.
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
      await sendBookingConfirmation(booking.id, siteUrl);
    } catch (emailErr) {
      console.error("Booking saved, but confirmation email failed:", emailErr);
    }

    // Only return what the booking page needs — not the private cancel_token etc.
    return NextResponse.json({ booking: { id: booking.id } });
  } catch (err) {
    console.error("Booking creation failed:", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
