import { useEffect, useState, type ReactNode } from "react";
import { getNextAction, getProgress } from "@/lib/progressStore";
import type { UserProgress } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";

type GateMode = "public" | "auth" | "profile" | "environment" | "ready";

export default function AuthGate({ mode, children }: { mode: GateMode; children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    getProgress().then((progress) => {
      const redirect = getRedirect(mode, progress);
      if (redirect) {
        window.location.href = redirect;
        return;
      }
      setAllowed(true);
    });
  }, [mode]);

  if (!allowed) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="glass rounded-lg p-6">
          <p className="subtle-label">{t("common.loadingDeck")}</p>
          <a className="primary-action mt-5 inline-flex rounded-md px-5 py-3 text-sm font-semibold" href="/auth/login">
            {t("auth.login.eyebrow")}
          </a>
        </section>
      </main>
    );
  }

  return children;
}

function getRedirect(mode: GateMode, progress: UserProgress) {
  const next = getNextAction(progress);
  if (mode === "public") return null;
  if (mode === "auth" && progress.isAuthenticated) return next.href;
  if (mode === "profile" && !progress.isAuthenticated) return "/auth/login";
  if (mode === "profile" && progress.profileComplete) return next.href;
  if (mode === "environment" && !progress.isAuthenticated) return "/auth/login";
  if (mode === "environment" && !progress.profileComplete) return "/onboarding/profile";
  if (mode === "environment" && progress.profileComplete && progress.activeEnvironment) return "/dashboard";
  if (mode === "ready") {
    if (!progress.isAuthenticated) return "/auth/login";
    if (!progress.profileComplete) return "/onboarding/profile";
    if (!progress.activeEnvironment) return "/onboarding/environment";
  }
  return null;
}
