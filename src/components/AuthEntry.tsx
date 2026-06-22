import { useState } from "react";
import { completeProfile, getProgress, loginLocal } from "@/lib/progressStore";
import { useI18n } from "@/lib/useI18n";

export default function AuthEntry({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        if (!fullName.trim() || !username.trim()) {
          setError(t("auth.requiredFields"));
          setBusy(false);
          return;
        }
        const progress = await getProgress();
        await completeProfile({
          username: username.trim(),
          displayName: fullName.trim(),
          avatarConfig: progress.avatarConfig,
          preferredLocale: progress.preferredLocale,
          profilePhotoDataUrl: progress.profilePhotoDataUrl ?? null,
        });
        window.location.assign("/onboarding/environment");
        return;
      }
      const progress = await loginLocal();
      window.location.assign(progress.profileComplete ? "/dashboard" : "/onboarding/profile");
    } catch {
      setError(t("auth.localError"));
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      {mode === "register" ? (
        <>
          <input className="focus-ring w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" type="text" placeholder={t("form.fullName")} value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          <p className="-mt-2 text-xs leading-5 text-zinc-500">{t("auth.register.certificateNameNotice")}</p>
          <input className="focus-ring w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" type="text" placeholder={t("form.username")} value={username} onChange={(event) => setUsername(event.target.value)} required />
        </>
      ) : null}
      <input className="focus-ring w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" type="email" placeholder={t("form.email")} required />
      <input className="focus-ring w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" type="password" placeholder={t("form.password")} minLength={6} required />
      <button className="focus-ring primary-action inline-flex min-h-11 w-full items-center justify-center rounded-md text-sm font-semibold disabled:cursor-wait disabled:opacity-70" type="submit" disabled={busy}>
        {busy ? t("common.loadingDeck") : mode === "register" ? t("auth.register.create") : t("common.continue")}
      </button>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </form>
  );
}
