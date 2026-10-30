import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "sq";

  if (!token) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=missing_token`, req.url));
  }

  const { data: session } = await supabaseAdmin
    .from("patient_sessions")
    .select("id, expires_at")
    .eq("id", token)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=expired`, req.url));
  }

  const response = NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  response.cookies.set("patient_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
