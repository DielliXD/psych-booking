import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildNewMessageEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

async function getBooking(token: string) {
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("id, locale, patients(name, email)")
    .eq("cancel_token", token)
    .maybeSingle();
  return data;
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await getBooking(params.token);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: messages, error } = await supabaseAdmin
    .from("messages")
    .select("id, sender, content, sent_at")
    .eq("booking_id", booking.id)
    .order("sent_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await getBooking(params.token);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("messages")
    .insert({ booking_id: booking.id, sender: "patient", content: content.trim() });

  if (error) return NextResponse.json({ error: "Failed to send message" }, { status: 500 });

  // Notify the psychologist — best-effort, doesn't block the send if it fails
  try {
    const { data: psychologist } = await supabaseAdmin
      .from("psychologists")
      .select("notification_email")
      .eq("id", PSYCHOLOGIST_ID)
      .maybeSingle();

    if (psychologist?.notification_email) {
      const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
      const locale = booking.locale === "en" ? "en" : "sq";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
      const { subject, html } = buildNewMessageEmail(locale, {
        recipientName: "there", // she may not have a first-name field split out; keep it generic
        messagePreview: content.trim().slice(0, 200),
        link: `${siteUrl}/admin/bookings`,
        isForAdmin: true,
        patientName: patient?.name,
      });
      await resend.emails.send({
        from: process.env.BOOKING_FROM_EMAIL ?? "onboarding@resend.dev",
        to: psychologist.notification_email,
        subject,
        html,
      });
    }
  } catch (err) {
    console.error("New-message notification to admin failed:", err);
  }

  return NextResponse.json({ ok: true });
}
