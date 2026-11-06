"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// The admin panel's login state. A Supabase session alone is not enough:
// the user must also be in admin_users (checked by the is_admin() database
// function, migration 009). Anyone else is signed out straight away.
// The data itself is protected by RLS either way; this keeps the UI honest.
export function useAdminSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check(next: Session | null) {
      if (!next) {
        if (!cancelled) {
          setSession(null);
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase.rpc("is_admin");
      if (cancelled) return;
      if (error || data !== true) {
        await supabase.auth.signOut();
        setSession(null);
        setIsAdmin(false);
      } else {
        setSession(next);
        setIsAdmin(true);
      }
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      // Deferred: calling Supabase inside this callback can deadlock supabase-js.
      setTimeout(() => check(next), 0);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, isAuthenticated: !!session && isAdmin };
}
