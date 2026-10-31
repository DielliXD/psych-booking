import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendEmail } from "@/lib/mailer";
import { buildCancellationEmail } from "@/lib/email";

const ALLOWED = ["confirmed", "completed", "cancelled"] as const;
type Status = (typeof ALLOWED)[number];

// POST /api/admin/bookings/:id/status   { status: "cancelled" | "completed" | "confirmed" }
// Admin-only. Cancelling emails the patient; the slot frees up automatically
// because availability ignores cancelled bookings.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body.status as Status;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("id, status, scheduled_at, locale, patients(name, email)")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status === status) {
    return NextResponse.json({ ok: true, status });
  }

  // Business rules: can't complete a future session; can't un-cancel (the slot
  // may already be taken by someone else).
  const isFuture = new Date(booking.scheduled_at) > new Date();
  if (status === "completed" && isFuture) {
    return NextResponse.json({ error: "A future session can't be marked completed" }, { status: 400 });
  }
  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "A cancelled booking can't be changed" }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin.from("bookings").update({ status }).eq("id", booking.id);
  if (updateError) {
    console.error("Status update failed:", updateError.message);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  // Let the patient know when the therapist cancels an upcoming session.
  let patientNotified = false;
  if (status === "cancelled" && isFuture) {
    try {
      const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
      if (patient?.email) {
        const locale = booking.locale === "en" ? "en" : "sq";
        const { subject, html } = buildCancellationEmail(locale, {
          name: patient.name,
          scheduledAt: booking.scheduled_at,
        });
        patientNotified = await sendEmail({ to: patient.email, subject, html });
      }
    } catch (err) {
      console.error("Cancellation email failed:", err);
    }
  }

  return NextResponse.json({ ok: true, status, patientNotified });
}
