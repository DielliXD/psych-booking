import { createClient } from "@supabase/supabase-js";

// SERVER-SIDE ONLY. Never import this file from a "use client" component —
// the service role key bypasses Row Level Security and must never reach the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
