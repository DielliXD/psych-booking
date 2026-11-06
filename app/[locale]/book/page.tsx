import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { BookingWizard } from "@/components/BookingWizard";
import { getBookableDays } from "@/lib/availability";
import { getPrices } from "@/lib/prices";
import { pageMetadata, type LocaleParams } from "@/lib/pageMetadata";

// Always fresh: open times change whenever someone books.
export const dynamic = "force-dynamic";

export const generateMetadata = ({ params: { locale } }: LocaleParams) => pageMetadata(locale, { title: "booking.title" });

// The page shell is sent straight away; the calendar arrives in the same
// response as soon as availability is read (streaming), so the browser
// never has to load JavaScript first and then ask for the times.
export default function BookPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <BookingWithData />
    </Suspense>
  );
}

// If the database is slow, don't hold the page: after 2.5 s the calendar
// loads in the browser instead (the wizard fetches it itself).
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise.catch(() => fallback), new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

async function BookingWithData() {
  const [prices, days] = await Promise.all([
    withTimeout(getPrices(), 2500, { individual: null, couples: null }),
    withTimeout(getBookableDays(), 2500, null),
  ]);
  return <BookingWizard prices={prices} initialDays={days} />;
}

function BookingSkeleton() {
  const block = "animate-pulse rounded-2xl bg-white dark:bg-mist/[0.06]";
  return (
    <div className="mx-auto max-w-6xl px-page pt-8 sm:pt-12" aria-busy="true">
      <div className="mb-8 h-10 w-64 max-w-full animate-pulse rounded-full bg-line/70 dark:bg-mist/10" />
      <div className="mb-8 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11 w-11 animate-pulse rounded-full bg-line/70 sm:w-28 dark:bg-mist/10" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`h-[4.5rem] sm:h-[5.75rem] ${block}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 xs:grid-cols-4 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-12 ${block}`} />
            ))}
          </div>
        </div>
        <div className={`hidden h-80 lg:block ${block}`} />
      </div>
    </div>
  );
}
