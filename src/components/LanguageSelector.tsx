import { useI18n } from "@/lib/useI18n";

type LanguageSelectorProps = {
  variant?: "dark" | "light";
};

export default function LanguageSelector({ variant = "dark" }: LanguageSelectorProps) {
  const { locale, locales, localeLabels, setLocale, t } = useI18n();
  const selectClass =
    variant === "light"
      ? "focus-ring rounded-md border border-zinc-950/15 bg-white px-2 py-2 text-sm font-medium text-zinc-950 shadow-sm hover:bg-zinc-50"
      : "focus-ring rounded-md border border-white/15 bg-white/10 px-2 py-2 text-sm font-medium text-zinc-100 hover:bg-white/15";
  const optionClass = variant === "light" ? "bg-white text-zinc-950" : "bg-zinc-950 text-zinc-100";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        className={selectClass}
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
      >
        {locales.map((option) => (
          <option key={option} value={option} className={optionClass}>
            {localeLabels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
