"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { dateParts, formatDateLabel, formatMonthRange } from "@/lib/timezone";

// The week calendar + time grid used when booking and when rescheduling.
// Shows a week at a time (the 14-day window = 2 pages), how many times each
// day has free, and the chosen day's times split into morning / afternoon.

export interface Day {
  date: string;
  slots: string[];
}

const DAYS_PER_PAGE = 7;

/**
 * Loads the whole booking window in one request. `token` (when rescheduling)
 * makes the booking's own current slot count as free.
 */
export function useAvailability(token?: string, initialDays?: Day[] | null) {
  // initialDays: already loaded on the server (booking page) — no extra request
  const [days, setDays] = useState<Day[] | null>(initialDays ?? null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (): Promise<Day[] | null> => {
    setFailed(false);
    setDays(null);
    try {
      const params = new URLSearchParams({ range: "" });
      if (token) params.set("token", token);
      const res = await fetch(`/api/availability?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const list: Day[] = Array.isArray(json.days) ? json.days : [];
      setDays(list);
      return list;
    } catch {
      setFailed(true);
      return null;
    }
  }, [token]);

  return { days, failed, load };
}

export function SlotPicker({
  days,
  failed,
  retry,
  date,
  time,
  onPickDate,
  onPickTime,
  current,
  currentLabel,
}: {
  days: Day[] | null;
  failed: boolean;
  retry: () => void;
  date: string | null;
  time: string | null;
  /** Called with the new date; the caller should clear the time when the day changes. */
  onPickDate: (date: string) => void;
  onPickTime: (time: string) => void;
  /** When rescheduling: the booking's current slot, shown but not selectable. */
  current?: { date: string; time: string } | null;
  currentLabel?: string;
}) {
  const t = useTranslations("booking.time");
  const locale = useLocale();
  const pages = days ? Math.ceil(days.length / DAYS_PER_PAGE) : 1;
  const selectedIndex = days && date ? days.findIndex((d) => d.date === date) : -1;
  const [page, setPage] = useState(0);

  // Show the week that contains the selected day (e.g. pre-picked from the home page)
  useEffect(() => {
    if (selectedIndex >= 0) setPage(Math.floor(selectedIndex / DAYS_PER_PAGE));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the list (re)loads
  }, [days]);

  const visible = days ? days.slice(page * DAYS_PER_PAGE, page * DAYS_PER_PAGE + DAYS_PER_PAGE) : [];
  const selectedDay = days?.find((d) => d.date === date);
  const morning = selectedDay?.slots.filter((s) => s < "12:00") ?? [];
  const afternoon = selectedDay?.slots.filter((s) => s >= "12:00") ?? [];
  const nothingAtAll = days && days.every((d) => d.slots.length === 0);

  return (
    <div>
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
        <div role="status" aria-busy="true" aria-label={t("loading")} className="space-y-6">
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
              const selected = d.date === date;
              const closed = free === 0;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={closed}
                  aria-pressed={selected}
                  aria-label={`${formatDateLabel(d.date, locale)} — ${closed ? t("closed") : t("free", { count: free })}`}
                  onClick={() => onPickDate(d.date)}
                  className={`flex min-h-[4.5rem] flex-col items-center justify-center rounded-2xl border px-0.5 py-2 transition-colors duration-200 sm:min-h-[5.75rem] ${
                    closed
                      ? "cursor-not-allowed border-dashed border-line text-stone/70 dark:border-mist/15 dark:text-haze/60"
                      : selected
                        ? "border-night bg-night text-mist dark:border-apricot dark:bg-apricot dark:text-ink"
                        : "border-line bg-white text-ink hover:border-pine/60 dark:border-mist/10 dark:bg-mist/[0.04] dark:text-mist dark:hover:border-mist/30"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-75 sm:text-xs">{weekday}</span>
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
                          const selected = time === s;
                          const isCurrent = current?.date === selectedDay.date && current?.time === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              aria-pressed={selected}
                              disabled={isCurrent}
                              aria-label={isCurrent && currentLabel ? `${s} — ${currentLabel}` : undefined}
                              onClick={() => onPickTime(s)}
                              className={`flex min-h-[50px] flex-col items-center justify-center rounded-xl border text-base font-semibold tabular-nums transition-colors duration-200 ${
                                isCurrent
                                  ? "cursor-not-allowed border-dashed border-pine/40 text-stone dark:border-mist/25 dark:text-haze"
                                  : selected
                                    ? "border-apricot bg-apricot text-ink"
                                    : "border-line bg-white hover:border-pine/60 dark:border-mist/10 dark:bg-mist/[0.04] dark:hover:border-mist/30"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {selected && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                                {s}
                              </span>
                              {isCurrent && currentLabel && (
                                <span aria-hidden="true" className="text-[0.7rem] font-medium leading-tight">
                                  {currentLabel}
                                </span>
                              )}
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
