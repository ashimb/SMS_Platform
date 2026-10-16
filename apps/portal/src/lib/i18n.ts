/**
 * i18next setup: English (default) and Bengali, with namespaces loaded lazily per language.
 *
 * Each locales/<lang>/<namespace>.json is its own chunk (Vite glob import), fetched the first time
 * a component uses that namespace. "common" loads at start-up; the rest load with their routes.
 */
import i18next, { type BackendModule, type ReadCallback } from "i18next";
import { initReactI18next } from "react-i18next";

import { readPreference, writePreference } from "./preferences.ts";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const NAMESPACES = ["common", "auth", "dashboard", "students", "features"] as const;

export type Namespace = (typeof NAMESPACES)[number];

const loaders = import.meta.glob<{ default: Record<string, unknown> }>("../locales/*/*.json");

const lazyBackend: BackendModule = {
  type: "backend",
  init() {
    // No options: resources are bundled as lazy chunks.
  },
  read(language: string, namespace: string, callback: ReadCallback) {
    const load = loaders[`../locales/${language}/${namespace}.json`];
    if (!load) {
      callback(new Error(`Missing locale ${language}/${namespace}`), false);
      return;
    }
    load().then(
      (module) => {
        callback(null, module.default);
      },
      (error: unknown) => {
        callback(error instanceof Error ? error : new Error(String(error)), false);
      },
    );
  },
};

export function detectLanguage(): Language {
  const saved = readPreference("sp-lang");
  if (saved) return saved;
  const preferred = typeof navigator === "undefined" ? [] : navigator.languages;
  return preferred.some((tag) => tag.toLowerCase().startsWith("bn")) ? "bn" : "en";
}

export async function initI18n(
  language: Language = detectLanguage(),
  namespaces: readonly Namespace[] = ["common"],
) {
  if (i18next.isInitialized) return i18next;
  await i18next
    .use(lazyBackend)
    .use(initReactI18next)
    .init({
      lng: language,
      fallbackLng: "en",
      supportedLngs: LANGUAGES.map((l) => l.code),
      ns: [...namespaces],
      defaultNS: "common",
      fallbackNS: "common",
      // React escapes output; double escaping would show &amp; etc.
      interpolation: { escapeValue: false },
      react: { useSuspense: true },
    });
  document.documentElement.lang = i18next.language;
  i18next.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
  });
  return i18next;
}

export async function setLanguage(language: Language): Promise<void> {
  writePreference("sp-lang", language);
  await i18next.changeLanguage(language);
}

export { i18next };
