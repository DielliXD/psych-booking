"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  ShieldCheck,
  User,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { createBooking } from "@/lib/bookings";
import { DATE_RE, TIME_RE, dateParts, formatDateLabel, formatMonthRange } from "@/lib/timezone";
import type { Prices } from "@/lib/prices";

// Booking flow, 4 steps + success:
//   1 Time → 2 Session (type + format) → 3 Details → 4 Confirm → done
// Time comes first: most people decide by when they're free, and links from
// the home page ("see all times", a specific time) land straight on it.

type SessionType = "individual" | "couples";
type Format = "video" | "chat" | "async";
type Step = 1 | 2 | 3 | 4 | 5;
type Update = <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;

interface BookingData {
  sessionType: SessionType | null;
  format: Format | null;
  date: string | null;
  time: string | null;
  name: string;
  email: string;
  phone: string;
  saveInfo: boolean;
  consent: boolean;
  note: string;
}

interface Day {
  date: string;
  slots: string[];
}

const STEP_KEYS = ["time", "session", "details", "confirm"] as const;
const DAYS_PER_PAGE = 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FORMAT_ICON: Record<Format, LucideIcon> = { video: Video, chat: MessageCircle, async: Mail };

export function BookingWizard({ prices }: { prices: Prices }) {
  const t = useTranslations("booking");
  const tTypes = useTranslations("booking.step1");
  const tFormats = useTranslations("booking.step2");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>(1);
  // Coming from the home page with ?date=…&time=… → those start pre-picked.
  // They're checked against live availability once it loads.
  const [data, setData] = useState<BookingData>(() => {
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const validDate = date && DATE_RE.test(date) ? date : null;
    return {
      sessionType: null,
      format: null,
      date: validDate,
      time: validDate && time && TIME_RE.test(time) ? time : null,
      name: "",
      email: "",
      phone: "",
      saveInfo: false,
      consent: false,
      note: "",
    };
  });
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update: Update = useCallback((key, value) => setData((prev) => ({ ...prev, [key]: value })), []);

  const loadDays = useCallback(() => {
    setLoadFailed(false);
    setDays(null);
    fetch("/api/availability?range", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => {
        const list: Day[] = Array.isArray(json.days) ? json.days : [];
        setDays(list);
        // Keep the pre-picked date/time only if still free; otherwise start on
        // the first day that has times.
        setData((prev) => {
          const picked = list.find((d) => d.date === prev.date && d.slots.length);
          if (picked) return { ...prev, time: prev.time && picked.slots.includes(prev.time) ? prev.time : null };
          return { ...prev, date: list.find((d) => d.slots.length)?.date ?? null, time: null };
        });
      })
      .catch(() => setLoadFailed(true));
  }, []);

  useEffect(() => {
    loadDays();
  }, [loadDays]);

  const canAdvance =
    step === 1
      ? !!data.date && !!data.time
      : step === 2
        ? !!data.sessionType && !!data.format
        : step === 3
          ? data.name.trim().length > 1 && EMAIL_RE.test(data.email.trim()) && data.consent
          : true;

  function goTo(next: Step) {
    setError(null);
    setStep(next);
    // Bring the new step into view (matters on phones, where the old step was scrolled)
    requestAnimationFrame(() => {
      const top = topRef.current;
      if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function submit() {
    if (!data.sessionType || !data.format || !data.date || !data.time) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBooking({
        sessionType: data.sessionType,
        format: data.format,
        date: data.date,
        time: data.time,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        note: data.note.trim(),
        consent: data.consent,
        locale,
      });
      if (data.saveInfo) {
        fetch("/api/auth/patient/request-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email.trim(), locale }),
        }).catch((err) => console.error("Login link failed to send:", err));
      }
      goTo(5);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "SLOT_TAKEN") {
        update("time", null);
        loadDays();
        goTo(1);
        setError(t("slotTaken"));
      } else {
        setError(t("submitError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const price = data.sessionType ? prices[data.sessionType] : null;
  const primary =
    step === 4
      ? { label: submitting ? t("submitting") : t("confirm"), onClick: submit, disabled: submitting, icon: Check }
      : { label: t("next"), onClick: () => goTo((step + 1) as Step), disabled: !canAdvance, icon: ArrowRight };
  // The bottom bar on phones has less room
  const primaryShort = step === 4 && !submitting ? { ...primary, label: t("confirmShort") } : primary;

  if (step === 5) {
    return (
      <div ref={topRef} className="mx-auto max-w-xl px-page py-14 sm:py-24">
        <Success data={data} price={price} />
      </div>
    );
  }

  return (
    <div ref={topRef} className="mx-auto max-w-6xl scroll-mt-24 px-page pt-8 sm:pt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 sm:mb-8">
        <h1 className="text-display-md font-semibold">{t("title")}</h1>
        <p className="flex items-center gap-2 text-sm text-stone dark:text-haze">
          <ShieldCheck size={16} className="text-pine dark:text-apricot" aria-hidden="true" />
          {t("privacyNote")}
        </p>
      </div>

      <StepNav current={step} onJump={(s) => goTo(s)} />

      <div className="mt-8 grid gap-8 pb-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10 lg:pb-20 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0">
          {step > 1 && (
            <button
              type="button"
              onClick={() => goTo((step - 1) as Step)}
              className="-ml-2 mb-4 inline-flex min-h-[44px] items-center gap-1 rounded-full pl-1 pr-3 text-[0.95rem] font-medium text-stone transition-colors hover:text-ink dark:text-haze dark:hover:text-mist"
            >
              <ChevronLeft size={18} aria-hidden="true" />
              {t("back")}
            </button>
          )}
          {error && (
            <p role="alert" className="mb-5 rounded-2xl bg-clay/10 px-4 py-3 text-[0.95rem] text-clay dark:text-apricot">
              {error}
            </p>
          )}
          <div key={step} className="animate-fadeUp">
            {step === 1 && <StepTime data={data} update={update} days={days} failed={loadFailed} retry={loadDays} />}
            {step === 2 && <StepSession data={data} update={update} prices={prices} />}
            {step === 3 && <StepDetails data={data} update={update} />}
            {step === 4 && <StepConfirm data={data} price={price} onEdit={(s) => goTo(s)} />}
          </div>
        </div>

        {/* Desktop: summary card with the main action */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[1.75rem] border border-line bg-white p-6 shadow-card dark:border-mist/10 dark:bg-mist/[0.04]">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-apricot font-display font-semibold text-ink">
                FB
              </span>
              <div>
                <p className="font-semibold leading-tight">Filloreta Bokshi</p>
                <p className="text-sm text-stone dark:text-haze">{t("psychologistRole")}</p>
              </div>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-clay dark:text-apricot">{t("summary")}</p>
            <dl className="divide-y divide-line text-[0.95rem] dark:divide-mist/10">
              <SummaryRow label={t("summaryDate")} value={data.date ? formatDateLabel(data.date, locale) : null} />
              <SummaryRow label={t("summaryTime")} value={data.time} />
              <SummaryRow label={t("summaryType")} value={data.sessionType ? tTypes(data.sessionType) : null} />
              <SummaryRow label={t("summaryFormat")} value={data.format ? tFormats(data.format) : null} />
              {price && <SummaryRow label={t("summaryPrice")} value={price} strong />}
            </dl>
            <PrimaryButton {...primary} className="mt-6 w-full" />
            <p className="mt-4 text-center text-sm leading-relaxed text-stone dark:text-haze">{t("policyNote")}</p>
          </div>
        </aside>
      </div>

      {/* Phones & tablets: the action stays reachable at the bottom of the screen */}
      <div className="mx-page-bleed sticky bottom-0 z-30 border-t border-line bg-linen/95 px-page pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden dark:border-mist/10 dark:bg-night/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0 text-[0.95rem] leading-tight">
            {data.date && data.time ? (
              <>
                <p className="truncate font-semibold">
                  {formatDateLabel(data.date, locale)} · {data.time}
                </p>
                <p className="hidden truncate text-sm text-stone xs:block dark:text-haze">
                  {[data.sessionType && tTypes(data.sessionType), data.format && tFormats(data.format), price]
                    .filter(Boolean)
                    .join(" · ") || t("stepOf", { current: step, total: STEP_KEYS.length })}
                </p>
              </>
            ) : (
              <p className="text-stone dark:text-haze">{t("pickTime")}</p>
            )}
          </div>
          <PrimaryButton {...primaryShort} className="shrink-0" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Shared bits ───────────────────────── */

function PrimaryButton({
  label,
  onClick,
  disabled,
  icon: Icon,
  className = "",
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-pine px-6 font-semibold text-white transition-all duration-200 ease-smooth hover:bg-pineDark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-pine/30 disabled:active:scale-100 dark:bg-apricot dark:text-ink dark:hover:bg-apricot/90 dark:disabled:bg-mist/15 dark:disabled:text-mist/50 ${className}`}
    >
      {label}
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string | null; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-stone dark:text-haze">{label}</dt>
      <dd className={`text-right ${value ? (strong ? "font-display text-lg font-semibold" : "font-semibold") : "text-stone/60 dark:text-haze/50"}`}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

function StepNav({ current, onJump }: { current: Step; onJump: (s: Step) => void }) {
  const t = useTranslations("booking");
  return (
    <nav aria-label={t("stepOf", { current, total: STEP_KEYS.length })}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {STEP_KEYS.map((key, i) => {
          const n = (i + 1) as Step;
          const done = n < current;
          const active = n === current;
          const body = (
            <>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  active
                    ? "bg-apricot text-ink"
                    : done
                      ? "bg-pine text-white dark:bg-mist/20 dark:text-mist"
                      : "bg-linen text-stone dark:bg-mist/10 dark:text-haze"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : n}
              </span>
              {/* Labels: always for the current step, for all from sm up */}
              <span className={`${active ? "inline" : "hidden sm:inline"} whitespace-nowrap`}>{t(`steps.${key}`)}</span>
            </>
          );
          const base = "flex min-h-[44px] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-1.5 text-[0.95rem] font-medium transition-colors sm:pr-4";
          return (
            <li key={key} className={active ? "min-w-0" : ""}>
              {done ? (
                <button
                  type="button"
                  onClick={() => onJump(n)}
                  className={`${base} bg-mint text-pineDark hover:bg-mint/70 dark:bg-mist/10 dark:text-mist dark:hover:bg-mist/15`}
                >
                  {body}
                </button>
              ) : (
                <span
                  aria-current={active ? "step" : undefined}
                  className={`${base} ${
                    active
                      ? "bg-night pr-4 text-mist dark:bg-mist dark:text-night"
                      : "border border-line bg-white text-stone dark:border-mist/10 dark:bg-transparent dark:text-haze"
                  }`}
                >
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h2>
      {subtitle && <p className="mt-1.5 max-w-xl leading-relaxed text-stone dark:text-haze">{subtitle}</p>}
    </div>
  );
}

/* ───────────────────────── Step 1 · Time ───────────────────────── */

function StepTime({
  data,
  update,
  days,
  failed,
  retry,
}: {
  data: BookingData;
  update: Update;
  days: Day[] | null;
  failed: boolean;
  retry: () => void;
}) {
  const t = useTranslations("booking.time");
  const locale = useLocale();
  const pages = days ? Math.ceil(days.length / DAYS_PER_PAGE) : 1;
  const selectedIndex = days && data.date ? days.findIndex((d) => d.date === data.date) : -1;
  const [page, setPage] = useState(0);

  // Show the week that contains the selected day (e.g. pre-picked from the home page)
  useEffect(() => {
    if (selectedIndex >= 0) setPage(Math.floor(selectedIndex / DAYS_PER_PAGE));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the list (re)loads
  }, [days]);

  const visible = days ? days.slice(page * DAYS_PER_PAGE, page * DAYS_PER_PAGE + DAYS_PER_PAGE) : [];
  const selectedDay = days?.find((d) => d.date === data.date);
  const morning = selectedDay?.slots.filter((s) => s < "12:00") ?? [];
  const afternoon = selectedDay?.slots.filter((s) => s >= "12:00") ?? [];
  const nothingAtAll = days && days.every((d) => d.slots.length === 0);

  return (
    <div>
      <StepHeading title={t("title")} subtitle={t("subtitle")} />

      {failed && (
        <div className="rounded-3xl border border-line bg-white p-6 dark:border-mist/10 dark:bg-mist/[0.03]">
          <p className="mb-4 text-stone dark:text-haze">{t("error")}</p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-[44px] items-center rounded-full border border-line px-5 font-semibold text-pine hover:border-pine dark:border-mist/20 dark:text-apricot"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {!days && !failed && (
        <div aria-busy="true" aria-label={t("loading")} className="space-y-6">
          <div className="h-6 w-40 animate-pulse rounded-full bg-line/70 dark:bg-mist/10" />
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-white dark:bg-mist/[0.06] sm:h-[5.75rem]" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 xs:grid-cols-4 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white dark:bg-mist/[0.06]" />
            ))}
          </div>
        </div>
      )}

      {days && nothingAtAll && (
        <div className="rounded-3xl border border-line bg-white p-6 dark:border-mist/10 dark:bg-mist/[0.03]">
          <p className="mb-4 leading-relaxed text-stone dark:text-haze">{t("emptyAll")}</p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-pine px-5 font-semibold text-white dark:bg-apricot dark:text-ink"
          >
            {t("contact")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}

      {days && !nothingAtAll && (
        <>
          {/* Week header with paging */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-display text-lg font-semibold tracking-tight" aria-live="polite">
              {formatMonthRange(
                visible.map((d) => d.date),
                locale
              )}
            </p>
            <div className="flex gap-1.5">
              <PageButton label={t("prevWeek")} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={18} aria-hidden="true" />
              </PageButton>
              <PageButton label={t("nextWeek")} disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={18} aria-hidden="true" />
              </PageButton>
            </div>
          </div>

          {/* Days */}
          <div key={page} className="grid animate-fadeUp grid-cols-7 gap-1 sm:gap-2">
            {visible.map((d) => {
              const { weekday, day } = dateParts(d.date, locale);
              const free = d.slots.length;
              const selected = d.date === data.date;
              const closed = free === 0;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={closed}
                  aria-pressed={selected}
                  aria-label={`${formatDateLabel(d.date, locale)} — ${closed ? t("closed") : t("free", { count: free })}`}
                  onClick={() => {
                    update("date", d.date);
                    if (!selected) update("time", null);
                  }}
                  className={`flex min-h-[4.5rem] flex-col items-center justify-center rounded-2xl border px-0.5 py-2 transition-colors duration-200 sm:min-h-[5.75rem] ${
                    closed
                      ? "cursor-not-allowed border-dashed border-line text-stone/70 dark:border-mist/15 dark:text-haze/60"
                      : selected
                        ? "border-night bg-night text-mist dark:border-apricot dark:bg-apricot dark:text-ink"
                        : "border-line bg-white text-ink hover:border-pine/60 dark:border-mist/10 dark:bg-mist/[0.04] dark:text-mist dark:hover:border-mist/30"
                  }`}
                >
                  <span className="text-[0.72rem] font-semibold uppercase tracking-wide opacity-75 sm:text-xs">{weekday}</span>
                  <span className="font-display text-xl font-semibold leading-tight sm:text-2xl">{day}</span>
                  {/* Phones: a dot for "has times". Larger: the count. */}
                  <span
                    aria-hidden="true"
                    className={`mt-1 h-1.5 w-1.5 rounded-full sm:hidden ${closed ? "bg-transparent" : selected ? "bg-apricot dark:bg-ink" : "bg-pine dark:bg-apricot"}`}
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-1 hidden whitespace-nowrap text-xs sm:block ${
                      closed ? "" : selected ? "text-apricot dark:text-ink" : "text-pine dark:text-apricot"
                    }`}
                  >
                    {closed ? t("closed") : t("free", { count: free })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Times */}
          <div className="mt-8">
            {!selectedDay && <p className="text-stone dark:text-haze">{t("pickDay")}</p>}
            {selectedDay && (
              <div key={selectedDay.date} className="animate-fadeUp space-y-6">
                {[
                  { label: t("morning"), slots: morning },
                  { label: t("afternoon"), slots: afternoon },
                ]
                  .filter((g) => g.slots.length)
                  .map((g) => (
                    <fieldset key={g.label}>
                      <legend className="mb-3 text-sm font-semibold uppercase tracking-widest text-stone dark:text-haze">{g.label}</legend>
                      <div className="grid grid-cols-3 gap-2 xs:grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                        {g.slots.map((s) => {
                          const selected = data.time === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => update("time", s)}
                              className={`flex min-h-[50px] items-center justify-center gap-1.5 rounded-xl border text-base font-semibold tabular-nums transition-colors duration-200 ${
                                selected
                                  ? "border-apricot bg-apricot text-ink"
                                  : "border-line bg-white hover:border-pine/60 dark:border-mist/10 dark:bg-mist/[0.04] dark:hover:border-mist/30"
                              }`}
                            >
                              {selected && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:border-pine disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line dark:border-mist/15 dark:bg-transparent dark:text-mist"
    >
      {children}
    </button>
  );
}

/* ───────────────────────── Step 2 · Session ───────────────────────── */

function Choice({
  selected,
  onClick,
  icon: Icon,
  title,
  text,
  aside,
}: {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  text: string;
  aside?: string | null;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex h-full w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors duration-200 sm:p-5 ${
        selected
          ? "border-night bg-white ring-1 ring-night dark:border-apricot dark:bg-mist/[0.06] dark:ring-apricot"
          : "border-line bg-white hover:border-pine/60 dark:border-mist/10 dark:bg-mist/[0.03] dark:hover:border-mist/30"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${
          selected ? "bg-night text-apricot dark:bg-apricot dark:text-ink" : "bg-mint text-pine dark:bg-mist/10 dark:text-apricot"
        }`}
      >
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 pr-6">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-[1.05rem] font-semibold">{title}</span>
          {aside && <span className="font-display font-semibold text-pine dark:text-apricot">{aside}</span>}
        </span>
        <span className="mt-0.5 block text-[0.95rem] leading-snug text-stone dark:text-haze">{text}</span>
      </span>
      <span
        aria-hidden="true"
        className={`absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border transition-colors ${
          selected ? "border-night bg-night text-white dark:border-apricot dark:bg-apricot dark:text-ink" : "border-line dark:border-mist/20"
        }`}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

function StepSession({ data, update, prices }: { data: BookingData; update: Update; prices: Prices }) {
  const t = useTranslations("booking.session");
  const tTypes = useTranslations("booking.step1");
  const tFormats = useTranslations("booking.step2");
  return (
    <div>
      <StepHeading title={t("title")} />
      <fieldset className="mb-8">
        <legend className="mb-3 text-sm font-semibold uppercase tracking-widest text-stone dark:text-haze">{t("typeLabel")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice
            selected={data.sessionType === "individual"}
            onClick={() => update("sessionType", "individual")}
            icon={User}
            title={tTypes("individual")}
            text={t("individualText")}
            aside={prices.individual}
          />
          <Choice
            selected={data.sessionType === "couples"}
            onClick={() => update("sessionType", "couples")}
            icon={Users}
            title={tTypes("couples")}
            text={t("couplesText")}
            aside={prices.couples}
          />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold uppercase tracking-widest text-stone dark:text-haze">{t("formatLabel")}</legend>
        <div className="grid gap-3">
          {(["video", "chat", "async"] as const).map((f) => (
            <Choice
              key={f}
              selected={data.format === f}
              onClick={() => update("format", f)}
              icon={FORMAT_ICON[f]}
              title={tFormats(f)}
              text={t(`${f}Text`)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/* ───────────────────────── Step 3 · Details ───────────────────────── */

function StepDetails({ data, update }: { data: BookingData; update: Update }) {
  const t = useTranslations("booking.step4");
  const tD = useTranslations("booking.details");
  const tNote = useTranslations("booking.step5");
  const locale = useLocale();
  const [emailTouched, setEmailTouched] = useState(false);
  const emailBad = emailTouched && data.email.trim() !== "" && !EMAIL_RE.test(data.email.trim());
  const input =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-stone/60 focus:border-pine focus:ring-2 focus:ring-pine/15 dark:border-mist/15 dark:bg-mist/[0.04] dark:focus:border-apricot dark:focus:ring-apricot/20";
  const label = "mb-1.5 block text-[0.95rem] font-semibold";

  return (
    <div>
      <StepHeading title={tD("title")} subtitle={tD("subtitle")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="bk-name" className={label}>
            {t("name")}
          </label>
          <input
            id="bk-name"
            className={input}
            autoComplete="name"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bk-email" className={label}>
            {t("email")}
          </label>
          <input
            id="bk-email"
            className={`${input} ${emailBad ? "border-clay focus:border-clay focus:ring-clay/15" : ""}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={emailBad}
            aria-describedby={emailBad ? "bk-email-err" : undefined}
            value={data.email}
            onBlur={() => setEmailTouched(true)}
            onChange={(e) => update("email", e.target.value)}
          />
          {emailBad && (
            <p id="bk-email-err" className="mt-1.5 text-sm text-clay dark:text-apricot">
              {tD("emailInvalid")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="bk-phone" className={label}>
            {t("phone")} <span className="font-normal text-stone dark:text-haze">({tD("optional")})</span>
          </label>
          <input
            id="bk-phone"
            className={input}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bk-note" className={label}>
            {tD("noteLabel")} <span className="font-normal text-stone dark:text-haze">({tD("optional")})</span>
          </label>
          <textarea
            id="bk-note"
            className={`${input} min-h-[120px] leading-relaxed`}
            placeholder={tNote("placeholder")}
            value={data.note}
            onChange={(e) => update("note", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <CheckRow checked={data.saveInfo} onChange={(v) => update("saveInfo", v)}>
          {t("saveInfo")}
        </CheckRow>
        <CheckRow checked={data.consent} onChange={(v) => update("consent", v)} required>
          {t.rich("consent", {
            link: (chunks) => (
              <a
                href={`/${locale}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-pine underline underline-offset-2 dark:text-apricot"
              >
                {chunks}
              </a>
            ),
          })}
        </CheckRow>
      </div>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-[0.95rem] leading-relaxed transition-colors ${
        checked ? "border-pine/40 bg-mint/50 dark:border-apricot/40 dark:bg-mist/[0.06]" : "border-line bg-white dark:border-mist/10 dark:bg-mist/[0.03]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        required={required}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-pine dark:accent-apricot"
      />
      <span>{children}</span>
    </label>
  );
}

/* ───────────────────────── Step 4 · Confirm ───────────────────────── */

function StepConfirm({ data, price, onEdit }: { data: BookingData; price: string | null; onEdit: (s: Step) => void }) {
  const t = useTranslations("booking");
  const tTypes = useTranslations("booking.step1");
  const tFormats = useTranslations("booking.step2");
  const locale = useLocale();
  const rows: { step: Step; label: string; lines: string[] }[] = [
    {
      step: 1,
      label: t("steps.time"),
      lines: [data.date && data.time ? `${formatDateLabel(data.date, locale)} · ${data.time}` : "—"],
    },
    {
      step: 2,
      label: t("steps.session"),
      lines: [
        [data.sessionType && tTypes(data.sessionType), data.format && tFormats(data.format)].filter(Boolean).join(" · "),
        ...(price ? [price] : []),
      ],
    },
    {
      step: 3,
      label: t("review.contactLabel"),
      lines: [data.name, data.email, data.phone].filter((v) => v.trim()),
    },
  ];
  if (data.note.trim()) rows.push({ step: 3, label: t("review.noteLabel"), lines: [data.note.trim()] });

  return (
    <div>
      <StepHeading title={t("review.title")} subtitle={t("review.subtitle")} />
      <div className="divide-y divide-line rounded-3xl border border-line bg-white dark:divide-mist/10 dark:border-mist/10 dark:bg-mist/[0.03]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-stone dark:text-haze">{r.label}</p>
              {r.lines.map((line, i) => (
                <p key={i} className={`break-words ${i === 0 ? "font-semibold" : "text-stone dark:text-haze"} whitespace-pre-line`}>
                  {line}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onEdit(r.step)}
              className="-mr-2 inline-flex min-h-[44px] shrink-0 items-center rounded-full px-3 text-[0.95rem] font-semibold text-pine hover:bg-mint dark:text-apricot dark:hover:bg-mist/10"
            >
              {t("review.edit")}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone dark:text-haze">{t("policyNote")}</p>
    </div>
  );
}

/* ───────────────────────── Done ───────────────────────── */

function Success({ data, price }: { data: BookingData; price: string | null }) {
  const t = useTranslations("booking");
  const tTypes = useTranslations("booking.step1");
  const tFormats = useTranslations("booking.step2");
  const locale = useLocale();
  return (
    <div className="animate-fadeUp text-center">
      <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-full bg-apricot text-ink shadow-lifted">
        <Check size={30} strokeWidth={2.5} aria-hidden="true" />
      </div>
      <h1 className="mb-2 text-display-md font-semibold">{t("step6.title")}</h1>
      <p className="mb-2 text-lg text-stone dark:text-haze">{t("step6.subtitle")}</p>
      {data.saveInfo && <p className="text-[0.95rem] text-stone dark:text-haze">{t("loginLinkSent")}</p>}

      <div className="mx-auto mt-9 max-w-sm rounded-3xl bg-night p-6 text-left text-mist">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-apricot">{t("step6.summaryTitle")}</p>
        {data.date && data.time && (
          <p className="font-display text-2xl font-semibold tracking-tight">
            {formatDateLabel(data.date, locale)} · {data.time}
          </p>
        )}
        <p className="mt-1 text-haze">
          {[data.sessionType && tTypes(data.sessionType), data.format && tFormats(data.format), price].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-4 border-t border-mist/10 pt-4 text-sm text-haze">{data.email}</p>
      </div>

      <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-stone dark:text-haze">{t("policyNote")}</p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line px-6 font-semibold text-pine hover:border-pine dark:border-mist/20 dark:text-apricot"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
