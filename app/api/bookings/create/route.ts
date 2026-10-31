import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSlotAvailable } from "@/lib/availability";
import { sendBookingConfirmation } from "@/lib/notifications";
import { clinicTimeToUtc, DATE_RE, TIME_RE } from "@/lib/timezone";
import { EMAIL_RE, normalizeEmail } from "@/lib/patientAuth";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionType, format, date, time, locale } = body;
    const name = String(body.name ?? "").trim();
    const email = normalizeEmail(body.email);
    const phone = String(body.phone ?? "").trim() || null;
    const note = String(body.note ?? "").trim();

    if (!sessionType || !format || !date || !time || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Health data may only be processed with explicit consent (Law 06/L-082 / GDPR art. 9).
    if (body.consent !== true) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }
    if (!["individual", "couples"].includes(sessionType) || !["video", "chat", "async"].includes(format)) {
      return NextResponse.json({ error: "Invalid session type or format" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || name.length > 100 || email.length > 200 || note.length > 2000) {
      return NextResponse.json({ error: "Invalid details" }, { status: 400 });
    }

    if (!DATE_RE.test(date) || !TIME_RE.test(time)) {
      return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
    }

    // Never trust the browser: the slot must really be open in her schedule.
    if (!(await isSlotAvailable(date, time))) {
      return NextResponse.json({ error: "SLOT_TAKEN" }, { status: 409 });
    }

    // Find or create the patient by (lowercased) email — one patient per email.
    const findPatient = () => supabaseAdmin.from("patients").select("id").eq("email", email).maybeSingle();
    const { data: existingPatient, error: findError } = await findPatient();
    if (findError) throw findError;

    let patientId = existingPatient?.id;

    if (!patientId) {
      const { data: newPatient, error: patientError } = await supabaseAdmin
        .from("patients")
        .insert({ name, email, phone })
        .select("id")
        .single();
      if (patientError?.code === "23505") {
        // Same email booked at the same moment in another request — use that row.
        const { data: raced } = await findPatient();
        patientId = raced?.id;
      } else if (patientError) {
        throw patientError;
      } else {
        patientId = newPatient.id;
      }
      if (!patientId) throw new Error("Could not create or find patient");
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
