import type { ReactNode } from "react";
import type { TranslationKey } from "@/lib/i18n";
import { useI18n } from "@/lib/useI18n";

export function Shell({ children }: { children: ReactNode }) {
  return <div className="page-shell">{children}</div>;
}

export function PageHeader({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <header className="mx-auto max-w-6xl px-6 pb-8 pt-10">
      {eyebrow ? <p className="subtle-label">{eyebrow}</p> : null}
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">{title}</h1>
      {copy ? <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">{copy}</p> : null}
    </header>
  );
}

export function Button({ children, href, variant = "primary" }: { children: ReactNode; href: string; variant?: "primary" | "secondary" }) {
  const styles =
    variant === "primary"
      ? "primary-action"
      : "secondary-action";
  return (
    <a className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition ${styles}`} href={href}>
      {children}
    </a>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass rounded-lg p-5 ${className}`}>{children}</section>;
}

export function XPBar({ xp, labelKey = "xp.global" }: { xp: number; labelKey?: TranslationKey }) {
  const { t } = useI18n();
  const next = 300;
  const percent = Math.min(100, Math.round((xp % next) / next * 100));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-zinc-400">{t(labelKey)}</span>
        <span className="font-mono text-zinc-100">{t("common.xp", { xp })}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-zinc-100" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function RankBadge({ rank }: { rank: string }) {
  const { t } = useI18n();
  return <span className="inline-flex rounded-md border border-white/10 bg-white/7 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">{t(rankKey(rank))}</span>;
}

export function AvatarPreview({ config, size = "large", photoDataUrl }: { config: { skin: string; outfit: string; glasses: string; background: string }; size?: "small" | "large"; photoDataUrl?: string | null }) {
  const dimensions = size === "large" ? "h-40 w-40" : "h-16 w-16";
  const skin = { green: "bg-emerald-400", blue: "bg-sky-400", violet: "bg-violet-400", amber: "bg-amber-300" }[config.skin] ?? "bg-emerald-400";
  if (photoDataUrl) {
    return (
      <div className={`${dimensions} relative overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-panel`}>
        <img className="h-full w-full object-cover" src={photoDataUrl} alt="" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 text-center text-[10px] uppercase tracking-[0.08em] text-zinc-200">{config.background}</div>
      </div>
    );
  }
  return (
    <div className={`${dimensions} relative overflow-hidden rounded-lg border border-white/10 bg-zinc-950 p-4 shadow-panel`}>
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" />
      <div className={`relative mx-auto mt-2 h-16 w-16 rounded-[10px] ${skin}`} />
      <div className="relative mx-auto mt-2 h-10 w-24 rounded-md bg-zinc-800">
        <div className="mx-auto h-full w-14 bg-zinc-700" />
      </div>
      <div className="relative mt-2 text-center text-[10px] uppercase tracking-[0.08em] text-zinc-500">{config.background}</div>
    </div>
  );
}

export function EnvironmentCard({
  name,
  nameKey,
  description,
  descriptionKey,
  difficulty,
  difficultyKey,
  accent,
  href,
  locked,
  unlockText,
  unlockTextKey,
  onSelect,
}: {
  name?: string;
  nameKey?: TranslationKey;
  description?: string;
  descriptionKey?: TranslationKey;
  difficulty?: string;
  difficultyKey?: TranslationKey;
  accent: string;
  href: string;
  locked?: boolean;
  unlockText?: string;
  unlockTextKey?: TranslationKey;
  onSelect?: () => void;
}) {
  const { t } = useI18n();
  const resolvedName = nameKey ? t(nameKey) : (name ?? "");
  const resolvedDescription = descriptionKey ? t(descriptionKey) : (description ?? "");
  const resolvedDifficulty = difficultyKey ? t(difficultyKey) : (difficulty ?? "");
  const resolvedUnlock = unlockTextKey ? t(unlockTextKey) : (unlockText ?? "");
  const className = `glass focus-ring block w-full rounded-lg p-5 text-left transition ${locked ? "opacity-55 hover:bg-white/[0.045]" : "hover:-translate-y-0.5 hover:bg-white/[0.065]"}`;
  const content = (
    <>
      <div className="mb-5 h-1 rounded-full bg-white/15">
        <div className="h-full w-1/3 rounded-full" style={{ background: accent }} />
      </div>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">{resolvedName}</h3>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400">{resolvedDifficulty}</span>
      </div>
      <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-400">{resolvedDescription}</p>
      <p className={`mt-5 text-sm font-semibold ${locked ? "text-zinc-500" : "text-zinc-100"}`}>{locked ? `${t("common.locked")}: ${resolvedUnlock}` : resolvedUnlock}</p>
    </>
  );
  if (onSelect) return <button className={className} onClick={onSelect}>{content}</button>;
  return (
    <a href={locked ? "#" : href} className={className}>
      {content}
    </a>
  );
}

export function MissionCard({ title, titleKey, description, descriptionKey, href, complete, locked }: { title?: string; titleKey?: TranslationKey; description?: string; descriptionKey?: TranslationKey; href: string; complete?: boolean; locked?: boolean }) {
  const { t } = useI18n();
  const resolvedTitle = titleKey ? t(titleKey) : (title ?? "");
  const resolvedDescription = descriptionKey ? t(descriptionKey) : (description ?? "");
  return (
    <a className={`glass focus-ring block rounded-lg p-5 transition ${locked ? "pointer-events-none opacity-45" : "hover:-translate-y-0.5 hover:bg-white/[0.065]"}`} href={href}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">{resolvedTitle === titleKey ? title : resolvedTitle}</h3>
        <span className={`rounded-md px-2 py-1 text-xs ${complete ? "bg-white/15 text-white" : "bg-white/8 text-zinc-400"}`}>{complete ? t("common.complete") : locked ? t("common.locked") : t("common.open")}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{resolvedDescription === descriptionKey ? description : resolvedDescription}</p>
    </a>
  );
}

export function BadgeGrid({ badges }: { badges: string[] }) {
  const { t } = useI18n();
  const all = ["shell-awakening", "file-system-builder", "command-operator", "log-hunter", "package-handler", "permission-guardian", "process-controller", "network-explorer", "automation-apprentice", "system-specialist", "terminal-operator", "first-command"];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {all.map((badge, index) => {
        const unlocked = badges.includes(badge);
        return (
        <div key={badge} className={`rounded-lg border p-4 ${unlocked ? "border-emerald-300/25 bg-emerald-300/10" : "border-white/10 bg-white/[0.03] opacity-70"}`}>
          <div className="flex items-start gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md border text-sm font-bold ${unlocked ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200" : "border-white/10 bg-white/[0.04] text-zinc-500"}`}>
              {unlocked ? "✓" : String(index + 1).padStart(2, "0")}
            </div>
            <div>
              <div className="font-semibold text-white">{t(`badge.${badge}` as TranslationKey)}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.08em] text-zinc-500">{unlocked ? t("common.unlocked") : t("common.locked")}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-400">{t(`badge.${badge}.unlock` as TranslationKey)}</p>
        </div>
      )})}
    </div>
  );
}

function rankKey(rank: string): TranslationKey {
  const normalized = rank.toLowerCase().replaceAll(" ", "-");
  return `rank.${normalized}` as TranslationKey;
}
