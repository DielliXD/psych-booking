"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { useAdminSession } from "@/lib/useAdminSession";
import { supabase } from "@/lib/supabase";
import { ThemeProvider } from "@/components/ThemeProvider";
import "../globals.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], variable: "--font-bricolage", display: "swap" });

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
    <html lang="en" className={`${figtree.variable} ${bricolage.variable}`} suppressHydrationWarning>
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
              <header className="border-b border-line dark:border-mist/10 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <nav className="flex flex-wrap gap-x-1 text-sm">
                  <Link href="/admin/calendar" className="inline-flex min-h-[44px] items-center px-3 rounded-full text-ink/80 dark:text-mist/80 hover:text-pine dark:hover:text-sage">
                    Calendar
                  </Link>
                  <Link href="/admin/bookings" className="inline-flex min-h-[44px] items-center px-3 rounded-full text-ink/80 dark:text-mist/80 hover:text-pine dark:hover:text-sage">
                    Bookings
                  </Link>
                  <Link href="/admin/settings" className="inline-flex min-h-[44px] items-center px-3 rounded-full text-ink/80 dark:text-mist/80 hover:text-pine dark:hover:text-sage">
                    Settings
                  </Link>
                </nav>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="inline-flex min-h-[44px] items-center px-3 text-sm text-stone dark:text-haze hover:text-clay"
                >
                  Sign out
                </button>
              </header>
              <main className="max-w-4xl mx-auto px-page py-8 sm:py-10">{children}</main>
            </div>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
