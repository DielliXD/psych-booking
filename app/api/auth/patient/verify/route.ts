import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SESSION_COOKIE, SESSION_TTL_MS, UUID_RE } from "@/lib/patientAuth";

// GET /api/auth/patient/verify?token=...  (the link in the login email)
// Consumes the single-use login token and starts a 30-day session.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "sq";
  const fail = () => NextResponse.redirect(new URL(`/${locale}/login?error=expired`, req.url));

  if (!UUID_RE.test(token)) return fail();

  // Atomic "use once": only succeeds if the token is unused and not expired,
  // so two clicks (or a leaked link) can't both log in.
  const now = new Date().toISOString();
  const { data: consumed, error } = await supabaseAdmin
    .from("patient_login_tokens")
    .update({ used_at: now })
    .eq("id", token)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("patient_id")
    .maybeSingle();

  if (error) console.error("Login token check failed:", error.message);
  if (!consumed) return fail();

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("patient_sessions")
    .insert({ patient_id: consumed.patient_id, expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString() })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("Could not create patient session:", sessionError?.message);
    return fail();
  }

  const response = NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  response.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return response;
}
