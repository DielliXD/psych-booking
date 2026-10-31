import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/mailer";
import { escapeHtml } from "@/lib/escapeHtml";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { EMAIL_RE, LOGIN_TOKEN_TTL_MS, normalizeEmail } from "@/lib/patientAuth";

const copy = {
  en: {
    subject: "Your login link",
    greeting: (name: string) => `Hi ${name},`,
    body: "Click below to view your upcoming and past sessions:",
    button: "View my sessions",
    expiry: "This link works once and expires in 1 hour. After you log in, you'll stay signed in on that device for 30 days.",
  },
  sq: {
    subject: "Lidhja jote e hyrjes",
    greeting: (name: string) => `Përshëndetje ${name},`,
    body: "Kliko më poshtë për të parë seancat e ardhshme dhe të kaluara:",
    button: "Shiko seancat e mia",
    expiry: "Kjo lidhje punon një herë dhe skadon pas 1 ore. Pasi të hysh, mbetesh i/e kyçur në atë pajisje për 30 ditë.",
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const loc = body.locale === "en" ? "en" : "sq";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    // Limit per IP and per email address, so the form can't be used to spam someone's inbox.
    const ip = clientIp(req.headers);
    if (!rateLimit(`login-ip:${ip}`, 10, 60 * 60 * 1000) || !rateLimit(`login-email:${email}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { data: patient, error: lookupError } = await supabaseAdmin
      .from("patients")
      .select("id, name, email")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) throw lookupError;

    // Always respond with success even if no account exists — avoids
    // leaking which emails have booked before to anyone probing the form.
    if (!patient) {
      return NextResponse.json({ ok: true });
    }

    const { data: token, error } = await supabaseAdmin
      .from("patient_login_tokens")
      .insert({ patient_id: patient.id, expires_at: new Date(Date.now() + LOGIN_TOKEN_TTL_MS).toISOString() })
      .select("id")
      .single();
    if (error || !token) throw error ?? new Error("No token returned");

    await supabaseAdmin.from("patients").update({ has_account: true }).eq("id", patient.id);

    // Housekeeping: drop login tokens that expired more than a day ago.
    await supabaseAdmin
      .from("patient_login_tokens")
      .delete()
      .lt("expires_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
    const loginUrl = `${siteUrl}/api/auth/patient/verify?token=${token.id}&locale=${loc}`;
    const t = copy[loc];

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; color: #23302B;">
        <p>${t.greeting(escapeHtml(patient.name))}</p>
        <p>${t.body}</p>
        <p style="margin: 24px 0;"><a href="${loginUrl}" style="background:#2F4F44;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;">${t.button}</a></p>
        <p style="color: #999; font-size: 13px;">${t.expiry}</p>
      </div>
    `;

    await sendEmail({ to: patient.email, subject: t.subject, html });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to send login link:", err);
    return NextResponse.json({ error: "Failed to send login link" }, { status: 500 });
  }
}
