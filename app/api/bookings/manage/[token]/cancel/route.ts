import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildCancellationEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("id, status, scheduled_at, locale, patients(name, email)")
    .eq("cancel_token", params.token)
    .maybeSingle();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ ok: true }); // already cancelled, treat as success
  }

  if (new Date(booking.scheduled_at) < new Date()) {
    return NextResponse.json({ error: "Cannot cancel a past session" }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }

  // Best-effort confirmation email — don't fail the cancellation if this fails
  try {
    const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
    if (patient?.email) {
      const locale = booking.locale === "en" ? "en" : "sq";
      const { subject, html } = buildCancellationEmail(locale, {
        name: patient.name,
        scheduledAt: booking.scheduled_at,
      });
      await resend.emails.send({
        from: process.env.BOOKING_FROM_EMAIL ?? "onboarding@resend.dev",
        to: patient.email,
        subject,
        html,
      });
    }
  } catch (err) {
    console.error("Cancellation email failed to send:", err);
  }

  // The unique(psychologist_id, scheduled_at) constraint only blocks
  // *active* rows implicitly via our availability query filtering by time —
  // cancelled bookings are excluded there, so the slot reopens automatically.
  return NextResponse.json({ ok: true });
}
