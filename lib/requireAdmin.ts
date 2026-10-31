import type { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";

// SERVER-SIDE ONLY. Checks that a request comes from the logged-in admin.
//
// The admin panel sends its Supabase session token as
//   Authorization: Bearer <access_token>
// (see lib/adminFetch.ts) and we ask Supabase Auth who that token belongs to.
// Public signups are disabled in Supabase, so every Auth user is the admin.
// If you ever add more Auth users, also compare user.email against a list here.
export async function requireAdmin(req: NextRequest): Promise<boolean> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) return false;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.warn("Admin auth check failed:", error.message);
    return false;
  }
  return !!data.user;
}
