import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildConfirmationEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { date, time } = await req.json();
    if (!date || !time) {
      return NextResponse.json({ error: "date and time are required" }, { status: 400 });
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("id, status, scheduled_at, session_type, format, meeting_link, locale, patients(name, email)")
      .eq("cancel_token", params.token)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "This booking was already cancelled" }, { status: 400 });
    }

    if (new Date(booking.scheduled_at) < new Date()) {
      return NextResponse.json({ error: "Cannot reschedule a past session" }, { status: 400 });
    }

    const newScheduledAt = new Date(`${date}T${time}:00`).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        scheduled_at: newScheduledAt,
        reminder_sent_at: null, // reset so the 24h reminder fires again for the new time
      })
      .eq("id", booking.id);

    if (updateError) {
      // Partial unique index violation — someone else already holds that slot
      if ((updateError as any).code === "23505") {
        return NextResponse.json({ error: "SLOT_TAKEN" }, { status: 409 });
      }
      throw updateError;
    }

    // Best-effort updated confirmation email
    try {
      const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
      if (patient?.email) {
        const locale = booking.locale === "en" ? "en" : "sq";
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
        const manageUrl = `${siteUrl}/${locale}/manage/${params.token}`;
        const { subject, html } = buildConfirmationEmail(locale, {
          name: patient.name,
          sessionType: booking.session_type,
          format: booking.format,
          scheduledAt: newScheduledAt,
          meetingLink: booking.meeting_link,
          manageUrl,
        });
        await resend.emails.send({
          from: process.env.BOOKING_FROM_EMAIL ?? "onboarding@resend.dev",
          to: patient.email,
          subject: `Updated: ${subject}`,
          html,
        });
      }
    } catch (err) {
      console.error("Reschedule confirmation email failed to send:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reschedule failed:", err);
    return NextResponse.json({ error: "Failed to reschedule" }, { status: 500 });
  }
}
