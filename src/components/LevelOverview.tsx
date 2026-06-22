import { useEffect, useState } from "react";
import type { TranslationKey } from "@/lib/i18n";
import { getProgress, isMissionUnlocked } from "@/lib/progressStore";
import type { EnvironmentPath, Level, UserProgress } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";
import { MissionCard } from "./ui";

export default function LevelOverview({ environment, level }: { environment: EnvironmentPath; level: Level }) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    getProgress().then(setProgress);
  }, []);

  if (!progress) return <section className="glass rounded-lg p-6 text-zinc-400">{t("common.loadingDeck")}</section>;

  const completed = new Set(progress.completedMissions[environment.id] ?? []);
  const normalComplete = level.missions.filter((mission) => mission.difficulty !== "boss").every((mission) => completed.has(mission.id));

  if (!level.missions.length) {
    return (
      <section className="glass rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-white">{t("quest.missionPackPlanned")}</h2>
        <p className="mt-3 text-zinc-400">{t("quest.missionPackCopy")}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {level.missions.map((mission) => {
        const complete = completed.has(mission.id);
        const bossLocked = mission.difficulty === "boss" && !normalComplete && !complete;
        const unlocked = !bossLocked && isMissionUnlocked(mission.id, environment.id, progress);
        return (
          <MissionCard
            key={mission.id}
            title={mission.title}
            titleKey={`mission.${mission.id}.title` as TranslationKey}
            description={mission.description}
            descriptionKey={`mission.${mission.id}.description` as TranslationKey}
            href={unlocked || complete ? `/mission/${mission.id}` : "#"}
            complete={complete}
            locked={!unlocked && !complete}
          />
        );
      })}
    </section>
  );
}
