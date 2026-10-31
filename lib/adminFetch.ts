"use client";

import { supabase } from "./supabase";

// fetch() for admin-only API routes: attaches the logged-in admin's session
// token so the server can verify it (see lib/requireAdmin.ts).
export async function adminFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  return fetch(input, { ...init, headers });
}
