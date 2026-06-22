import { useEffect, useState } from "react";
import { getProgress, logoutLocal, updateProfile } from "@/lib/progressStore";
import type { UserProgress } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";
import { AvatarPreview, Card } from "./ui";

export default function ProfilePanel() {
  const { t } = useI18n();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProgress().then((value) => {
      setProgress(value);
      setDisplayName(value.displayName);
      setUsername(value.username);
      setPhoto(value.profilePhotoDataUrl ?? null);
    });
  }, []);

  function handlePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setMessage(t("profile.photoError"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save() {
    const next = await updateProfile({ username, displayName, profilePhotoDataUrl: photo });
    setProgress(next);
    setMessage(t("profile.saved"));
  }

  async function logout() {
    await logoutLocal();
    window.location.href = "/";
  }

  if (!progress) return <main className="mx-auto max-w-6xl px-6 py-12 text-zinc-400">{t("common.loadingDeck")}</main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Card>
        <div className="grid gap-8 md:grid-cols-[1fr_220px]">
          <div>
            <p className="subtle-label">{t("profile.eyebrow")}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{t("profile.heading")}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-zinc-400">{t("profile.photoNotice")}</p>
            <label className="mt-6 block text-sm text-zinc-400">{t("onboarding.profile.username")}</label>
            <input className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" value={username} onChange={(event) => setUsername(event.target.value)} />
            <label className="mt-4 block text-sm text-zinc-400">{t("form.fullName")}</label>
            <input className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-white" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            <p className="mt-2 text-sm leading-6 text-zinc-500">{t("auth.register.certificateNameNotice")}</p>
            <label className="mt-4 block text-sm text-zinc-400">{t("profile.photo")}</label>
            <input className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" type="file" accept="image/*" onChange={(event) => handlePhoto(event.target.files?.[0])} />
            {photo ? <button className="focus-ring secondary-action mt-3 rounded-md px-4 py-2 text-sm font-semibold" onClick={() => setPhoto(null)}>{t("profile.removePhoto")}</button> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="focus-ring primary-action min-h-11 rounded-md px-5 text-sm font-semibold" onClick={save}>{t("profile.save")}</button>
              <a className="focus-ring secondary-action inline-flex min-h-11 items-center rounded-md px-5 text-sm font-semibold" href="/dashboard">{t("nav.dashboard")}</a>
              <button className="focus-ring inline-flex min-h-11 items-center rounded-md border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10" onClick={logout}>{t("settings.logout")}</button>
            </div>
            {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
          </div>
          <div>
            <AvatarPreview config={progress.avatarConfig} photoDataUrl={photo} />
            <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-zinc-400">{t("profile.localOnly")}</p>
          </div>
        </div>
      </Card>
    </main>
  );
}
