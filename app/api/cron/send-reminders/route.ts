import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/mailer";
import { buildReminderEmail } from "@/lib/email";

// Called on a schedule (e.g. Vercel Cron, once an hour) to send a reminder
// email to anyone whose confirmed session is ~24 hours away. Protected by
// a shared secret so randoms on the internet can't trigger it or spam it.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("id, format, scheduled_at, meeting_link, locale, patients(name, email)")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: "Failed to query bookings" }, { status: 500 });
  }

  let sent = 0;
  for (const booking of bookings ?? []) {
    const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
    if (!patient?.email) continue;

    try {
      const locale = booking.locale === "en" ? "en" : "sq";
      const { subject, html } = buildReminderEmail(locale, {
        name: patient.name,
        format: booking.format,
        scheduledAt: booking.scheduled_at,
        meetingLink: booking.meeting_link,
      });

      const delivered = await sendEmail({
        to: patient.email,
        subject,
        html,
      });

      if (!delivered) continue; // email not configured — try again next run

      await supabaseAdmin
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", booking.id);

      sent++;
    } catch (err) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent });
}
