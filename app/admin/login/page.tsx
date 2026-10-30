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
    <div className="min-h-screen flex items-center justify-center bg-linen dark:bg-charcoalGreen px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl mb-6 font-display text-ink dark:text-mist">Admin Login</h1>
        {sent ? (
          <p className="text-sm text-ink/70 dark:text-mist/70">
            Check your email for a login link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-pine/15 dark:border-sage/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-pine dark:focus:border-sage"
            />
            {error && <p className="text-sm text-clay">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-full bg-pine text-linen dark:bg-sage dark:text-charcoalGreen px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send login link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
