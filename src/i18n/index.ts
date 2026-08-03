import { getSetting, setSetting } from "../lib/api";
import en from "./en.json";
import es from "./es.json";

export type Locale = "es" | "en";

const catalogs: Record<Locale, Record<string, string>> = { es, en };
let locale: Locale = "es";

export function getLocale(): Locale {
  return locale;
}

/** Sync module locale for t(). App state is the source of truth; call after locale changes. */
export function applyLocale(nextLocale: Locale): void {
  locale = nextLocale;
}

export function t(key: string): string {
  return catalogs[locale][key] ?? key;
}

export async function loadLocale(): Promise<Locale> {
  return (await getSetting("locale")) === "en" ? "en" : "es";
}

export async function persistLocale(nextLocale: Locale): Promise<void> {
  await setSetting("locale", nextLocale);
}

/** Persist and apply in one step (tests / non-React callers). Prefer App state + applyLocale in UI. */
export async function setLocale(nextLocale: Locale): Promise<void> {
  await persistLocale(nextLocale);
  applyLocale(nextLocale);
}
