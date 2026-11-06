// SERVER-SIDE ONLY. Session prices from the admin settings, formatted for
// display ("35 €"). null = not set yet → the UI simply hides prices.
import { supabaseAdmin } from "./supabaseAdmin";

const PSYCHOLOGIST_ID = process.env.NEXT_PUBLIC_PSYCHOLOGIST_ID ?? "";

export interface Prices {
  individual: string | null;
  couples: string | null;
}

export async function getPrices(): Promise<Prices> {
  try {
    const { data } = await supabaseAdmin
      .from("psychologists")
      .select("individual_price, couples_price")
      .eq("id", PSYCHOLOGIST_ID)
      .maybeSingle();
    return { individual: formatPrice(data?.individual_price), couples: formatPrice(data?.couples_price) };
  } catch {
    return { individual: null, couples: null };
  }
}

/**
 * The admin stores just the amount ("35", "37.5"); show it as "35 €".
 * Older free-text values that already say something like "€35" are kept as they are.
 */
export function formatPrice(value: unknown): string | null {
  const text = value === null || value === undefined ? "" : String(value).trim();
  if (!text) return null;
  if (/^\d+(?:[.,]\d+)?$/.test(text)) return `${text.replace(".", ",")} €`;
  return text;
}

/** Filloreta's own cancellation policy text from the admin, or null if not written yet. */
export async function getCancellationPolicy(): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from("psychologists")
      .select("cancellation_policy")
      .eq("id", PSYCHOLOGIST_ID)
      .maybeSingle();
    const text = data?.cancellation_policy;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
