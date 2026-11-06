import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronRight, LogOut, Mail, MessageCircle, Plus, Video } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { dateParts, formatClinicDateTime, utcToClinic } from "@/lib/timezone";
import { SESSION_COOKIE, UUID_RE } from "@/lib/patientAuth";
import { pageMetadata, type LocaleParams } from "@/lib/pageMetadata";

interface BookingRow {
  id: string;
  session_type: string;
  format: string;
  scheduled_at: string;
  status: string;
  cancel_token: string;
}

type Labels = { type: (v: string) => string; format: (v: string) => string; status: (v: string) => string };

const FORMAT_ICON: Record<string, typeof Video> = { video: Video, chat: MessageCircle, async: Mail };

export const generateMetadata = ({ params: { locale } }: LocaleParams) => pageMetadata(locale, { title: "dashboard.title", noindex: true });

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId || !UUID_RE.test(sessionId)) redirect(`/${locale}/login`);

  const { data: session } = await supabaseAdmin
    .from("patient_sessions")
    .select("patient_id, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) {
    redirect(`/${locale}/login?error=expired`);
  }

  const [{ data: patient }, { data: bookings }] = await Promise.all([
    supabaseAdmin.from("patients").select("name, email").eq("id", session!.patient_id).maybeSingle(),
    supabaseAdmin
      .from("bookings")
      .select("id, session_type, format, scheduled_at, status, cancel_token")
      .eq("patient_id", session!.patient_id)
      .order("scheduled_at", { ascending: true }),
  ]);

  const [t, tTypes, tFormats, tStatus] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("booking.step1"),
    getTranslations("booking.step2"),
    getTranslations("booking.status"),
  ]);
  const labels: Labels = {
    type: (v) => (v === "individual" || v === "couples" ? tTypes(v) : v),
    format: (v) => (v === "video" || v === "chat" || v === "async" ? tFormats(v) : v),
    status: (v) => (v === "pending" || v === "confirmed" || v === "completed" || v === "cancelled" ? tStatus(v) : v),
  };

  const now = new Date();
  const all = (bookings as BookingRow[]) ?? [];
  const upcoming = all.filter((b) => new Date(b.scheduled_at) >= now && b.status !== "cancelled");
  // Most recent first for history
  const past = all.filter((b) => new Date(b.scheduled_at) < now || b.status === "cancelled").reverse();
  const [next, ...later] = upcoming;
  const firstName = patient?.name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-3xl px-page pb-6 pt-12 sm:pt-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-clay dark:text-apricot">{t("title")}</p>
          <h1 className="break-words text-display-md font-semibold">
            {firstName ? t("greeting", { name: firstName }) : t("title")}
          </h1>
        </div>
        <form action={`/api/auth/patient/logout?locale=${locale}`} method="POST">
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 text-[0.95rem] font-semibold text-stone transition-colors hover:border-clay hover:text-clay dark:border-mist/20 dark:text-haze dark:hover:border-apricot dark:hover:text-apricot"
          >
            <LogOut size={16} aria-hidden="true" />
            {t("signOut")}
          </button>
        </form>
      </div>

      {/* Next session */}
      {next ? (
        <Link
          href={`/${locale}/manage/${next.cancel_token}`}
          className="group relative block overflow-hidden rounded-[1.75rem] bg-night p-6 text-mist sm:p-8 dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10"
        >
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(240,162,123,0.35),rgba(240,162,123,0)_70%)]"
          />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-apricot">{t("nextSession")}</p>
            <p className="font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              {formatClinicDateTime(next.scheduled_at, locale, { dateStyle: "full", timeStyle: "short" })}
            </p>
            <p className="mt-2 text-haze">
              {labels.type(next.session_type)} · {labels.format(next.format)} · {labels.status(next.status)}
            </p>
            <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-apricot px-6 font-semibold text-ink">
              {t("manage")}
              <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="rounded-[1.75rem] border border-line bg-white p-6 sm:p-8 dark:border-mist/10 dark:bg-mist/[0.03]">
          <p className="mb-5 text-lg text-stone dark:text-haze">{t("noUpcoming")}</p>
          <Link
            href={`/${locale}/book`}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-pine px-6 font-semibold text-white dark:bg-apricot dark:text-ink"
          >
            {t("bookNew")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      )}

      {next && (
        <Link
          href={`/${locale}/book`}
          className="mt-3 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-dashed border-line font-semibold text-pine transition-colors hover:border-pine dark:border-mist/20 dark:text-apricot dark:hover:border-apricot"
        >
          <Plus size={18} aria-hidden="true" />
          {t("bookAnother")}
        </Link>
      )}

      {later.length > 0 && <BookingGroup title={t("upcoming")} bookings={later} locale={locale} labels={labels} />}
      <BookingGroup title={t("past")} bookings={past} locale={locale} labels={labels} emptyText={t("noPast")} muted />
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
  locale,
  labels,
  emptyText,
  muted = false,
}: {
  title: string;
  bookings: BookingRow[];
  locale: string;
  labels: Labels;
  emptyText?: string;
  muted?: boolean;
}) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-display text-xl font-semibold tracking-tight">{title}</h2>
      {bookings.length === 0 && emptyText && <p className="text-stone dark:text-haze">{emptyText}</p>}
      <ul className="space-y-3">
        {bookings.map((b) => {
          const { date, time } = utcToClinic(b.scheduled_at);
          const { weekday, day, month } = dateParts(date, locale);
          const Icon = FORMAT_ICON[b.format] ?? Video;
          const cancelled = b.status === "cancelled";
          return (
            <li key={b.id}>
              <Link
                href={`/${locale}/manage/${b.cancel_token}`}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-3 pr-4 transition-colors hover:border-pine/50 sm:p-4 dark:border-mist/10 dark:bg-mist/[0.03] dark:hover:border-mist/30"
              >
                <span
                  className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${
                    muted ? "bg-linen text-stone dark:bg-mist/[0.06] dark:text-haze" : "bg-mint text-pineDark dark:bg-mist/10 dark:text-mist"
                  }`}
                >
                  <span className="text-[0.7rem] font-semibold uppercase tracking-wide">{weekday}</span>
                  <span className="font-display text-xl font-semibold leading-none">{day}</span>
                  <span className="text-[0.75rem]">{month}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold ${cancelled ? "text-stone line-through dark:text-haze" : ""}`}>
                    {time} · {labels.type(b.session_type)}
                  </span>
                  <span className="mt-0.5 flex items-start gap-1.5 text-sm text-stone dark:text-haze">
                    <Icon size={14} aria-hidden="true" className="mt-[3px] shrink-0" />
                    <span>
                      {labels.format(b.format)} · {labels.status(b.status)}
                    </span>
                  </span>
                </span>
                <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-stone transition-transform group-hover:translate-x-0.5 dark:text-haze" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
