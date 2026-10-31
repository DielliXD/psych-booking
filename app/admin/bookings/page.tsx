"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatClinicDateTime } from "@/lib/timezone";
import { NotebookPen, ChevronDown, MessageSquare, Send } from "lucide-react";

interface BookingRow {
  id: string;
  session_type: string;
  format: string;
  scheduled_at: string;
  status: string;
  note: string | null;
  patients: { name: string; email: string; phone: string | null } | { name: string; email: string; phone: string | null }[];
}

interface SessionNote {
  booking_id: string;
  notes: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: b }, { data: notes }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, session_type, format, scheduled_at, status, note, patients(name, email, phone)")
        .order("scheduled_at", { ascending: true }),
      supabase.from("session_notes").select("booking_id, notes"),
    ]);
    setBookings((b as any) ?? []);
    const noteMap: Record<string, string> = {};
    (notes ?? []).forEach((n: SessionNote) => {
      noteMap[n.booking_id] = n.notes;
    });
    setSessionNotes(noteMap);
    setLoading(false);
  }

  async function saveSessionNote(bookingId: string, text: string) {
    // Upsert-by-hand: try update first, insert if no row exists yet
    const { data: existing } = await supabase
      .from("session_notes")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existing) {
      await supabase.from("session_notes").update({ notes: text }).eq("booking_id", bookingId);
    } else {
      await supabase.from("session_notes").insert({ booking_id: bookingId, notes: text });
    }
    setSessionNotes((prev) => ({ ...prev, [bookingId]: text }));
  }

  if (loading) return <p className="text-sm text-ink/50 dark:text-mist/50">Loading...</p>;

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(b.scheduled_at) >= now);
  const past = bookings.filter((b) => new Date(b.scheduled_at) < now);

  return (
    <div className="space-y-16">
      <BookingGroup
        title="Upcoming"
        bookings={upcoming}
        emptyText="No upcoming sessions."
        sessionNotes={sessionNotes}
        onSaveNote={saveSessionNote}
      />
      <BookingGroup
        title="Past"
        bookings={past}
        emptyText="No past sessions yet."
        sessionNotes={sessionNotes}
        onSaveNote={saveSessionNote}
      />
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
  emptyText,
  sessionNotes,
  onSaveNote,
}: {
  title: string;
  bookings: BookingRow[];
  emptyText: string;
  sessionNotes: Record<string, string>;
  onSaveNote: (bookingId: string, text: string) => Promise<void>;
}) {
  return (
    <section>
      <h2 className="text-xl mb-6 text-ink dark:text-mist">{title}</h2>
      {bookings.length === 0 && <p className="text-sm text-ink/50 dark:text-mist/50">{emptyText}</p>}
      <div className="space-y-3">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} existingNote={sessionNotes[b.id] ?? ""} onSaveNote={onSaveNote} />
        ))}
      </div>
    </section>
  );
}

function BookingCard({
  booking: b,
  existingNote,
  onSaveNote,
}: {
  booking: BookingRow;
  existingNote: string;
  onSaveNote: (bookingId: string, text: string) => Promise<void>;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState(existingNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const patient = Array.isArray(b.patients) ? b.patients[0] : b.patients;
  const when = formatClinicDateTime(b.scheduled_at, "en");

  async function handleSave() {
    setSaving(true);
    await onSaveNote(b.id, draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="rounded-xl border border-pine/10 dark:border-sage/10 p-4 text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-ink dark:text-mist">{patient?.name}</span>
        <span className="text-xs text-ink/50 dark:text-mist/50">{when}</span>
      </div>
      <p className="text-ink/60 dark:text-mist/60 capitalize">
        {b.session_type} · {b.format} · {b.status}
      </p>
      <p className="text-ink/50 dark:text-mist/50 text-xs mt-1">
        {patient?.email} {patient?.phone ? `· ${patient.phone}` : ""}
      </p>
      {b.note && (
        <p className="mt-2 text-ink/70 dark:text-mist/70 italic border-l-2 border-clay/40 pl-3">"{b.note}"</p>
      )}

      <button
        onClick={() => setNoteOpen(!noteOpen)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-pine dark:text-sage hover:underline"
      >
        <NotebookPen size={13} />
        {existingNote ? "View/edit session notes" : "Add private session notes"}
        <ChevronDown size={13} className={`transition-transform ${noteOpen ? "rotate-180" : ""}`} />
      </button>

      {noteOpen && (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Private notes — only visible to you, never shared with the patient."
            className="w-full rounded-lg border border-pine/15 dark:border-sage/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-pine dark:focus:border-sage min-h-[90px]"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-4 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save note"}
            </button>
            {saved && <span className="text-xs text-pine dark:text-sage">Saved</span>}
          </div>
        </div>
      )}

      {(b.format === "chat" || b.format === "async") && (
        <>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-pine dark:text-sage hover:underline"
          >
            <MessageSquare size={13} />
            Messages
            <ChevronDown size={13} className={`transition-transform ${chatOpen ? "rotate-180" : ""}`} />
          </button>
          {chatOpen && <AdminMessageThread bookingId={b.id} />}
        </>
      )}
    </div>
  );
}

function AdminMessageThread({ bookingId }: { bookingId: string }) {
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
    const { data } = await supabase
      .from("messages")
      .select("id, sender, content, sent_at")
      .eq("booking_id", bookingId)
      .order("sent_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    await supabase.from("messages").insert({ booking_id: bookingId, sender: "psychologist", content: draft.trim() });
    fetch("/api/bookings/notify-patient-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, messagePreview: draft.trim() }),
    }).catch((err) => console.error("Failed to notify patient:", err));
    setDraft("");
    setSending(false);
    loadMessages();
  }

  return (
    <div className="mt-3 rounded-xl border border-pine/10 dark:border-sage/10 p-4">
      <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
        {messages.length === 0 && <p className="text-xs text-ink/40 dark:text-mist/40">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "psychologist" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                m.sender === "psychologist"
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
          placeholder="Reply..."
          className="flex-1 rounded-full border border-pine/15 dark:border-sage/15 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-pine dark:focus:border-sage"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen disabled:opacity-40"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}
