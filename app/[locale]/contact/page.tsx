"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { Check } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error" | "tooMany";

export default function ContactPage() {
  const t = useTranslations("contactPage");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const inputClass =
    "w-full rounded-xl border-2 border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-pine dark:focus:border-sage focus:shadow-glow";

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

  return (
    <section className="max-w-xl mx-auto px-6 lg:px-8 py-24">
      <h1 className="text-4xl mb-12 text-ink dark:text-mist tracking-tightest">{t("title")}</h1>
      {status === "sent" ? (
        <div className="rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] shadow-soft p-8 flex items-center gap-4 animate-fadeUp">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine dark:bg-sage text-linen dark:text-charcoalGreen">
            <Check size={18} />
          </span>
          <p className="text-ink/70 dark:text-mist/70">{t("sent")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {(status === "error" || status === "tooMany") && (
            <p className="text-sm text-clay bg-clay/10 rounded-xl px-4 py-3 animate-fadeUp">
              {status === "tooMany" ? t("tooMany") : t("error")}
            </p>
          )}
          <input
            className={inputClass}
            placeholder={t("name")}
            value={form.name}
            onChange={update("name")}
            maxLength={100}
            required
          />
          <input
            className={inputClass}
            placeholder={t("email")}
            type="email"
            value={form.email}
            onChange={update("email")}
            maxLength={200}
            required
          />
          <textarea
            className={`${inputClass} min-h-[150px] leading-relaxed`}
            placeholder={t("message")}
            value={form.message}
            onChange={update("message")}
            maxLength={5000}
            required
          />
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
            className="rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-7 py-3.5 text-sm font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth disabled:opacity-50 disabled:translate-y-0"
          >
            {status === "sending" ? t("sending") : t("send")}
          </button>
        </form>
      )}
    </section>
  );
}
