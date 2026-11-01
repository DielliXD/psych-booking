"use client";

import { useSyncExternalStore } from "react";

// Hand-off for a language switch in progress.
//
// Switching locale makes Next.js re-create the [locale] layout — including
// <body> and the Header — so React state and DOM attributes don't survive.
// The switcher writes a short-lived note to sessionStorage right before it
// navigates; the freshly mounted Header reads it on its very first render
// to (a) keep the drawer open if the switch came from the drawer and
// (b) hide the page text before the first paint, then fade it in.
const KEY = "shprehu:lang-switch";
const MAX_AGE_MS = 8000; // ignore stale notes (e.g. a tab closed mid-switch)

export type SwitchSource = "menu" | "page";

export function markLanguageSwitch(source: SwitchSource) {
  try {
    sessionStorage.setItem(KEY, `${source}:${Date.now()}`);
  } catch {}
}

export function readLanguageSwitch(): SwitchSource | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const [source, at] = raw.split(":");
    if (Date.now() - Number(at) > MAX_AGE_MS) return null;
    return source === "menu" || source === "page" ? source : null;
  } catch {
    return null;
  }
}

export function clearLanguageSwitch() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

const noSubscribe = () => () => {};

/**
 * The pending switch, available on the FIRST client render after a
 * client-side navigation. During server rendering / hydration it is null,
 * so there is never a hydration mismatch.
 */
export function usePendingLanguageSwitch(): SwitchSource | null {
  return useSyncExternalStore(noSubscribe, readLanguageSwitch, () => null);
}

/** true in the browser after hydration; true immediately on client-side remounts. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
