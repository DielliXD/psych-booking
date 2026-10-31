// Browser-side helper: asks the server for open slots. The real logic lives in
// lib/availability.ts, which needs the service role key and must stay server-only.
export async function fetchAvailableSlots(date: string, manageToken?: string): Promise<string[]> {
  const params = new URLSearchParams({ date });
  if (manageToken) params.set("token", manageToken);
  const res = await fetch(`/api/availability?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.slots) ? json.slots : [];
}
