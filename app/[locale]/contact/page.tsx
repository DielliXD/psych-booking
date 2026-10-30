"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Check } from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const [sent, setSent] = useState(false);
  const inputClass =
    "w-full rounded-xl border-2 border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-pine dark:focus:border-sage focus:shadow-glow";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <section className="max-w-xl mx-auto px-6 lg:px-8 py-24">
      <h1 className="text-4xl mb-12 text-ink dark:text-mist tracking-tightest">{t("title")}</h1>
      {sent ? (
        <div className="rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] shadow-soft p-8 flex items-center gap-4 animate-fadeUp">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine dark:bg-sage text-linen dark:text-charcoalGreen">
            <Check size={18} />
          </span>
          <p className="text-ink/70 dark:text-mist/70">Message sent.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <input className={inputClass} placeholder={t("name")} required />
          <input className={inputClass} placeholder={t("email")} type="email" required />
          <textarea className={`${inputClass} min-h-[150px] leading-relaxed`} placeholder={t("message")} required />
          <button
            type="submit"
            className="rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-7 py-3.5 text-sm font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth"
          >
            {t("send")}
          </button>
        </form>
      )}
    </section>
  );
}
