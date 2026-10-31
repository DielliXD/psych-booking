"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Check, X, CalendarClock, Send } from "lucide-react";
import { fetchAvailableSlots } from "@/lib/availabilityClient";
import { addDays, formatClinicDateTime, formatDateLabel, todayInClinic } from "@/lib/timezone";

interface BookingDetail {
  id: string;
  session_type: string;
  format: string;
  scheduled_at: string;
  status: string;
  meeting_link: string | null;
  patients: { name: string; email: string } | { name: string; email: string }[];
}

export default function ManageBookingPage() {
  const { token } = useParams<{ token: string }>();
  const locale = useLocale();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [rescheduled, setRescheduled] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/manage/${token}`);
      if (!res.ok) throw new Error("not found");
      const json = await res.json();
      setBooking(json.booking);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleCancel() {
    setCancelling(true);
    const res = await fetch(`/api/bookings/manage/${token}/cancel`, { method: "POST" });
    setCancelling(false);
    if (res.ok) setCancelled(true);
  }

  if (loading) {
    return <p className="max-w-md mx-auto px-6 py-24 text-sm text-ink/50 dark:text-mist/50">...</p>;
  }

  if (notFound || !booking) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-ink/60 dark:text-mist/60">This booking link isn't valid.</p>
      </div>
    );
  }

  const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
  const when = formatClinicDateTime(booking.scheduled_at, locale, { dateStyle: "full", timeStyle: "short" });
  const isPast = new Date(booking.scheduled_at) < new Date();
  const isCancelled = cancelled || booking.status === "cancelled";

  if (rescheduled) {
    return (
      <div className="max-w-md mx-auto px-6 lg:px-8 py-28 text-center animate-fadeUp">
        <div className="mx-auto mb-7 w-16 h-16 rounded-full bg-gradient-to-br from-pine to-pine/70 dark:from-sage dark:to-sage/70 shadow-lifted flex items-center justify-center">
          <Check className="text-linen dark:text-charcoalGreen" size={28} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl mb-3 text-ink dark:text-mist tracking-tightest">Session rescheduled</h1>
        <p className="text-sm leading-relaxed text-ink/60 dark:text-mist/60">
          Check your email for the updated details.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 lg:px-8 py-28">
      {isCancelled ? (
        <div className="text-center animate-fadeUp">
          <div className="mx-auto mb-7 w-16 h-16 rounded-full bg-gradient-to-br from-pine to-pine/70 dark:from-sage dark:to-sage/70 shadow-lifted flex items-center justify-center">
            <Check className="text-linen dark:text-charcoalGreen" size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl mb-3 text-ink dark:text-mist tracking-tightest">Booking cancelled</h1>
          <p className="text-sm leading-relaxed text-ink/60 dark:text-mist/60">
            Your slot has been freed up. Feel free to book a new time whenever you're ready.
          </p>
        </div>
      ) : mode === "reschedule" ? (
        <RescheduleForm
          token={token}
          onDone={() => setRescheduled(true)}
          onBack={() => setMode("view")}
        />
      ) : (
        <>
          <h1 className="text-3xl mb-8 text-ink dark:text-mist tracking-tightest">Your booking</h1>
          <div className="rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] shadow-soft p-6 text-sm space-y-2 text-ink/70 dark:text-mist/70 mb-10">
            <p className="capitalize font-medium text-ink dark:text-mist">{booking.session_type}</p>
            <p className="capitalize">{booking.format}</p>
            <p>{when}</p>
            <p className="pt-2 border-t border-pine/10 dark:border-sage/10">{patient?.name}</p>
          </div>

          {isPast ? (
            <p className="text-sm text-ink/50 dark:text-mist/50">This session has already passed.</p>
          ) : (
            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => setMode("reschedule")}
                className="inline-flex items-center gap-2 rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-6 py-3.5 text-sm font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth"
              >
                <CalendarClock size={16} /> Reschedule
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-full border-2 border-clay text-clay px-6 py-3.5 text-sm font-medium hover:bg-clay/8 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel"} <X size={16} />
              </button>
            </div>
          )}

          {(booking.format === "chat" || booking.format === "async") && !isPast && (
            <MessageThread token={token} />
          )}
        </>
      )}
    </div>
  );
}

function MessageThread({ token }: { token: string }) {
  interface Message {
    id: string;
    sender: "patient" | "psychologist";
    content: string;
    sent_at: string;
  }
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    const res = await fetch(`/api/bookings/manage/${token}/messages`);
    if (res.ok) {
      const json = await res.json();
      setMessages(json.messages);
    }
  }

  useEffect(() => {
    loadMessages();
    // Polling rather than websockets — the patient side deliberately
    // doesn't use Supabase Auth (keeps the admin login lockdown simple
    // and secure), so real-time subscriptions aren't available here.
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [token]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    await fetch(`/api/bookings/manage/${token}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setDraft("");
    setSending(false);
    loadMessages();
  }

  return (
    <div className="rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] shadow-soft p-6">
      <p className="text-xs font-medium tracking-widest uppercase text-clay mb-5">Messages</p>

      <div className="space-y-3 max-h-80 overflow-y-auto mb-5">
        {messages.length === 0 && (
          <p className="text-sm text-ink/40 dark:text-mist/40">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "patient" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.sender === "patient"
                  ? "bg-pine text-linen dark:bg-sage dark:text-charcoalGreen"
                  : "bg-pine/8 dark:bg-sage/10 text-ink dark:text-mist"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border-2 border-pine/10 dark:border-sage/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-pine dark:focus:border-sage"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen disabled:opacity-40 transition-opacity"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function RescheduleForm({
  token,
  onDone,
  onBack,
}: {
  token: string;
  onDone: () => void;
  onBack: () => void;
}) {
  const locale = useLocale();
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    const today = todayInClinic();
    return Array.from({ length: 14 }).map((_, i) => addDays(today, i + 1));
  }, []);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetchAvailableSlots(date, token)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [date]);

  async function handleSubmit() {
    if (!date || !time) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/bookings/manage/${token}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time }),
    });
    setSubmitting(false);
    if (res.ok) {
      onDone();
    } else {
      const json = await res.json();
      setError(json.error === "SLOT_TAKEN" ? "That time was just taken — pick another." : "Something went wrong.");
    }
  }

  return (
    <div className="animate-fadeUp">
      <h1 className="text-3xl mb-8 text-ink dark:text-mist tracking-tightest">Pick a new time</h1>
      {error && <p className="mb-5 text-sm text-clay bg-clay/10 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {days.map((iso) => {
          const label = formatDateLabel(iso, locale);
          const selected = date === iso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => {
                setDate(iso);
                setTime(null);
              }}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
                selected
                  ? "border-pine bg-pine text-linen dark:border-sage dark:bg-sage dark:text-charcoalGreen shadow-soft"
                  : "border-pine/10 dark:border-sage/10 text-ink/70 dark:text-mist/70 hover:border-pine/30 dark:hover:border-sage/30"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {date && (
        <div className="flex flex-wrap gap-2 mb-8">
          {loadingSlots && <p className="text-sm text-ink/40 dark:text-mist/40">...</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-ink/50 dark:text-mist/50">No available times on this day.</p>
          )}
          {!loadingSlots &&
            slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTime(s)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
                  time === s
                    ? "border-pine bg-pine text-linen dark:border-sage dark:bg-sage dark:text-charcoalGreen shadow-soft"
                    : "border-pine/10 dark:border-sage/10 text-ink/70 dark:text-mist/70 hover:border-pine/30 dark:hover:border-sage/30"
                }`}
              >
                {s}
              </button>
            ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-sm text-ink/55 dark:text-mist/55 hover:text-ink dark:hover:text-mist">
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!date || !time || submitting}
          className="inline-flex items-center gap-2 rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-6 py-3.5 text-sm font-medium shadow-soft hover:shadow-lifted transition-all duration-300 ease-smooth disabled:opacity-30"
        >
          {submitting ? "Saving..." : "Confirm new time"} <Check size={16} />
        </button>
      </div>
    </div>
  );
}
