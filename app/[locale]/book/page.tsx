import { Suspense } from "react";
import { BookingWizard } from "@/components/BookingWizard";
import { getPrices } from "@/lib/prices";

// Prices change rarely; re-read them at most once a minute.
export const revalidate = 60;

// Suspense: the wizard reads ?date=&time= (pre-picked from the home page)
export default async function BookPage() {
  const prices = await getPrices();
  return (
    <Suspense fallback={null}>
      <BookingWizard prices={prices} />
    </Suspense>
  );
}
