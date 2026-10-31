// Shared rules for the patient magic-link login (server-side only).
//
// Flow: request-link emails a single-use token (1 hour) → verify consumes it
// once and creates a 30-day patient_sessions row → that row's id is the
// httpOnly cookie → logout deletes the row.

export const LOGIN_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = "patient_session";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails are stored lowercased so "Ana@Mail.com" and "ana@mail.com" are one patient. */
export function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}
