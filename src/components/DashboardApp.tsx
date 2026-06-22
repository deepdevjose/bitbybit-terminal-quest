import { useEffect, useState } from "react";
import { environments } from "@/lib/curriculum";
import type { TranslationKey } from "@/lib/i18n";
import { flushSyncQueue, getNextAction, getNextMission, getProgress, getQueuedSyncCount, isEnvironmentPathComplete, isLevelComplete, setActiveEnvironment } from "@/lib/progressStore";
import type { UserProgress } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";
import { AvatarPreview, BadgeGrid, Card, EnvironmentCard, RankBadge, XPBar } from "./ui";

export default function DashboardApp() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [queued, setQueued] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    getProgress().then(setProgress);
    getQueuedSyncCount().then(setQueued);
    flushSyncQueue().then(() => getQueuedSyncCount().then(setQueued));
  }, []);

  if (!progress) return <div className="mx-auto max-w-6xl px-6 py-12 text-zinc-400">{t("common.loadingDeck")}</div>;

  const active = environments.find((environment) => environment.id === progress.activeEnvironment) ?? environments[0];
  const completed = progress.completedMissions[active.id]?.length ?? 0;
  const totalPlayable = active.levels.flatMap((level) => level.missions).length || 1;
  const currentLevel = progress.environmentLevels[active.id] ?? 1;
  const currentLevelData = active.levels.find((level) => level.id === currentLevel) ?? active.levels[0];
  const currentLevelCompleted = currentLevelData?.missions.filter((mission) => progress.completedMissions[active.id]?.includes(mission.id)).length ?? 0;
  const currentLevelTotal = currentLevelData?.missions.length || 1;
  const completedLevels = active.levels.filter((level) => isLevelComplete(active.id, level.id, progress)).length;
  const levelProgress = Math.round((currentLevelCompleted / currentLevelTotal) * 100);
  const pathProgress = Math.round((completedLevels / active.levels.length) * 100);
  const currentMission = getNextMission(active.id, progress);
  const nextAction = getNextAction(progress);
  const pathComplete = isEnvironmentPathComplete(active.id, progress);
  const actionHref = pathComplete ? nextAction.href : currentMission ? nextAction.href : `/quest/${active.slug}/level/${currentLevel}`;
  const activeName = t(envKey(active.id, "name"));
  const nextLevelTitle = t(`level.${active.id}.${currentLevel}.title` as TranslationKey);

  async function switchEnvironment(environmentId: typeof active.id) {
    if (environmentId === active.id) return;
    if (!window.confirm(t("dashboard.switchEnvironmentConfirm"))) return;
    const next = await setActiveEnvironment(environmentId);
    setProgress(next);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <RankBadge rank={progress.rank} />
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{t("dashboard.welcome", { name: progress.displayName })}</h1>
              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">{t("dashboard.activePath", { environment: activeName })}</p>
              <a className="focus-ring primary-action mt-6 inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition" href={actionHref}>
                {pathComplete ? t("dashboard.viewCertificate") : currentMission ? t("dashboard.resumeMission") : t("dashboard.continueRoute")}
              </a>
            </div>
            <a className="focus-ring block rounded-lg" href="/profile" aria-label={t("dashboard.editAvatar")}>
              <AvatarPreview config={progress.avatarConfig} photoDataUrl={progress.profilePhotoDataUrl} />
              <div className="mt-3 text-center">
                <div className="text-sm font-semibold text-white">{t("dashboard.operatorPath", { environment: activeName })}</div>
                <div className="mt-1 text-xs text-zinc-500">{t("dashboard.rankLabel", { rank: t(rankKey(progress.rank)) })}</div>
                <div className="mt-2 text-xs font-semibold text-zinc-300">{t("dashboard.editAvatar")}</div>
              </div>
            </a>
          </div>
          <div className="mt-8">
            <XPBar xp={progress.globalXp} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("dashboard.level")}</dt>
              <dd className="mt-2 text-2xl font-semibold text-white">{currentLevel}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("dashboard.levelProgress")}</dt>
              <dd className="mt-2 text-2xl font-semibold text-white">{levelProgress}%</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("dashboard.pathProgress")}</dt>
              <dd className="mt-2 text-2xl font-semibold text-white">{pathProgress}%</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:col-span-3">
              <dt className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("dashboard.commandsUnlocked")}</dt>
              <dd className="mt-2 text-2xl font-semibold text-white">{progress.unlockedCommands[active.id]?.length ?? 0}</dd>
            </div>
          </div>
        </Card>
        <Card>
          <p className="subtle-label">{t("dashboard.nextAction")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {pathComplete ? t("dashboard.certificateReady") : currentMission ? t(`mission.${currentMission.id}.title` as TranslationKey) : t("dashboard.levelAvailable", { level: currentLevel })}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {pathComplete ? t("certificate.pathComplete") : currentMission ? t(`mission.${currentMission.id}.description` as TranslationKey) : t("dashboard.levelAvailableCopy", { level: currentLevel, title: nextLevelTitle })}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("dashboard.missions")}</dt>
              <dd className="mt-2 text-2xl font-semibold text-white">{completed}/{totalPlayable}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <dt className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("dashboard.syncQueue")}</dt>
              <dd className="mt-2 text-2xl font-semibold text-white">{queued}</dd>
            </div>
          </dl>
          <a className="focus-ring primary-action mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md px-5 text-sm font-semibold transition" href={actionHref}>
            {pathComplete ? t("dashboard.viewCertificate") : currentMission ? t("dashboard.resumeMission") : t("dashboard.continueRoute")}
          </a>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold text-white">{t("dashboard.questMap")}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          {active.levels.map((level) => {
            const complete = isLevelComplete(active.id, level.id, progress);
            const current = level.id === currentLevel;
            const locked = level.id > currentLevel;
            return (
              <a
                key={level.id}
                className={`rounded-lg border p-4 transition ${complete ? "border-emerald-400/40 bg-emerald-400/10" : current ? "border-white/30 bg-white/12" : locked ? "border-white/10 bg-white/[0.02] opacity-50" : "border-white/10 bg-white/[0.04]"}`}
                href={locked ? "#" : `/quest/${active.slug}/level/${level.id}`}
              >
                <div className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("common.level")} {level.id}</div>
                <div className="mt-2 min-h-12 font-semibold text-white">{t(`level.${active.id}.${level.id}.title` as TranslationKey)}</div>
                <div className="mt-3 text-xs text-zinc-400">{complete ? t("common.complete") : current ? t("status.current") : locked ? t("common.locked") : t("common.open")}</div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold text-white">{t("dashboard.environmentPaths")}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {environments.map((environment) => {
            const locked = !environment.initiallyUnlocked && !canUnlock(environment.id, progress);
            return (
              <EnvironmentCard
                key={environment.id}
                nameKey={envKey(environment.id, "name")}
                descriptionKey={envKey(environment.id, "description")}
                difficultyKey={envKey(environment.id, "difficulty")}
                accent={environment.accent}
                href={`/quest/${environment.slug}`}
                locked={locked}
                unlockTextKey={envKey(environment.id, "unlock")}
                onSelect={() => locked ? window.alert(t("dashboard.lockedPathDetail", { requirement: t(envKey(environment.id, "unlock")) })) : switchEnvironment(environment.id)}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-semibold text-white">{t("dashboard.badges")}</h2>
        <BadgeGrid badges={progress.unlockedBadges} />
      </section>
    </main>
  );
}

function rankKey(rank: string): TranslationKey {
  return `rank.${rank.toLowerCase().replaceAll(" ", "-")}` as TranslationKey;
}

function envKey(environmentId: string, field: "name" | "description" | "difficulty" | "unlock") {
  return `environment.${environmentId}.${field}` as TranslationKey;
}

function canUnlock(environmentId: string, progress: UserProgress) {
  if (environmentId === "fedora") {
    return ["debian", "powershell", "macos"].some((id) => (progress.environmentLevels[id] ?? 1) >= 6);
  }
  if (environmentId === "arch") {
    return (progress.environmentLevels.debian ?? 1) >= 12 || (progress.environmentLevels.fedora ?? 1) >= 10;
  }
  return true;
}
