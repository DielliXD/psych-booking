import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

const copy = {
  en: {
    subject: "Your login link",
    greeting: (name: string) => `Hi ${name},`,
    body: "Click below to view your upcoming and past sessions:",
    button: "View my sessions",
    expiry: "This link is valid for 30 days.",
  },
  sq: {
    subject: "Lidhja jote e hyrjes",
    greeting: (name: string) => `Përshëndetje ${name},`,
    body: "Kliko më poshtë për të parë seancat e ardhshme dhe të kaluara:",
    button: "Shiko seancat e mia",
    expiry: "Kjo lidhje është e vlefshme për 30 ditë.",
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const { email, locale } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    const loc = locale === "en" ? "en" : "sq";

    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id, name, email")
      .eq("email", email)
      .maybeSingle();

    // Always respond with success even if no account exists — avoids
    // leaking which emails have booked before to anyone probing the form.
    if (!patient) {
      return NextResponse.json({ ok: true });
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: session, error } = await supabaseAdmin
      .from("patient_sessions")
      .insert({ patient_id: patient.id, expires_at: expiresAt })
      .select("id")
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    await supabaseAdmin.from("patients").update({ has_account: true }).eq("id", patient.id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    const loginUrl = `${siteUrl}/api/auth/patient/verify?token=${session.id}&locale=${loc}`;
    const t = copy[loc];

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #23302B;">
        <p>${t.greeting(patient.name)}</p>
        <p>${t.body}</p>
        <p style="margin: 24px 0;"><a href="${loginUrl}" style="background:#2F4F44;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;">${t.button}</a></p>
        <p style="color: #999; font-size: 13px;">${t.expiry}</p>
      </div>
    `;

    await resend.emails.send({
      from: process.env.BOOKING_FROM_EMAIL ?? "onboarding@resend.dev",
      to: patient.email,
      subject: t.subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to send login link:", err);
    return NextResponse.json({ error: "Failed to send login link" }, { status: 500 });
  }
}
