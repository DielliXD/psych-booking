// SERVER-SIDE ONLY. The one place that talks to Resend.
//
// The Resend client is created lazily, on first send. Creating it at the top
// of a file (`const resend = new Resend(...)`) crashes the whole API route
// when RESEND_API_KEY is missing — which turned a missing email key into
// "booking failed". Now a missing key just skips the email with a warning.
import { Resend } from "resend";

let client: Resend | null = null;
const FROM = process.env.BOOKING_FROM_EMAIL ?? "onboarding@resend.dev";

/** Returns true if the email was sent, false if skipped because email isn't configured. */
export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email skipped] RESEND_API_KEY is not set in .env.local — "${message.subject}" was not sent.`);
    return false;
  }
  client ??= new Resend(key);
  const { replyTo, ...rest } = message;
  const { error } = await client.emails.send({ from: FROM, ...rest, ...(replyTo ? { reply_to: replyTo } : {}) });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return true;
}
