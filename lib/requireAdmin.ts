import type { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";

// SERVER-SIDE ONLY. Checks that a request comes from a real admin.
//
// The admin panel sends its Supabase session token as
//   Authorization: Bearer <access_token>
// (see lib/adminFetch.ts). We ask Supabase Auth who that token belongs to,
// then require that user to be listed in admin_users
// (supabase/migration_009_admin_only.sql). Being logged in is not enough:
// any Auth user that isn't in admin_users is refused.
export async function requireAdmin(req: NextRequest): Promise<boolean> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) return false;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    if (error) console.warn("Admin auth check failed:", error.message);
    return false;
  }

  const { data: admin, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (adminError) {
    console.error("Admin list check failed:", adminError.message);
    return false;
  }
  return !!admin;
}
