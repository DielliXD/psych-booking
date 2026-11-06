"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Mail, Send } from "lucide-react";
import { PageIntro } from "@/components/ui/PageIntro";
import { PRACTICE } from "@/lib/practice";

type Status = "idle" | "sending" | "sent" | "error" | "tooMany";

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      if (res.ok) setStatus("sent");
      else setStatus(res.status === 429 ? "tooMany" : "error");
    } catch {
      setStatus("error");
    }
  }

  const input =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors focus:border-pine focus:ring-2 focus:ring-pine/15 dark:border-mist/15 dark:bg-mist/[0.04] dark:focus:border-apricot dark:focus:ring-apricot/20";
  const label = "mb-1.5 block text-[0.95rem] font-semibold";

  return (
    <div className="mx-auto max-w-6xl px-page pb-6 pt-12 sm:pt-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <PageIntro eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
          <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-[1.05rem]">
            <Mail size={18} className="text-pine dark:text-apricot" aria-hidden="true" />
            <span className="text-stone dark:text-haze">{t("directEmail")}</span>
            <a href={`mailto:${PRACTICE.email}`} className="inline-flex min-h-11 items-center break-all font-semibold text-pine underline-offset-4 hover:underline dark:text-apricot">
              {PRACTICE.email}
            </a>
          </p>

          <div className="mt-10 hidden rounded-3xl bg-mint/60 dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 p-6 sm:p-7 dark:text-mist lg:block">
            <h2 className="mb-2 text-xl font-semibold">{t("bookTitle")}</h2>
            <p className="mb-6 leading-relaxed text-stone dark:text-haze">{t("bookText")}</p>
            <Link href={`/${locale}/book`} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-pine px-6 font-semibold text-white dark:bg-apricot dark:text-ink">
              {t("bookButton")}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col rounded-[1.75rem] border border-line bg-white p-5 shadow-card sm:p-8 dark:border-mist/10 dark:bg-mist/[0.03]">
          {status === "sent" ? (
            <div className="my-auto animate-fadeUp py-10 text-center" role="status">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-apricot text-ink shadow-lifted">
                <Check size={28} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <h2 className="mb-2 text-2xl font-semibold">{t("sentTitle")}</h2>
              <p className="text-lg text-stone dark:text-haze">{t("sent")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
              {(status === "error" || status === "tooMany") && (
                <p role="alert" className="animate-fadeUp rounded-2xl bg-clay/10 px-4 py-3 text-clay dark:text-apricot">
                  {status === "tooMany" ? t("tooMany") : t("error")}
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="ct-name" className={label}>
                    {t("name")}
                  </label>
                  <input id="ct-name" className={input} autoComplete="name" value={form.name} onChange={update("name")} maxLength={100} required />
                </div>
                <div>
                  <label htmlFor="ct-email" className={label}>
                    {t("email")}
                  </label>
                  <input
                    id="ct-email"
                    className={input}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    maxLength={200}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col">
                <label htmlFor="ct-message" className={label}>
                  {t("message")}
                </label>
                <textarea
                  id="ct-message"
                  aria-describedby="ct-message-hint"
                  className={`${input} min-h-[170px] flex-1 resize-y leading-relaxed`}
                  value={form.message}
                  onChange={update("message")}
                  maxLength={5000}
                  required
                />
                <p id="ct-message-hint" className="mt-2 text-sm leading-relaxed text-stone dark:text-haze">
                  {t("messageHint")}
                </p>
              </div>
              {/* Honeypot: invisible to people, but spam bots fill in every field. */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={update("website")}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 self-start rounded-full bg-pine px-7 font-semibold text-white transition-colors hover:bg-pineDark disabled:opacity-60 sm:w-auto dark:bg-apricot dark:text-ink"
              >
                {status === "sending" ? t("sending") : t("send")}
                <Send size={17} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        {/* Phones/tablets: booking shortcut after the form */}
        <div className="rounded-3xl bg-mint/60 dark:bg-mist/[0.07] dark:ring-1 dark:ring-inset dark:ring-mist/10 p-6 sm:p-7 dark:text-mist lg:hidden">
          <h2 className="mb-2 text-xl font-semibold">{t("bookTitle")}</h2>
          <p className="mb-6 leading-relaxed text-stone dark:text-haze">{t("bookText")}</p>
          <Link href={`/${locale}/book`} className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-pine px-6 font-semibold text-white dark:bg-apricot dark:text-ink">
            {t("bookButton")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
