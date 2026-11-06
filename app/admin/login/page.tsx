"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    // NOTE: this sends a magic link to any email typed in. That's fine as
    // long as public signup is disabled in Supabase Auth settings and only
    // the psychologist's account exists — otherwise anyone could try to
    // request a link. Restrict signups in Supabase dashboard > Auth > Settings.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/calendar` },
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linen px-page py-10 dark:bg-night">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-line bg-white p-6 shadow-card sm:p-8 dark:border-mist/10 dark:bg-mist/[0.04]">
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-clay dark:text-apricot">Shprehu</p>
        <h1 className="mb-2 font-display text-2xl font-semibold tracking-tight text-ink dark:text-mist">Admin login</h1>
        {sent ? (
          <p role="status" className="leading-relaxed text-stone dark:text-haze">
            Check your email for a login link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-[0.95rem] font-semibold text-ink dark:text-mist">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors focus:border-pine focus:ring-2 focus:ring-pine/15 dark:border-mist/15 dark:bg-mist/[0.04] dark:text-mist dark:focus:border-apricot"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-clay/10 px-4 py-3 text-clay dark:text-apricot">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-pine px-6 font-semibold text-white transition-colors hover:bg-pineDark disabled:opacity-60 dark:bg-apricot dark:text-ink"
            >
              {sending ? "Sending…" : "Send login link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
