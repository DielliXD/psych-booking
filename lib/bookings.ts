export interface CreateBookingInput {
  sessionType: "individual" | "couples";
  format: "video" | "chat" | "async";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  name: string;
  email: string;
  phone: string;
  note: string;
  consent: boolean;
  locale: string;
}

// Booking creation goes through a server API route (not a direct client-side
// Supabase insert) so the write can use the service role key server-side.
// This lets us keep Row Level Security strict on the `bookings` and
// `patients` tables — no public insert/select policies needed at all.
export async function createBooking(input: CreateBookingInput) {
  const res = await fetch("/api/bookings/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (!res.ok) {
    if (json.error === "SLOT_TAKEN") throw new Error("SLOT_TAKEN");
    throw new Error(json.error || "Failed to create booking");
  }

  return json.booking;
}
