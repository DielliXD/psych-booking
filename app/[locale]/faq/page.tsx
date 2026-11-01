"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const QUESTION_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];

export default function FaqPage() {
  const t = useTranslations("faqPage");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="max-w-3xl mx-auto px-page py-14 sm:py-24">
      <h1 className="text-4xl mb-14 text-ink dark:text-mist tracking-tightest">{t("title")}</h1>

      <div className="divide-y divide-pine/10 dark:divide-sage/10 mb-20">
        {QUESTION_KEYS.map((key, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={key} className="py-2">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left"
              >
                <span className="text-base font-medium text-ink dark:text-mist">{t(`${key}q`)}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink/40 dark:text-mist/40 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-smooth ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm leading-relaxed text-ink/60 dark:text-mist/60 max-w-xl">
                    {t(`${key}a`)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-clay/25 bg-gradient-to-br from-clay/8 to-clay/[0.02] dark:from-clay/10 dark:to-clay/[0.02] p-7 shadow-soft">
        <h2 className="text-base font-medium mb-2 text-ink dark:text-mist">{t("crisisNoteTitle")}</h2>
        <p className="text-sm leading-relaxed text-ink/65 dark:text-mist/65">{t("crisisNoteText")}</p>
      </div>
    </section>
  );
}
