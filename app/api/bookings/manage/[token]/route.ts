import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("id, session_type, format, scheduled_at, status, meeting_link, patients(name, email)")
    .eq("cancel_token", params.token)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
