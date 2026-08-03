import { getSetting, setSetting } from "../lib/api";
import en from "./en.json";
import es from "./es.json";

export type Locale = "es" | "en";

const catalogs: Record<Locale, Record<string, string>> = { es, en };
let locale: Locale = "es";

export function t(key: string): string {
  return catalogs[locale][key] ?? key;
}

export async function loadLocale(): Promise<Locale> {
  locale = (await getSetting("locale")) === "en" ? "en" : "es";
  return locale;
}

export async function setLocale(nextLocale: Locale): Promise<void> {
  await setSetting("locale", nextLocale);
  locale = nextLocale;
}
