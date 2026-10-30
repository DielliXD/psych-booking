import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface BookingRow {
  id: string;
  session_type: string;
  format: string;
  scheduled_at: string;
  status: string;
  cancel_token: string;
}

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const sessionId = cookies().get("patient_session")?.value;
  if (!sessionId) redirect(`/${locale}/login`);

  const { data: session } = await supabaseAdmin
    .from("patient_sessions")
    .select("patient_id, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) {
    redirect(`/${locale}/login?error=expired`);
  }

  const { data: patient } = await supabaseAdmin
    .from("patients")
    .select("name, email")
    .eq("id", session!.patient_id)
    .maybeSingle();

  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("id, session_type, format, scheduled_at, status, cancel_token")
    .eq("patient_id", session!.patient_id)
    .order("scheduled_at", { ascending: true });

  const now = new Date();
  const all = (bookings as BookingRow[]) ?? [];
  const upcoming = all.filter((b) => new Date(b.scheduled_at) >= now && b.status !== "cancelled");
  const past = all.filter((b) => new Date(b.scheduled_at) < now || b.status === "cancelled");

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-24">
      <div className="flex items-center justify-between mb-14">
        <div>
          <h1 className="text-3xl mb-1 text-ink dark:text-mist tracking-tightest">Your sessions</h1>
          <p className="text-sm text-ink/50 dark:text-mist/50">{patient?.name}</p>
        </div>
        <form action={`/api/auth/patient/logout?locale=${locale}`} method="POST">
          <button className="text-sm text-ink/50 dark:text-mist/50 hover:text-clay transition-colors">
            Sign out
          </button>
        </form>
      </div>

      <BookingGroup title="Upcoming" bookings={upcoming} emptyText="No upcoming sessions." locale={locale} />
      <div className="h-16" />
      <BookingGroup title="Past" bookings={past} emptyText="No past sessions yet." locale={locale} />
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
  emptyText,
  locale,
}: {
  title: string;
  bookings: BookingRow[];
  emptyText: string;
  locale: string;
}) {
  return (
    <section>
      <h2 className="text-xl mb-6 text-ink dark:text-mist">{title}</h2>
      {bookings.length === 0 && <p className="text-sm text-ink/50 dark:text-mist/50">{emptyText}</p>}
      <div className="space-y-3">
        {bookings.map((b) => {
          const when = new Date(b.scheduled_at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          });
          return (
            <Link
              key={b.id}
              href={`/${locale}/manage/${b.cancel_token}`}
              className="block rounded-2xl border border-pine/10 dark:border-sage/10 p-5 text-sm hover:shadow-soft hover:border-pine/25 dark:hover:border-sage/25 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium capitalize text-ink dark:text-mist">
                  {b.session_type} · {b.format}
                </span>
                <span className="text-xs text-ink/50 dark:text-mist/50">{when}</span>
              </div>
              <p className="text-xs text-ink/45 dark:text-mist/45 capitalize">{b.status}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
