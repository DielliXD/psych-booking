"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Video, MessageCircle, Mail, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

export default function ServicesPage() {
  const t = useTranslations("services");
  const [individualPrice, setIndividualPrice] = useState<string | null>(null);
  const [couplesPrice, setCouplesPrice] = useState<string | null>(null);
  const [cancellationPolicy, setCancellationPolicy] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("psychologists")
      .select("individual_price, couples_price, cancellation_policy")
      .eq("id", PSYCHOLOGIST_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setIndividualPrice(data.individual_price);
          setCouplesPrice(data.couples_price);
          setCancellationPolicy(data.cancellation_policy);
        }
      });
  }, []);

  const formats = [
    { icon: Video, title: t("formatVideo"), text: t("formatVideoText") },
    { icon: MessageCircle, title: t("formatChat"), text: t("formatChatText") },
    { icon: Mail, title: t("formatAsync"), text: t("formatAsyncText") },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-24">
      <h1 className="text-4xl mb-4 text-ink dark:text-mist tracking-tightest">{t("title")}</h1>
      <p className="text-sm text-ink/45 dark:text-mist/45 mb-14">{t("durationNote")}</p>

      <div className="grid sm:grid-cols-2 gap-6 mb-24">
        <div className="rounded-3xl bg-pine text-linen dark:bg-sage dark:text-charcoalGreen p-8 shadow-card">
          <h2 className="text-2xl font-display mb-3">{t("individualTitle")}</h2>
          <p className="text-sm leading-relaxed opacity-85 mb-5">{t("individualText")}</p>
          <p className="text-lg font-medium">{individualPrice || t("individualPrice")}</p>
        </div>
        <div className="rounded-3xl border border-pine/15 dark:border-sage/15 bg-white/40 dark:bg-white/[0.02] p-8 shadow-soft">
          <h2 className="text-2xl font-display mb-3 text-pine dark:text-sage">{t("couplesTitle")}</h2>
          <p className="text-sm leading-relaxed text-ink/60 dark:text-mist/60 mb-5">{t("couplesText")}</p>
          <p className="text-lg font-medium text-ink dark:text-mist">{couplesPrice || t("couplesPrice")}</p>
        </div>
      </div>

      <h2 className="text-2xl mb-10 text-ink dark:text-mist tracking-tightest">{t("formatsTitle")}</h2>
      <div className="grid sm:grid-cols-3 gap-6 mb-24">
        {formats.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-2xl border border-pine/10 dark:border-sage/10 p-6 hover:shadow-card hover:-translate-y-1 transition-all duration-300 ease-smooth"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-clay/10 mb-4">
              <Icon className="text-clay" size={20} strokeWidth={1.75} />
            </div>
            <h3 className="text-base mb-1.5 text-ink dark:text-mist">{title}</h3>
            <p className="text-sm leading-relaxed text-ink/55 dark:text-mist/55">{text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-pine/[0.03] dark:bg-sage/[0.03] p-9 mb-24">
        <h2 className="text-2xl mb-4 text-ink dark:text-mist tracking-tightest">{t("firstSessionTitle")}</h2>
        <p className="text-sm leading-relaxed text-ink/65 dark:text-mist/65 max-w-2xl">{t("firstSessionText")}</p>
      </div>

      <div className="mb-24">
        <h2 className="text-2xl mb-10 text-ink dark:text-mist tracking-tightest">{t("fitTitle")}</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-pine/10 dark:border-sage/10 p-7">
            <p className="text-sm font-medium text-pine dark:text-sage mb-4">{t("fitGoodForTitle")}</p>
            <ul className="space-y-3 text-sm text-ink/65 dark:text-mist/65">
              {["fitGoodFor1", "fitGoodFor2", "fitGoodFor3"].map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <Check size={15} className="text-pine dark:text-sage mt-0.5 shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-pine/10 dark:border-sage/10 p-7">
            <p className="text-sm font-medium text-clay mb-4">{t("fitNotForTitle")}</p>
            <ul className="space-y-3 text-sm text-ink/65 dark:text-mist/65">
              {["fitNotFor1", "fitNotFor2"].map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <X size={15} className="text-clay mt-0.5 shrink-0" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-medium tracking-widest uppercase text-clay mb-3">{t("cancellationTitle")}</h2>
        <p className="text-sm leading-relaxed text-ink/55 dark:text-mist/55 max-w-2xl">
          {cancellationPolicy || t("cancellationText")}
        </p>
      </div>
    </section>
  );
}
