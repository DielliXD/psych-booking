"use client";

import { useState, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const locale = useLocale();
  const t = useTranslations("login");
  const params = useSearchParams();
  const errorParam = params.get("error");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await fetch("/api/auth/patient/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    setSending(false);
    setSent(true);
  }

  return (
    <div className="max-w-md mx-auto px-page py-16 sm:py-28">
      <h1 className="text-3xl mb-3 text-ink dark:text-mist tracking-tightest">{t("title")}</h1>
      <p className="text-sm text-ink/55 dark:text-mist/55 mb-10">
        {t("intro")}
      </p>

      {errorParam && !sent && (
        <p className="mb-6 text-sm text-clay bg-clay/10 rounded-xl px-4 py-3">
          {t("expired")}
        </p>
      )}

      {sent ? (
        <div className="rounded-3xl border border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] shadow-soft p-7 flex items-center gap-4 animate-fadeUp">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine dark:bg-sage text-linen dark:text-charcoalGreen">
            <Mail size={18} />
          </span>
          <p className="text-sm text-ink/70 dark:text-mist/70">
            {t("sent")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="w-full rounded-xl border-2 border-pine/10 dark:border-sage/10 bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-pine dark:focus:border-sage focus:shadow-glow"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-7 py-3.5 text-sm font-medium shadow-soft hover:shadow-lifted hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-smooth disabled:opacity-50"
          >
            {sending ? t("sending") : t("send")}
          </button>
        </form>
      )}
    </div>
  );
}
