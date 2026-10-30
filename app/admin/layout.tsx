"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Karla } from "next/font/google";
import { useAdminSession } from "@/lib/useAdminSession";
import { supabase } from "@/lib/supabase";
import { ThemeProvider } from "@/components/ThemeProvider";
import "../globals.css";

const karla = Karla({ subsets: ["latin"], variable: "--font-karla", display: "swap" });

// This is a separate root layout from app/[locale]/layout.tsx — Next.js's
// "multiple root layouts" pattern, since /admin isn't nested under [locale]
// and there's no shared app/layout.tsx above both trees. It owns its own
// <html>/<body> and also gates every admin page behind authentication.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [loading, isAuthenticated, isLoginPage, router]);

  return (
    <html lang="en" className={karla.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {isLoginPage ? (
            children
          ) : loading ? (
            <div className="min-h-screen flex items-center justify-center bg-linen dark:bg-charcoalGreen">
              <p className="text-sm text-ink/50 dark:text-mist/50">...</p>
            </div>
          ) : !isAuthenticated ? null : (
            <div className="min-h-screen bg-linen dark:bg-charcoalGreen">
              <header className="border-b border-pine/10 dark:border-sage/10 px-6 py-4 flex items-center justify-between">
                <nav className="flex gap-6 text-sm">
                  <Link href="/admin/calendar" className="text-ink/70 dark:text-mist/70 hover:text-pine dark:hover:text-sage">
                    Calendar
                  </Link>
                  <Link href="/admin/bookings" className="text-ink/70 dark:text-mist/70 hover:text-pine dark:hover:text-sage">
                    Bookings
                  </Link>
                  <Link href="/admin/settings" className="text-ink/70 dark:text-mist/70 hover:text-pine dark:hover:text-sage">
                    Settings
                  </Link>
                </nav>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-sm text-ink/50 dark:text-mist/50 hover:text-clay"
                >
                  Sign out
                </button>
              </header>
              <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
            </div>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
