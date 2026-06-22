import { useEffect, useMemo, useState } from "react";
import type { TranslationKey } from "@/lib/i18n";
import { completeMission, getNextAction, getProgress, isMissionUnlocked } from "@/lib/progressStore";
import { TerminalEngine, type TerminalState } from "@/lib/terminalEngine";
import type { Mission } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";

export default function TerminalMission({ mission }: { mission: Mission }) {
  const { t } = useI18n();
  const missionKey = (field: "title" | "description" | "briefing" | "objective") => `mission.${mission.id}.${field}` as TranslationKey;
  const hintKey = `mission.${mission.id}.hint.1` as TranslationKey;
  const missionText = (field: "title" | "description" | "briefing" | "objective") => {
    const key = missionKey(field);
    const translated = t(key);
    return translated === key ? mission[field] : translated;
  };
  const hintText = () => {
    const translated = t(hintKey);
    return translated === hintKey ? mission.hints[0] : translated;
  };
  const initialState = useMemo(() => {
    const created = TerminalEngine.createState(mission);
    return { ...created, output: [{ type: "system" as const, text: missionText("briefing") }] };
  }, [mission, t]);
  const [state, setState] = useState<TerminalState>(initialState);
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [nextHref, setNextHref] = useState("/dashboard");
  const [hintVisible, setHintVisible] = useState(false);
  const [allowed, setAllowed] = useState(false);

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    const result = TerminalEngine.run(input, state, mission, (key, params) => t(key, params));
    setState(result.state);
    setInput("");
    setHistoryIndex(null);
    if (result.completed && !complete) {
      setComplete(true);
      const progress = await completeMission(mission.environmentId, mission.levelId, mission.id, mission.xpReward, mission.badgeReward, mission.avatarItemReward);
      setNextHref(getNextAction(progress).href);
    }
  }

  const validation = TerminalEngine.validate(state, mission);

  useEffect(() => {
    getProgress().then((progress) => {
      const complete = progress.completedMissions[mission.environmentId]?.includes(mission.id);
      if (!complete && !isMissionUnlocked(mission.id, mission.environmentId, progress)) {
        window.location.href = `/quest/${mission.environmentId}/level/${mission.levelId}`;
        return;
      }
      setAllowed(true);
    });
  }, [mission]);

  if (!allowed) return <main className="mx-auto max-w-5xl px-6 py-16 text-zinc-400">{t("common.loadingDeck")}</main>;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      setInput((value) => TerminalEngine.completeInput(value, state, mission));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = historyIndex === null ? state.history.length - 1 : Math.max(0, historyIndex - 1);
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(state.history[nextIndex] ?? "");
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= state.history.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(state.history[nextIndex] ?? "");
      }
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 pt-8 lg:grid-cols-[0.85fr_1.4fr]">
      <aside className="space-y-5">
        <section className="glass rounded-lg p-5">
          <p className="subtle-label">{t("mission.briefing")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{missionText("title")}</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">{missionText("briefing")}</p>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("mission.objective")}</div>
            <p className="mt-2 text-sm font-medium text-white">{missionText("objective")}</p>
          </div>
        </section>
        <section className="glass rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">{t("mission.commandHelp")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {mission.unlockedCommands.map((command) => (
              <code key={command} className="rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-sm text-zinc-200">{command}</code>
            ))}
          </div>
          <button className="focus-ring secondary-action mt-5 rounded-md px-4 py-2 text-sm" onClick={() => setHintVisible(!hintVisible)}>
            {hintVisible ? t("mission.hideHint") : t("mission.showHint")}
          </button>
          {hintVisible ? <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-zinc-300">{hintText()}</p> : null}
        </section>
        <section className="glass rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">{t("mission.validation")}</h2>
          <div className="mt-4 space-y-2">
            {validation.map((result, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-sm">
                <span className="text-zinc-400">{describeRule(result.rule, t)}</span>
                <span className={result.passed ? "text-zinc-100" : "text-zinc-600"}>{result.passed ? t("mission.passed") : t("mission.pending")}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <section className="glass flex min-h-[640px] flex-col overflow-hidden rounded-lg p-0">
        <div className="flex h-11 items-center gap-2 border-b border-white/10 bg-white/[0.045] px-4">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 font-mono text-xs text-zinc-500">terminal://{mission.environmentId}/{mission.id}</span>
        </div>
        <div className="flex-1 overflow-auto bg-[#090a0d] p-4 font-mono text-sm leading-6 text-zinc-100">
          {state.output.map((line, index) => (
            <div key={`${line.type}-${index}`} className={line.type === "system" ? "mb-3 text-zinc-400" : line.type === "input" ? "text-white" : "whitespace-pre-wrap text-zinc-400"}>
              {line.text}
            </div>
          ))}
          <form className="mt-2 flex items-center gap-2" onSubmit={submit}>
            <label className="shrink-0 text-zinc-100" htmlFor="command-input">{TerminalEngine.prompt(state)}</label>
            <input
              id="command-input"
              className="focus-ring min-w-0 flex-1 bg-transparent text-white outline-none"
              value={input}
              autoComplete="off"
              autoFocus
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </form>
        </div>
      </section>

      {complete ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 px-6">
          <div className="glass max-w-md rounded-lg p-6 text-center">
            <p className="subtle-label">{t("mission.complete")}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">+{t("common.xp", { xp: mission.xpReward })}</h2>
            <p className="mt-3 text-zinc-400">{mission.badgeReward ? t("mission.badgeUnlocked", { badge: t(`badge.${mission.badgeReward}` as TranslationKey) }) : t("mission.progressSaved")}</p>
            <div className="mt-6 flex gap-3">
              <a className="focus-ring secondary-action flex-1 rounded-md px-4 py-3 text-sm font-semibold" href={`/quest/${mission.environmentId}/level/${mission.levelId}`}>{t("mission.levelMap")}</a>
              <a className="focus-ring primary-action flex-1 rounded-md px-4 py-3 text-sm font-semibold" href={nextHref}>{t("dashboard.continueQuest")}</a>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function describeRule(rule: Mission["validationRules"][number], t: (key: TranslationKey, params?: Record<string, string | number>) => string) {
  switch (rule.type) {
    case "historyIncludes":
      return t("validation.run", { command: rule.command });
    case "cwdEquals":
      return t("validation.reach", { path: rule.path });
    case "pathExists":
      return t("validation.create", { path: rule.path });
    case "fileContains":
      return t("validation.writeText");
    case "catRead":
      return t("validation.read", { path: rule.path });
    default:
      return t("validation.complete");
  }
}
