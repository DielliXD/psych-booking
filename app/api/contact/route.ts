import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/mailer";
import { escapeHtml } from "@/lib/escapeHtml";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact — emails the contact form to the psychologist's
// notification email (set in /admin/settings). Reply-To is the visitor,
// so she can answer straight from her inbox.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const website = String(body.website ?? "");

  // Honeypot filled in → almost certainly a bot. Pretend it worked.
  if (website) return NextResponse.json({ ok: true });

  if (!name || name.length > 100 || !EMAIL_RE.test(email) || email.length > 200 || !message || message.length > 5000) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // 5 messages per hour per IP
  if (!rateLimit(`contact:${clientIp(req.headers)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages" }, { status: 429 });
  }

  const { data: psychologist, error } = await supabaseAdmin
    .from("psychologists")
    .select("notification_email")
    .eq("id", PSYCHOLOGIST_ID)
    .maybeSingle();

  if (error) {
    console.error("Contact form: could not load psychologist:", error.message);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
  if (!psychologist?.notification_email) {
    console.warn("Contact form: no notification email set — add one in /admin/settings.");
    return NextResponse.json({ error: "Contact is not configured" }, { status: 503 });
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: auto; color: #23302B;">
      <p style="color:#666; font-size:13px; margin:0 0 16px;">New message from the website contact form</p>
      <p style="margin:4px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <div style="margin-top:16px; padding:14px 16px; border-left:3px solid #C08974; background:#faf7f2; white-space:pre-wrap;">${escapeHtml(message)}</div>
      <p style="color:#999; font-size:12px; margin-top:24px;">Reply to this email to answer ${escapeHtml(name)} directly.</p>
    </div>
  `;

  try {
    const delivered = await sendEmail({
      to: psychologist.notification_email,
      subject: `Contact form: ${name.slice(0, 60)}`,
      html,
      replyTo: email,
    });
    if (!delivered) return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form email failed:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
