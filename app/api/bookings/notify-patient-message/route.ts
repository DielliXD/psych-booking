import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildNewMessageEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

// Called from the admin panel after she sends a chat message, to email
// the patient so they know to come check it (messages are polling-based,
// not push notifications, so without this the patient would never know).
export async function POST(req: NextRequest) {
  try {
    const { bookingId, messagePreview } = await req.json();
    if (!bookingId || !messagePreview) {
      return NextResponse.json({ error: "bookingId and messagePreview are required" }, { status: 400 });
    }

    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("cancel_token, locale, patients(name, email)")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
    if (!patient?.email) return NextResponse.json({ ok: true }); // nothing to send to

    const locale = booking.locale === "en" ? "en" : "sq";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    const { subject, html } = buildNewMessageEmail(locale, {
      recipientName: patient.name,
      messagePreview: messagePreview.slice(0, 200),
      link: `${siteUrl}/${locale}/manage/${booking.cancel_token}`,
      isForAdmin: false,
    });

    await resend.emails.send({
      from: process.env.BOOKING_FROM_EMAIL ?? "onboarding@resend.dev",
      to: patient.email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("New-message notification to patient failed:", err);
    return NextResponse.json({ error: "Failed to notify patient" }, { status: 500 });
  }
}
