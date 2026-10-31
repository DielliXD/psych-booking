// Escape anything that came from a user (names, messages, notes) before it
// is placed inside an HTML email. Without this, a "name" like
// <a href="https://evil.example">Click here</a> would render as a real link
// in an email that looks like it came from the clinic.
export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
