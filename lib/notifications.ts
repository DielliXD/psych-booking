// SERVER-SIDE ONLY. Shared email-sending helpers used by API routes.
import { supabaseAdmin } from "./supabaseAdmin";
import { buildConfirmationEmail } from "./email";
import { sendEmail } from "./mailer";

/**
 * Sends the "your session is confirmed" email for a booking.
 * Called by the server right after a booking is created, and by the admin
 * "resend confirmation" route — never directly from a public browser request.
 */
export async function sendBookingConfirmation(bookingId: string, siteUrl: string) {
  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("session_type, format, scheduled_at, meeting_link, cancel_token, locale, patients(name, email)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) throw new Error(`Booking ${bookingId} not found: ${error?.message ?? "no row"}`);

  const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
  if (!patient?.email) throw new Error(`Booking ${bookingId} has no patient email`);

  const locale = booking.locale === "en" ? "en" : "sq";
  const manageUrl = `${siteUrl}/${locale}/manage/${booking.cancel_token}`;

  const { subject, html } = buildConfirmationEmail(locale, {
    name: patient.name,
    sessionType: booking.session_type,
    format: booking.format,
    scheduledAt: booking.scheduled_at,
    meetingLink: booking.meeting_link,
    manageUrl,
  });

  await sendEmail({ to: patient.email, subject, html });
}
