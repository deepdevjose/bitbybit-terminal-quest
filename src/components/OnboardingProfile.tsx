import { useState } from "react";
import { completeProfile, getProgress } from "@/lib/progressStore";
import { useI18n } from "@/lib/useI18n";
import { AvatarPreview } from "./ui";

export default function OnboardingProfile() {
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState(() => t("onboarding.profile.defaultDisplayName"));
  const [username, setUsername] = useState("operator");
  const [skin, setSkin] = useState<"green" | "blue" | "violet" | "amber">("green");
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handlePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setError(t("profile.photoError"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfilePhotoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const progress = await getProgress();
      await completeProfile({
        username,
        displayName,
        profilePhotoDataUrl,
        avatarConfig: { ...progress.avatarConfig, skin },
        preferredLocale: progress.preferredLocale,
      });
      window.location.assign("/onboarding/environment");
    } catch {
      setError("No pudimos guardar tu perfil. Intenta otra vez.");
      setBusy(false);
    }
  }

  const config = { skin, outfit: "terminal-hoodie", glasses: "none", background: "debian" };

  return (
    <div className="glass w-full max-w-3xl rounded-lg p-6">
      <div className="grid gap-8 md:grid-cols-[1fr_180px]">
        <div>
          <p className="subtle-label">{t("onboarding.profile.eyebrow")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{t("onboarding.profile.heading")}</h1>
          <label className="mt-6 block text-sm text-zinc-400">{t("onboarding.profile.username")}</label>
          <input className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" value={username} onChange={(event) => setUsername(event.target.value)} />
          <label className="mt-4 block text-sm text-zinc-400">{t("form.fullName")}</label>
          <input className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <p className="mt-2 text-sm leading-6 text-zinc-500">{t("auth.register.certificateNameNotice")}</p>
          <label className="mt-4 block text-sm text-zinc-400">{t("profile.photo")}</label>
          <input className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" type="file" accept="image/*" onChange={(event) => handlePhoto(event.target.files?.[0])} />
          <p className="mt-2 text-sm leading-6 text-zinc-500">{t("profile.photoNotice")}</p>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {(["green", "blue", "violet", "amber"] as const).map((option) => (
              <button key={option} className={`focus-ring rounded-md border px-3 py-2 text-sm capitalize ${skin === option ? "border-white/20 bg-white/12 text-white" : "border-white/10 bg-white/5 text-zinc-400"}`} onClick={() => setSkin(option)}>
                {t(`skin.${option}`)}
              </button>
            ))}
          </div>
          <button className="focus-ring primary-action mt-6 min-h-11 rounded-md px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70" onClick={submit} disabled={busy}>{busy ? t("common.loadingDeck") : t("common.continue")}</button>
          {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
        </div>
        <AvatarPreview config={config} photoDataUrl={profilePhotoDataUrl} />
      </div>
    </div>
  );
}
