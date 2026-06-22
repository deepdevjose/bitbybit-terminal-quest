import { useEffect, useMemo, useState } from "react";
import { getInitialLocale, setActiveLocale, subscribeLocale } from "./i18nClient";
import { defaultLocale, localeLabels, locales, t, type Locale, type TranslationKey } from "./i18n";

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    return subscribeLocale(setLocaleState);
  }, []);

  return useMemo(
    () => ({
      locale,
      locales,
      localeLabels,
      t: (key: TranslationKey, params?: Record<string, string | number>) => t(locale, key, params),
      setLocale: async (nextLocale: Locale) => {
        setLocaleState(nextLocale);
        await setActiveLocale(nextLocale);
      },
    }),
    [locale],
  );
}
