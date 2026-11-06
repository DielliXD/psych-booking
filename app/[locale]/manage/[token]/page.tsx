"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CalendarClock, Check, ChevronLeft, Mail, MessageCircle, Send, User, Users, Video, X } from "lucide-react";
import { SlotPicker, useAvailability } from "@/components/booking/SlotPicker";
import { formatClinicDateTime, formatDateLabel, utcToClinic } from "@/lib/timezone";

// The page behind the link in every booking email: see the session,
// reschedule it, cancel it, and (for chat / message sessions) talk.
// No login — the unguessable token in the URL is the key.

interface BookingDetail {
  id: string;
  session_type: "individual" | "couples";
  format: "video" | "chat" | "async";
  scheduled_at: string;
  status: string;
  meeting_link: string | null;
  patients: { name: string; email: string } | { name: string; email: string }[];
}

const FORMAT_ICON = { video: Video, chat: MessageCircle, async: Mail } as const;

export default function ManageBookingPage() {
  const { token } = useParams<{ token: string }>();
  const locale = useLocale();
  const t = useTranslations("manage");
  const tB = useTranslations("booking");
  const tTypes = useTranslations("booking.step1");
  const tFormats = useTranslations("booking.step2");
  const tStatus = useTranslations("booking.status");

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<"view" | "confirmCancel" | "reschedule">("view");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [rescheduledTo, setRescheduledTo] = useState<{ date: string; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/bookings/manage/${token}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json) => alive && setBooking(json.booking))
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/manage/${token}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error();
      setCancelled(true);
    } catch {
      setError(t("genericError"));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-page py-12 sm:py-16" aria-busy="true">
        <div className="mb-8 h-10 w-56 animate-pulse rounded-full bg-line/70 dark:bg-mist/10" />
        <div className="h-52 animate-pulse rounded-[1.75rem] bg-white dark:bg-mist/[0.06]" />
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <Centered>
        <IconBadge tone="muted">
          <X size={26} aria-hidden="true" />
        </IconBadge>
        <h1 className="mb-3 text-display-md font-semibold">{t("invalidLink")}</h1>
        <p className="mb-8 text-lg leading-relaxed text-stone dark:text-haze">{t("invalidHint")}</p>
        <PillLink href={`/${locale}/book`}>{t("bookNew")}</PillLink>
      </Centered>
    );
  }

  const patient = Array.isArray(booking.patients) ? booking.patients[0] : booking.patients;
  const current = utcToClinic(booking.scheduled_at);
  const isPast = new Date(booking.scheduled_at) < new Date();
  const isCancelled = cancelled || booking.status === "cancelled";

  if (rescheduledTo) {
    return (
      <Centered>
        <IconBadge>
          <Check size={28} strokeWidth={2.5} aria-hidden="true" />
        </IconBadge>
        <h1 className="mb-3 text-display-md font-semibold">{t("rescheduledTitle")}</h1>
        <p className="mb-8 text-lg text-stone dark:text-haze">{t("rescheduledBody")}</p>
        <div className="mx-auto mb-8 max-w-sm rounded-3xl bg-night dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 p-6 text-left text-mist">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-apricot">{t("newTime")}</p>
          <p className="font-display text-2xl font-semibold tracking-tight">
            {formatDateLabel(rescheduledTo.date, locale)} · {rescheduledTo.time}
          </p>
          <p className="mt-1 text-haze">
            {tTypes(booking.session_type)} · {tFormats(booking.format)}
          </p>
        </div>
        <PillLink href={`/${locale}`} variant="ghost">
          {tB("backHome")}
        </PillLink>
      </Centered>
    );
  }

  if (isCancelled) {
    return (
      <Centered>
        <IconBadge tone="muted">
          <Check size={28} strokeWidth={2.5} aria-hidden="true" />
        </IconBadge>
        <h1 className="mb-3 text-display-md font-semibold">{t("cancelledTitle")}</h1>
        <p className="mb-8 text-lg leading-relaxed text-stone dark:text-haze">{t("cancelledBody")}</p>
        <PillLink href={`/${locale}/book`}>{t("bookNew")}</PillLink>
      </Centered>
    );
  }

  if (mode === "reschedule") {
    return (
      <Reschedule
        token={token}
        current={current}
        onBack={() => setMode("view")}
        onDone={(slot) => setRescheduledTo(slot)}
      />
    );
  }

  const TypeIcon = booking.session_type === "couples" ? Users : User;
  const FormatIcon = FORMAT_ICON[booking.format] ?? Video;
  const showJoin = booking.format === "video" && booking.meeting_link && !isPast;

  return (
    <div className="mx-auto max-w-3xl px-page py-12 sm:py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display-md font-semibold">{t("title")}</h1>
        <span
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
            booking.status === "confirmed"
              ? "bg-mint text-pineDark dark:bg-mist/10 dark:text-mist"
              : "bg-apricot/25 text-clay dark:bg-apricot/15 dark:text-apricot"
          }`}
        >
          {tStatus(booking.status as "pending" | "confirmed" | "completed" | "cancelled")}
        </span>
      </div>

      {/* Session card */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-night dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 p-6 text-mist sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(240,162,123,0.35),rgba(240,162,123,0)_70%)]"
        />
        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-apricot">{t("when")}</p>
          <p className="font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {formatClinicDateTime(booking.scheduled_at, locale, { dateStyle: "full", timeStyle: "short" })}
          </p>
          <p className="mt-1 text-sm text-haze">{tB("time.subtitle")}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            <li className="flex items-center gap-2 rounded-full bg-mist/10 px-3.5 py-2 text-[0.95rem]">
              <TypeIcon size={16} className="text-apricot" aria-hidden="true" />
              {tTypes(booking.session_type)}
            </li>
            <li className="flex items-center gap-2 rounded-full bg-mist/10 px-3.5 py-2 text-[0.95rem]">
              <FormatIcon size={16} className="text-apricot" aria-hidden="true" />
              {tFormats(booking.format)}
            </li>
          </ul>
          {patient && (
            <p className="mt-6 border-t border-mist/10 pt-4 text-[0.95rem] text-haze">
              {patient.name} · {patient.email}
            </p>
          )}
          {showJoin && (
            <a
              href={booking.meeting_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-apricot px-6 font-semibold text-ink xs:w-auto"
            >
              <Video size={18} aria-hidden="true" />
              {t("joinSession")}
            </a>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl bg-clay/10 px-4 py-3 text-clay dark:text-apricot">
          {error}
        </p>
      )}

      {/* Actions */}
      {isPast ? (
        <p className="mt-6 text-stone dark:text-haze">{t("pastSession")}</p>
      ) : mode === "confirmCancel" ? (
        <div
          ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
          role="alertdialog"
          aria-labelledby="cancel-title"
          className="mt-6 animate-fadeUp rounded-3xl border border-clay/30 bg-white p-5 sm:p-6 dark:bg-mist/[0.04]">
          <p id="cancel-title" className="mb-1.5 text-lg font-semibold">
            {t("cancelConfirmTitle")}
          </p>
          <p className="mb-5 leading-relaxed text-stone dark:text-haze">{t("cancelConfirmBody")}</p>
          <div className="flex flex-col gap-3 xs:flex-row">
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-clay px-6 font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {cancelling ? t("cancelling") : t("cancelYes")}
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              disabled={cancelling}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-line px-6 font-semibold hover:border-pine dark:border-mist/20"
            >
              {t("cancelNo")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 xs:flex-row">
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-pine px-6 font-semibold text-white transition-colors hover:bg-pineDark dark:bg-apricot dark:text-ink"
          >
            <CalendarClock size={18} aria-hidden="true" />
            {t("reschedule")}
          </button>
          <button
            type="button"
            onClick={() => setMode("confirmCancel")}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-line px-6 font-semibold text-clay transition-colors hover:border-clay dark:border-mist/20 dark:text-apricot dark:hover:border-apricot"
          >
            <X size={18} aria-hidden="true" />
            {t("cancel")}
          </button>
        </div>
      )}

      {(booking.format === "chat" || booking.format === "async") && !isPast && <MessageThread token={token} />}
    </div>
  );
}

/* ───────────────────────── Reschedule ───────────────────────── */

function Reschedule({
  token,
  current,
  onBack,
  onDone,
}: {
  token: string;
  current: { date: string; time: string };
  onBack: () => void;
  onDone: (slot: { date: string; time: string }) => void;
}) {
  const t = useTranslations("manage");
  const tB = useTranslations("booking");
  const locale = useLocale();
  const { days, failed, load } = useAvailability(token);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const list = await load();
    if (!list) return;
    // Start on the current session's day if it's still in the window and has other times
    const onCurrent = list.find((d) => d.date === current.date && d.slots.some((s) => s !== current.time));
    setDate(onCurrent ? onCurrent.date : (list.find((d) => d.slots.length)?.date ?? null));
    setTime(null);
  }, [load, current.date, current.time]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function submit() {
    if (!date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/manage/${token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      });
      if (res.ok) {
        onDone({ date, time });
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (json.error === "SLOT_TAKEN") {
        setError(t("slotTaken"));
        reload();
      } else {
        setError(t("genericError"));
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-page pt-8 sm:pt-12">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-4 inline-flex min-h-[44px] items-center gap-1 rounded-full pl-1 pr-3 text-[0.95rem] font-medium text-stone transition-colors hover:text-ink dark:text-haze dark:hover:text-mist"
      >
        <ChevronLeft size={18} aria-hidden="true" />
        {t("back")}
      </button>
      <h1 className="text-display-md font-semibold">{t("pickNewTime")}</h1>
      <p className="mb-6 mt-2 max-w-xl leading-relaxed text-stone dark:text-haze">{t("rescheduleSubtitle")}</p>

      <p className="mb-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-line bg-white px-4 py-3 text-[0.95rem] dark:border-mist/10 dark:bg-mist/[0.04]">
        <span className="text-stone dark:text-haze">{t("currentTime")}:</span>
        <span className="font-semibold">
          {formatDateLabel(current.date, locale)} · {current.time}
        </span>
      </p>

      {error && (
        <p role="alert" className="mb-5 rounded-2xl bg-clay/10 px-4 py-3 text-clay dark:text-apricot">
          {error}
        </p>
      )}

      <div className="pb-10">
        <SlotPicker
          days={days}
          failed={failed}
          retry={reload}
          date={date}
          time={time}
          onPickDate={(d) => {
            if (d !== date) setTime(null);
            setDate(d);
          }}
          onPickTime={setTime}
          current={current}
          currentLabel={t("currentShort")}
        />
      </div>

      {/* Action bar: stays at the bottom of the screen while picking */}
      <div className="mx-page-bleed sticky bottom-0 z-30 border-t border-line bg-linen/95 px-page pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md dark:border-mist/10 dark:bg-night/95 md:mx-0 md:mb-6 md:rounded-2xl md:border md:px-5 md:pb-3 md:shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-[0.95rem] leading-tight">
            {date && time ? (
              <>
                <p className="hidden text-sm text-stone xs:block dark:text-haze">{t("newTime")}</p>
                <p className="truncate font-semibold">
                  {formatDateLabel(date, locale)} · {time}
                </p>
              </>
            ) : (
              <p className="text-stone dark:text-haze">{tB("pickTime")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!date || !time || submitting}
            className="inline-flex min-h-[50px] shrink-0 items-center justify-center gap-2 rounded-full bg-pine px-6 font-semibold text-white transition-colors hover:bg-pineDark disabled:cursor-not-allowed disabled:bg-pine/30 dark:bg-apricot dark:text-ink dark:disabled:bg-mist/15 dark:disabled:text-mist/50"
          >
            {submitting ? t("saving") : t("confirmShort")}
            <Check size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Messages ───────────────────────── */

interface Message {
  id: string;
  sender: "patient" | "psychologist";
  content: string;
  sent_at: string;
}

function MessageThread({ token }: { token: string }) {
  const t = useTranslations("manage");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/bookings/manage/${token}/messages`);
    if (res.ok) {
      const json = await res.json();
      setMessages(json.messages ?? []);
    }
  }, [token]);

  useEffect(() => {
    loadMessages();
    // Polling rather than websockets — the patient side deliberately doesn't
    // use Supabase Auth, so real-time subscriptions aren't available here.
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    await fetch(`/api/bookings/manage/${token}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    }).catch(() => undefined);
    setDraft("");
    setSending(false);
    loadMessages();
  }

  return (
    <section className="mt-10 rounded-[1.75rem] border border-line bg-white p-5 sm:p-6 dark:border-mist/10 dark:bg-mist/[0.03]">
      <h2 className="mb-5 font-display text-xl font-semibold tracking-tight">{t("messages")}</h2>
      <div className="mb-5 max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
        {messages.length === 0 && <p className="text-stone dark:text-haze">{t("noMessages")}</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "patient" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed ${
                m.sender === "patient"
                  ? "rounded-br-md bg-pine text-white dark:bg-apricot dark:text-ink"
                  : "rounded-bl-md bg-linen text-ink dark:bg-mist/10 dark:text-mist"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <label htmlFor="msg-draft" className="sr-only">
          {t("messagePlaceholder")}
        </label>
        <input
          id="msg-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("messagePlaceholder")}
          className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-base outline-none focus:border-pine focus:ring-2 focus:ring-pine/15 dark:border-mist/15 dark:bg-mist/[0.04] dark:focus:border-apricot"
        />
        <button
          type="submit"
          aria-label={t("send")}
          disabled={sending || !draft.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pine text-white transition-opacity disabled:opacity-40 dark:bg-apricot dark:text-ink"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

/* ───────────────────────── Small pieces ───────────────────────── */

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl animate-fadeUp px-page py-14 text-center sm:py-24">{children}</div>;
}

function IconBadge({ children, tone = "warm" }: { children: React.ReactNode; tone?: "warm" | "muted" }) {
  return (
    <div
      className={`mx-auto mb-7 grid h-16 w-16 place-items-center rounded-full ${
        tone === "warm" ? "bg-apricot text-ink shadow-lifted" : "bg-mint text-pine dark:bg-mist/10 dark:text-mist"
      }`}
    >
      {children}
    </div>
  );
}

function PillLink({ href, children, variant = "solid" }: { href: string; children: React.ReactNode; variant?: "solid" | "ghost" }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-6 font-semibold ${
        variant === "solid"
          ? "bg-pine text-white hover:bg-pineDark dark:bg-apricot dark:text-ink"
          : "border border-line text-pine hover:border-pine dark:border-mist/20 dark:text-apricot"
      }`}
    >
      {children}
      {variant === "solid" && <ArrowRight size={18} aria-hidden="true" />}
    </Link>
  );
}
