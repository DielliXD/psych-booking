import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildConfirmationEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, locale } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    // Fetch the booking + patient email server-side (service role bypasses RLS)
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("session_type, format, scheduled_at, meeting_link, cancel_token, patients(name, email)")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
    if (!patient?.email) {
      return NextResponse.json({ error: "No patient email on this booking" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    const manageUrl = `${siteUrl}/${locale === "sq" ? "sq" : "en"}/manage/${booking.cancel_token}`;

    const { subject, html } = buildConfirmationEmail(locale === "sq" ? "sq" : "en", {
      name: patient.name,
      sessionType: booking.session_type,
      format: booking.format,
      scheduledAt: booking.scheduled_at,
      meetingLink: booking.meeting_link,
      manageUrl,
    });

    await resend.emails.send({
      from: process.env.BOOKING_FROM_EMAIL ?? "onboarding@resend.dev",
      to: patient.email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
    // Don't fail the booking itself over an email issue — just report it.
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
