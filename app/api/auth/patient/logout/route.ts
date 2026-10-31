import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SESSION_COOKIE, UUID_RE } from "@/lib/patientAuth";

// Ends the session for real: deletes the server-side row, not just the cookie,
// so a copied cookie stops working too.
export async function POST(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "sq";
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value ?? "";

  if (UUID_RE.test(sessionId)) {
    const { error } = await supabaseAdmin.from("patient_sessions").delete().eq("id", sessionId);
    if (error) console.error("Logout: failed to delete session:", error.message);
  }

  // 303 so the browser follows the redirect with GET after the form POST
  const response = NextResponse.redirect(new URL(`/${locale}`, req.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
