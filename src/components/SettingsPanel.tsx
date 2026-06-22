import { useState } from "react";
import { exportProgress, flushSyncQueue, getProgress, importProgress, logoutLocal, resetEnvironmentProgress, resetProgress } from "@/lib/progressStore";
import { useI18n } from "@/lib/useI18n";

export default function SettingsPanel() {
  const [payload, setPayload] = useState("");
  const [message, setMessage] = useState("");
  const { t } = useI18n();

  async function exportJson() {
    setPayload(await exportProgress());
    setMessage(t("settings.exported"));
  }

  async function importJson() {
    await importProgress(payload);
    setMessage(t("settings.imported"));
  }

  async function reset() {
    await resetProgress();
    window.location.href = "/dashboard";
  }

  async function resetEnvironment() {
    const progress = await getProgress();
    if (progress.activeEnvironment) await resetEnvironmentProgress(progress.activeEnvironment);
    window.location.href = "/dashboard";
  }

  async function syncNow() {
    await flushSyncQueue();
    setMessage(t("settings.synced"));
  }

  async function logout() {
    await logoutLocal();
    window.location.href = "/";
  }

  return (
    <section className="glass rounded-lg p-6">
      <h1 className="text-3xl font-semibold text-white">{t("settings.heading")}</h1>
      <p className="mt-3 text-zinc-400">{t("settings.copy")}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="focus-ring primary-action rounded-md px-5 py-3 text-sm font-semibold" onClick={exportJson}>{t("settings.export")}</button>
        <button className="focus-ring secondary-action rounded-md px-5 py-3 text-sm font-semibold" onClick={importJson}>{t("settings.import")}</button>
        <button className="focus-ring secondary-action rounded-md px-5 py-3 text-sm font-semibold" onClick={syncNow}>{t("settings.syncNow")}</button>
        <button className="focus-ring secondary-action rounded-md px-5 py-3 text-sm font-semibold" onClick={resetEnvironment}>{t("settings.resetEnvironment")}</button>
        <button className="focus-ring rounded-md border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200" onClick={reset}>{t("settings.reset")}</button>
        <button className="focus-ring rounded-md border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white" onClick={logout}>{t("settings.logout")}</button>
      </div>
      <textarea className="focus-ring mt-6 min-h-72 w-full rounded-md border border-white/10 bg-zinc-950 p-4 font-mono text-sm text-zinc-200" value={payload} onChange={(event) => setPayload(event.target.value)} />
      {message ? <p className="mt-3 text-sm text-zinc-200">{message}</p> : null}
    </section>
  );
}
