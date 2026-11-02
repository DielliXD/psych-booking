// SERVER-SIDE ONLY. Session prices as Filloreta entered them in the admin
// (free text, e.g. "€40"). null = not set yet → the UI simply hides prices.
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
    const clean = (v: unknown) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v));
    return { individual: clean(data?.individual_price), couples: clean(data?.couples_price) };
  } catch {
    return { individual: null, couples: null };
  }
}
