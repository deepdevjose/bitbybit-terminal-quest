import { environments } from "@/lib/curriculum";
import type { TranslationKey } from "@/lib/i18n";
import { setActiveEnvironment } from "@/lib/progressStore";
import type { EnvironmentId } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";
import { useState } from "react";

export default function EnvironmentChooser() {
  const { t } = useI18n();
  const [busyId, setBusyId] = useState<EnvironmentId | null>(null);
  const [error, setError] = useState("");

  async function choose(id: EnvironmentId) {
    setBusyId(id);
    setError("");
    try {
      await setActiveEnvironment(id);
      window.location.assign(`/quest/${id}`);
    } catch {
      setError("No pudimos guardar tu entorno. Intenta otra vez.");
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16">
      <div className="grid gap-4 md:grid-cols-3">
        {environments.filter((environment) => environment.initiallyUnlocked).map((environment) => (
          <button key={environment.id} className="glass focus-ring rounded-lg p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.065]" onClick={() => choose(environment.id)}>
            <div className="mb-5 h-1 rounded-full bg-white/15">
              <div className="h-full w-1/3 rounded-full" style={{ background: environment.accent }} />
            </div>
            <h2 className="text-xl font-semibold text-white">{t(`environment.${environment.id}.name` as TranslationKey)}</h2>
            <p className="mt-3 min-h-24 text-sm leading-6 text-zinc-400">{t(`environment.${environment.id}.description` as TranslationKey)}</p>
            <span className="mt-5 inline-flex text-sm font-semibold text-zinc-100">{busyId === environment.id ? t("common.loadingDeck") : t("onboarding.environment.start")}</span>
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
