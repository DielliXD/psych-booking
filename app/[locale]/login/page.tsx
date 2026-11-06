"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail, MailCheck } from "lucide-react";

// Passwordless sign-in for patients: they get a one-time link by email.
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
    // Always shows the same message, whether or not the email exists,
    // so nobody can use this form to find out who is a patient.
    await fetch("/api/auth/patient/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), locale }),
    }).catch(() => undefined);
    setSending(false);
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-page py-14 sm:py-24">
      <div className="rounded-[1.75rem] border border-line bg-white p-6 shadow-card sm:p-9 dark:border-mist/10 dark:bg-mist/[0.03]">
        {sent ? (
          <div className="animate-fadeUp text-center" role="status">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-apricot text-ink shadow-lifted">
              <MailCheck size={28} aria-hidden="true" />
            </div>
            <h1 className="mb-3 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{t("sentTitle")}</h1>
            <p className="leading-relaxed text-stone dark:text-haze">{t("sent")}</p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 inline-flex min-h-[44px] items-center rounded-full px-4 font-semibold text-pine hover:bg-mint dark:text-apricot dark:hover:bg-mist/10"
            >
              {t("tryAgain")}
            </button>
          </div>
        ) : (
          <>
            <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-mint text-pine dark:bg-mist/10 dark:text-apricot">
              <Mail size={22} aria-hidden="true" />
            </span>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{t("title")}</h1>
            <p className="mb-7 leading-relaxed text-stone dark:text-haze">{t("intro")}</p>

            {errorParam && (
              <p role="alert" className="mb-6 rounded-2xl bg-clay/10 px-4 py-3 text-clay dark:text-apricot">
                {t("expired")}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-[0.95rem] font-semibold">
                  {t("emailLabel")}
                </label>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-stone/60 focus:border-pine focus:ring-2 focus:ring-pine/15 dark:border-mist/15 dark:bg-mist/[0.04] dark:focus:border-apricot dark:focus:ring-apricot/20"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-pine px-7 font-semibold text-white transition-colors hover:bg-pineDark disabled:opacity-60 dark:bg-apricot dark:text-ink"
              >
                {sending ? t("sending") : t("send")}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-6 text-center text-[0.95rem] text-stone dark:text-haze">
        {t("noBooking")}{" "}
        <Link href={`/${locale}/book`} className="font-semibold text-pine underline-offset-4 hover:underline dark:text-apricot">
          {t("bookLink")}
        </Link>
      </p>
    </div>
  );
}
