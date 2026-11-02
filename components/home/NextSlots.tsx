"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { dateParts } from "@/lib/timezone";

// Real, live availability on the home page: the next few days that have open
// times. Tapping a time opens the booking flow with that date and time
// already chosen. Never shows invented slots — if nothing loads, it says so.
interface Day {
  date: string;
  slots: string[];
}

const MAX_TIMES = 8; // two rows of four; beyond that a "+N" tile opens the full day

export function NextSlots({
  locale,
  labels,
}: {
  locale: string;
  labels: {
    title: string;
    timezone: string;
    loading: string;
    empty: string;
    error: string;
    cta: string;
    /** Contains "{count}", e.g. "{count} more times" */
    more: string;
  };
}) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/availability?next=3", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => !cancelled && setDays(Array.isArray(json.days) ? json.days : []))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const day = days?.[active];
  const overflow = day && day.slots.length > MAX_TIMES;
  const shown = day ? (overflow ? day.slots.slice(0, MAX_TIMES - 1) : day.slots) : [];
  const hidden = day ? day.slots.length - shown.length : 0;

  return (
    <div className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card sm:p-7 dark:border-mist/10 dark:bg-mist/[0.04]">
      <div className="mb-5">
        <p className="font-display text-xl font-semibold tracking-tight">{labels.title}</p>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-stone dark:text-haze">
          <Clock size={14} aria-hidden="true" className="mt-[3px] shrink-0" />
          {labels.timezone}
        </p>
      </div>

      {!days && !failed && (
        <div className="space-y-4" aria-busy="true" aria-label={labels.loading}>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[5.25rem] animate-pulse rounded-2xl bg-linen dark:bg-mist/10" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 xs:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-linen dark:bg-mist/10" />
            ))}
          </div>
        </div>
      )}

      {(failed || (days && days.length === 0)) && (
        <p className="rounded-2xl bg-linen px-4 py-4 text-stone dark:bg-mist/[0.06] dark:text-haze">
          {failed ? labels.error : labels.empty}
        </p>
      )}

      {days && days.length > 0 && (
        <>
          <div role="tablist" aria-label={labels.title} className="mb-4 grid grid-cols-3 gap-2">
            {days.map((d, i) => {
              const { weekday, day: dayNum, month } = dateParts(d.date, locale);
              const selected = i === active;
              return (
                <button
                  key={d.date}
                  id={`slots-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="slots-panel"
                  onClick={() => setActive(i)}
                  className={`flex min-h-[5.25rem] flex-col items-center justify-center rounded-2xl border px-1 py-2 transition-colors duration-200 ${
                    selected
                      ? "border-night bg-night text-mist dark:border-apricot dark:bg-apricot dark:text-ink"
                      : "border-line bg-linen text-ink hover:border-pine/50 dark:border-mist/10 dark:bg-transparent dark:text-mist dark:hover:border-mist/30"
                  }`}
                >
                  <span className="text-[0.75rem] font-semibold uppercase tracking-wider opacity-75">{weekday}</span>
                  <span className="font-display text-[1.65rem] font-semibold leading-none tracking-tight">{dayNum}</span>
                  <span className="mt-0.5 text-[0.8rem] opacity-75">{month}</span>
                </button>
              );
            })}
          </div>

          {day && (
            <div
              id="slots-panel"
              role="tabpanel"
              aria-labelledby={`slots-tab-${active}`}
              key={day.date}
              className="grid animate-fadeUp grid-cols-3 gap-2 xs:grid-cols-4"
            >
              {shown.map((time) => (
                <Link
                  key={time}
                  href={`/${locale}/book?date=${day.date}&time=${time}`}
                  className="flex min-h-[46px] items-center justify-center rounded-xl border border-line text-[0.95rem] font-semibold tabular-nums transition-colors hover:border-apricot hover:bg-apricot hover:text-ink dark:border-mist/15"
                >
                  {time}
                </Link>
              ))}
              {hidden > 0 && (
                <Link
                  href={`/${locale}/book?date=${day.date}`}
                  aria-label={labels.more.replace("{count}", String(hidden))}
                  title={labels.more.replace("{count}", String(hidden))}
                  className="flex min-h-[46px] items-center justify-center rounded-xl border border-dashed border-line text-[0.95rem] font-semibold text-pine transition-colors hover:border-pine dark:border-mist/20 dark:text-apricot"
                >
                  +{hidden}
                </Link>
              )}
            </div>
          )}
        </>
      )}

      <Link
        href={`/${locale}/book`}
        className="group mt-5 flex min-h-[48px] items-center justify-between gap-3 border-t border-line pt-4 font-semibold text-pine dark:border-mist/10 dark:text-apricot"
      >
        {labels.cta}
        <span className="grid h-9 w-9 place-items-center rounded-full bg-mint transition-transform duration-300 group-hover:translate-x-1 dark:bg-mist/10">
          <ArrowRight size={17} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}
