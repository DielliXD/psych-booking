"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createBooking } from "@/lib/bookings";
import { fetchAvailableSlots } from "@/lib/availabilityClient";
import { addDays, formatDateLabel, todayInClinic } from "@/lib/timezone";
import { ChevronLeft, ChevronRight, Check, User, Users, Video, MessageCircle, Mail } from "lucide-react";

type SessionType = "individual" | "couples";
type Format = "video" | "chat" | "async";

interface BookingData {
  sessionType: SessionType | null;
  format: Format | null;
  date: string | null;
  time: string | null;
  name: string;
  email: string;
  phone: string;
  saveInfo: boolean;
  note: string;
}

const TOTAL_STEPS = 6;

const initialData: BookingData = {
  sessionType: null,
  format: null,
  date: null,
  time: null,
  name: "",
  email: "",
  phone: "",
  saveInfo: false,
  note: "",
};

export function BookingWizard() {
  const t = useTranslations("booking");
  const tTypes = useTranslations("booking.step1");
  const tFormats = useTranslations("booking.step2");
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof BookingData>(key: K, value: BookingData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1:
        return !!data.sessionType;
      case 2:
        return !!data.format;
      case 3:
        return !!data.date && !!data.time;
      case 4:
        return data.name.trim().length > 0 && /\S+@\S+\.\S+/.test(data.email);
      case 5:
        return true;
      default:
        return true;
    }
  }, [step, data]);

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }
  function back() {
    if (step > 1) setStep(step - 1);
  }

  async function handleSubmit() {
    if (!data.sessionType || !data.format || !data.date || !data.time) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBooking({
        sessionType: data.sessionType,
        format: data.format,
        date: data.date,
        time: data.time,
        name: data.name,
        email: data.email,
        phone: data.phone,
        note: data.note,
        locale,
      });

      if (data.saveInfo) {
        fetch("/api/auth/patient/request-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, locale }),
        }).catch((err) => console.error("Login link failed to send:", err));
      }

      setStep(6);
    } catch (err: any) {
      if (err?.message === "SLOT_TAKEN") {
        setError(t("slotTaken"));
        setStep(3);
      } else {
        setError(t("submitError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20">
      <h1 className="text-4xl mb-3 text-ink dark:text-mist tracking-tightest">{t("title")}</h1>

      {step < 6 && (
        <>
          <p className="text-sm text-ink/45 dark:text-mist/45 mb-8">
            {t("stepLabel", { current: step, total: TOTAL_STEPS - 1 })}
          </p>
          <StepDots current={step} total={TOTAL_STEPS - 1} />
        </>
      )}

      <div className="grid md:grid-cols-3 gap-12 mt-10">
        <div className="md:col-span-2">
          {error && (
            <p className="mb-5 text-sm text-clay bg-clay/10 rounded-xl px-4 py-3 animate-fadeUp">{error}</p>
          )}

          <div key={step} className="animate-fadeUp">
            {step === 1 && <StepSessionType data={data} update={update} />}
            {step === 2 && <StepFormat data={data} update={update} />}
            {step === 3 && <StepDateTime data={data} update={update} />}
            {step === 4 && <StepDetails data={data} update={update} />}
            {step === 5 && <StepNote data={data} update={update} />}
            {step === 6 && <StepConfirmation data={data} />}
          </div>

          {step < 6 && (
            <div className="flex items-center justify-between mt-12">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className="inline-flex items-center gap-1 text-sm text-ink/55 dark:text-mist/55 hover:text-ink dark:hover:text-mist disabled:opacity-0 transition-colors"
              >
                <ChevronLeft size={16} /> {t("back")}
              </button>

              {step === 5 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-7 py-3.5 text-sm font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth disabled:opacity-50 disabled:translate-y-0 disabled:shadow-soft"
                >
                  {submitting ? "..." : t("confirm")} <Check size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canAdvance}
                  className="inline-flex items-center gap-1.5 rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-7 py-3.5 text-sm font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none"
                >
                  {t("next")} <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {step < 6 && (
          <aside className="h-fit rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] shadow-soft p-6 text-sm space-y-3 text-ink/70 dark:text-mist/70">
            <p className="text-xs font-medium tracking-widest uppercase text-clay mb-1">{t("summary")}</p>
            {!data.sessionType && !data.format && !data.date && (
              <p className="text-ink/35 dark:text-mist/35 italic">{t("summaryEmpty")}</p>
            )}
            {data.sessionType && (
              <SummaryRow icon={data.sessionType === "individual" ? User : Users} label={tTypes(data.sessionType)} />
            )}
            {data.format && (
              <SummaryRow
                icon={data.format === "video" ? Video : data.format === "chat" ? MessageCircle : Mail}
                label={tFormats(data.format)}
              />
            )}
            {data.date && data.time && (
              <p className="pt-2 border-t border-pine/10 dark:border-sage/10 text-ink dark:text-mist font-medium">
                {data.date} · {data.time}
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <p className="flex items-center gap-2.5">
      <Icon size={15} className="text-clay shrink-0" />
      {label}
    </p>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={stepNum} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1.5 rounded-full flex-1 transition-all duration-500 ease-smooth ${
                done || active
                  ? "bg-pine dark:bg-sage"
                  : "bg-pine/10 dark:bg-sage/10"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  icon?: any;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border-2 px-5 py-5 transition-all duration-250 ease-smooth ${
        selected
          ? "border-pine dark:border-sage bg-pine/[0.04] dark:bg-sage/[0.06] shadow-card"
          : "border-pine/10 dark:border-sage/10 hover:border-pine/30 dark:hover:border-sage/30 hover:shadow-soft"
      }`}
    >
      <div className="flex items-center gap-3.5">
        {Icon && (
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-250 ${
              selected ? "bg-pine text-linen dark:bg-sage dark:text-charcoalGreen" : "bg-pine/8 dark:bg-sage/10 text-pine dark:text-sage"
            }`}
          >
            <Icon size={18} />
          </span>
        )}
        <span className={`font-medium ${selected ? "text-pine dark:text-sage" : "text-ink dark:text-mist"}`}>
          {title}
        </span>
      </div>
      {selected && (
        <span className="absolute top-3.5 right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-pine dark:bg-sage text-linen dark:text-charcoalGreen">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function StepSessionType({
  data,
  update,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
}) {
  const t = useTranslations("booking.step1");
  return (
    <div>
      <h2 className="text-2xl mb-6 text-ink dark:text-mist tracking-tightest">{t("title")}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <OptionCard
          selected={data.sessionType === "individual"}
          onClick={() => update("sessionType", "individual")}
          title={t("individual")}
          icon={User}
        />
        <OptionCard
          selected={data.sessionType === "couples"}
          onClick={() => update("sessionType", "couples")}
          title={t("couples")}
          icon={Users}
        />
      </div>
    </div>
  );
}

function StepFormat({
  data,
  update,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
}) {
  const t = useTranslations("booking.step2");
  return (
    <div>
      <h2 className="text-2xl mb-6 text-ink dark:text-mist tracking-tightest">{t("title")}</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <OptionCard selected={data.format === "video"} onClick={() => update("format", "video")} title={t("video")} icon={Video} />
        <OptionCard selected={data.format === "chat"} onClick={() => update("format", "chat")} title={t("chat")} icon={MessageCircle} />
        <OptionCard selected={data.format === "async"} onClick={() => update("format", "async")} title={t("async")} icon={Mail} />
      </div>
    </div>
  );
}

function StepDateTime({
  data,
  update,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
}) {
  const t = useTranslations("booking.step3");
  const locale = useLocale();
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Calendar dates in clinic time ("YYYY-MM-DD"), starting tomorrow
  const days = useMemo(() => {
    const today = todayInClinic();
    return Array.from({ length: 14 }).map((_, i) => addDays(today, i + 1));
  }, []);

  useEffect(() => {
    if (!data.date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    fetchAvailableSlots(data.date)
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data.date]);

  return (
    <div>
      <h2 className="text-2xl mb-6 text-ink dark:text-mist tracking-tightest">{t("title")}</h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {days.map((iso) => {
          const label = formatDateLabel(iso, locale);
          const selected = data.date === iso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => {
                update("date", iso);
                update("time", null);
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

      {data.date && (
        <div className="flex flex-wrap gap-2 animate-fadeUp">
          {loadingSlots && <p className="text-sm text-ink/40 dark:text-mist/40">...</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-ink/50 dark:text-mist/50">{t("noSlots")}</p>
          )}
          {!loadingSlots &&
            slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("time", s)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
                  data.time === s
                    ? "border-pine bg-pine text-linen dark:border-sage dark:bg-sage dark:text-charcoalGreen shadow-soft"
                    : "border-pine/10 dark:border-sage/10 text-ink/70 dark:text-mist/70 hover:border-pine/30 dark:hover:border-sage/30"
                }`}
              >
                {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium tracking-wide uppercase text-ink/40 dark:text-mist/40 mb-2">{children}</label>;
}

function StepDetails({
  data,
  update,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
}) {
  const t = useTranslations("booking.step4");
  const inputClass =
    "w-full rounded-xl border-2 border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-pine dark:focus:border-sage focus:shadow-glow";
  return (
    <div className="space-y-5">
      <h2 className="text-2xl mb-1 text-ink dark:text-mist tracking-tightest">{t("title")}</h2>
      <div>
        <FieldLabel>{t("name")}</FieldLabel>
        <input className={inputClass} value={data.name} onChange={(e) => update("name", e.target.value)} />
      </div>
      <div>
        <FieldLabel>{t("email")}</FieldLabel>
        <input className={inputClass} type="email" value={data.email} onChange={(e) => update("email", e.target.value)} />
      </div>
      <div>
        <FieldLabel>{t("phone")}</FieldLabel>
        <input className={inputClass} type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} />
      </div>
      <label className="flex items-center gap-2.5 text-sm text-ink/65 dark:text-mist/65 pt-2 cursor-pointer">
        <input
          type="checkbox"
          checked={data.saveInfo}
          onChange={(e) => update("saveInfo", e.target.checked)}
          className="accent-pine dark:accent-sage h-4 w-4"
        />
        {t("saveInfo")}
      </label>
    </div>
  );
}

function StepNote({
  data,
  update,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
}) {
  const t = useTranslations("booking.step5");
  return (
    <div>
      <h2 className="text-2xl mb-1 text-ink dark:text-mist tracking-tightest">{t("title")}</h2>
      <p className="text-sm text-ink/45 dark:text-mist/45 mb-5">{t("subtitle")}</p>
      <textarea
        className="w-full rounded-xl border-2 border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:border-pine dark:focus:border-sage focus:shadow-glow min-h-[140px] leading-relaxed"
        placeholder={t("placeholder")}
        value={data.note}
        onChange={(e) => update("note", e.target.value)}
      />
    </div>
  );
}

function StepConfirmation({ data }: { data: BookingData }) {
  const t = useTranslations("booking.step6");
  const tBooking = useTranslations("booking");
  const tTypes = useTranslations("booking.step1");
  const tFormats = useTranslations("booking.step2");
  return (
    <div className="text-center py-14 animate-fadeUp">
      <div className="mx-auto mb-7 w-16 h-16 rounded-full bg-gradient-to-br from-pine to-pine/70 dark:from-sage dark:to-sage/70 shadow-lifted flex items-center justify-center">
        <Check className="text-linen dark:text-charcoalGreen" size={28} strokeWidth={2.5} />
      </div>
      <h2 className="text-3xl mb-2.5 text-ink dark:text-mist tracking-tightest">{t("title")}</h2>
      <p className="text-sm text-ink/55 dark:text-mist/55 mb-10">{t("subtitle")}</p>
      {data.saveInfo && (
        <p className="text-xs text-ink/45 dark:text-mist/45 mb-6 -mt-6">
          {tBooking("loginLinkSent")}
        </p>
      )}

      <div className="max-w-sm mx-auto text-left rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] shadow-soft p-6 text-sm space-y-2 text-ink/70 dark:text-mist/70">
        <p className="text-xs font-medium tracking-widest uppercase text-clay mb-2">{t("summaryTitle")}</p>
        <p className="font-medium text-ink dark:text-mist">{data.sessionType && tTypes(data.sessionType)}</p>
        <p>{data.format && tFormats(data.format)}</p>
        <p>
          {data.date} · {data.time}
        </p>
        <p className="pt-2 border-t border-pine/10 dark:border-sage/10">{data.name}</p>
        <p className="text-ink/50 dark:text-mist/50">{data.email}</p>
      </div>
    </div>
  );
}
