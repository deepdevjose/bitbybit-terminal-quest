import { detectBrowserLocale, getInitialLocale, isLocale, localeStorageKey, persistLocale, t, type Locale, type TranslationKey } from "./i18n";
import { setPreferredLocale } from "./progressStore";
import { supabase } from "./supabase";

const localeEvent = "bitbybit:locale-change";

export function initLocale() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(localeStorageKey);
  if (!stored) persistLocale(detectBrowserLocale());
  applyDomTranslations(getInitialLocale());
  void hydratePreferredLocaleFromProfile();
}

export function applyDomTranslations(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (key) node.textContent = t(locale, key as TranslationKey, readParams(node));
  });
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (key) node.placeholder = t(locale, key as TranslationKey);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((node) => {
    const key = node.dataset.i18nTitle;
    if (key) node.title = t(locale, key as TranslationKey);
  });
  const titleKey = document.body.dataset.i18nDocumentTitle;
  if (titleKey) document.title = t(locale, titleKey as TranslationKey);
}

export async function setActiveLocale(locale: Locale) {
  persistLocale(locale);
  await setPreferredLocale(locale);
  applyDomTranslations(locale);
  window.dispatchEvent(new CustomEvent(localeEvent, { detail: locale }));
  await syncPreferredLocale(locale);
}

export function subscribeLocale(listener: (locale: Locale) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<Locale>).detail);
  window.addEventListener(localeEvent, handler);
  return () => window.removeEventListener(localeEvent, handler);
}

export async function syncPreferredLocale(locale: Locale) {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  await supabase.from("profiles").update({ preferred_locale: locale }).eq("id", user.id);
}

async function hydratePreferredLocaleFromProfile() {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_locale")
    .eq("id", user.id)
    .maybeSingle();
  const preferredLocale = profile?.preferred_locale;
  if (isLocale(preferredLocale)) await setActiveLocale(preferredLocale);
}

function readParams(node: HTMLElement) {
  const params: Record<string, string> = {};
  Object.entries(node.dataset).forEach(([name, value]) => {
    if (name.startsWith("i18nParam") && value !== undefined) {
      const paramName = name.replace("i18nParam", "");
      params[paramName.charAt(0).toLowerCase() + paramName.slice(1)] = value;
    }
  });
  return params;
}

export { getInitialLocale, isLocale, t };
