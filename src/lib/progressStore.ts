import Dexie, { type Table } from "dexie";
import { defaultLocale, type Locale } from "./i18n";
import { environments } from "./curriculum";
import { supabase } from "./supabase";
import type { CertificateRecord, EnvironmentId, UserProgress } from "./types";

const defaultProgress: UserProgress = {
  id: "local-player",
  isAuthenticated: false,
  profileComplete: false,
  username: "operator",
  displayName: "BitByBit Operator",
  profilePhotoDataUrl: null,
  avatarConfig: {
    base: "dino",
    skin: "green",
    helmet: "none",
    glasses: "none",
    outfit: "terminal-hoodie",
    background: "debian",
  },
  activeEnvironment: null,
  globalXp: 0,
  globalLevel: 1,
  rank: "Terminal Rookie",
  preferredLocale: defaultLocale,
  streakCount: 0,
  completedMissions: {},
  environmentLevels: { debian: 1, powershell: 1, macos: 1 },
  unlockedCommands: { debian: ["pwd", "ls", "cd", "clear", "whoami"] },
  unlockedBadges: [],
  unlockedAvatarItems: ["Terminal Hoodie"],
  updatedAt: new Date().toISOString(),
};

const progressStorageKey = "bitbybit-progress-fallback";

type SyncJob = {
  id?: number;
  type: "progress" | "certificate";
  payload: UserProgress | CertificateRecord;
  createdAt: string;
};

class BitByBitDB extends Dexie {
  progress!: Table<UserProgress, string>;
  syncQueue!: Table<SyncJob, number>;
  certificates!: Table<CertificateRecord, string>;

  constructor() {
    super("bitbybit-terminal-quest");
    this.version(1).stores({
      progress: "id, activeEnvironment, updatedAt",
      syncQueue: "++id, type, createdAt",
    });
    this.version(2).stores({
      progress: "id, activeEnvironment, updatedAt",
      syncQueue: "++id, type, createdAt",
      certificates: "certificateId, userId, environmentId, verificationSlug, issuedAt",
    });
  }
}

export const db = new BitByBitDB();

const xpToLevel = (xp: number) => Math.max(1, Math.floor(xp / 300) + 1);

const rankForLevel = (level: number) => {
  const ranks = [
    "Terminal Rookie",
    "File System Builder",
    "Command Operator",
    "Log Hunter",
    "Package Handler",
    "Permission Guardian",
    "Process Controller",
    "Network Explorer",
    "Automation Apprentice",
    "Troubleshooter",
    "System Specialist",
    "Terminal Operator",
  ];
  return ranks[Math.min(level - 1, ranks.length - 1)];
};

const freshDefaultProgress = (): UserProgress => ({
  ...defaultProgress,
  isAuthenticated: false,
  profileComplete: false,
  avatarConfig: { ...defaultProgress.avatarConfig },
  completedMissions: {},
  environmentLevels: { debian: 1, powershell: 1, macos: 1 },
  unlockedCommands: { debian: ["pwd", "ls", "cd", "clear", "whoami"] },
  unlockedBadges: [],
  unlockedAvatarItems: ["Terminal Hoodie"],
  updatedAt: new Date().toISOString(),
});

export type NextAction =
  | { type: "login"; href: "/auth/login" }
  | { type: "profile"; href: "/onboarding/profile" }
  | { type: "environment"; href: "/onboarding/environment" }
  | { type: "mission"; href: string; missionId: string; levelId: number }
  | { type: "level"; href: string; levelId: number }
  | { type: "certificate"; href: string };

export async function getProgress() {
  if (typeof indexedDB === "undefined") return readFallbackProgress() ?? freshDefaultProgress();
  try {
    const existing = await db.progress.get("local-player");
    if (existing) return normalizeProgress(existing);
    const progress = freshDefaultProgress();
    await db.progress.put(progress);
    writeFallbackProgress(progress);
    return progress;
  } catch {
    return readFallbackProgress() ?? freshDefaultProgress();
  }
}

export async function saveProgress(progress: UserProgress, queueSync = true) {
  const updated = normalizeProgress({ ...progress, updatedAt: new Date().toISOString() });
  writeFallbackProgress(updated);
  if (typeof indexedDB === "undefined") return updated;
  try {
    await db.progress.put(updated);
    if (queueSync) await db.syncQueue.add({ type: "progress", payload: updated, createdAt: new Date().toISOString() });
  } catch {
    return updated;
  }
  return updated;
}

export async function loginLocal() {
  const progress = await getProgress();
  return saveProgress({ ...progress, isAuthenticated: true }, false);
}

export async function logoutLocal() {
  const progress = await getProgress();
  return saveProgress({ ...progress, isAuthenticated: false }, false);
}

export async function completeProfile(input: Pick<UserProgress, "username" | "displayName" | "avatarConfig" | "preferredLocale"> & { profilePhotoDataUrl?: string | null }) {
  const progress = await getProgress();
  return saveProgress({ ...progress, ...input, isAuthenticated: true, profileComplete: true });
}

export async function updateProfile(input: Partial<Pick<UserProgress, "username" | "displayName" | "avatarConfig" | "profilePhotoDataUrl">>) {
  const progress = await getProgress();
  return saveProgress({ ...progress, ...input, isAuthenticated: true });
}

export async function setActiveEnvironment(environmentId: EnvironmentId) {
  const progress = await getProgress();
  return saveProgress({
    ...progress,
    isAuthenticated: true,
    activeEnvironment: environmentId,
    environmentLevels: { ...progress.environmentLevels, [environmentId]: progress.environmentLevels[environmentId] ?? 1 },
    avatarConfig: { ...progress.avatarConfig, background: environmentId },
  });
}

export async function setPreferredLocale(preferredLocale: Locale) {
  const progress = await getProgress();
  return saveProgress({ ...progress, preferredLocale });
}

export async function completeMission(environmentId: EnvironmentId, levelId: number, missionId: string, xp: number, badge?: string, avatarItem?: string) {
  const progress = await getProgress();
  const completed = new Set(progress.completedMissions[environmentId] ?? []);
  if (completed.has(missionId)) return saveProgress(progress, false);
  completed.add(missionId);
  const globalXp = progress.globalXp + xp;
  const globalLevel = xpToLevel(globalXp);
  const environment = environments.find((item) => item.id === environmentId);
  const level = environment?.levels.find((item) => item.id === levelId);
  const levelMissionIds = level?.missions.map((mission) => mission.id) ?? [];
  const levelComplete = levelMissionIds.length > 0 && levelMissionIds.every((id) => completed.has(id));
  const environmentLevels = { ...progress.environmentLevels };
  environmentLevels[environmentId] = Math.max(environmentLevels[environmentId] ?? 1, levelComplete ? Math.min(levelId + 1, 12) : levelId);
  const unlockedBadges = badge && !progress.unlockedBadges.includes(badge) ? [...progress.unlockedBadges, badge] : progress.unlockedBadges;
  const unlockedAvatarItems = avatarItem && !progress.unlockedAvatarItems.includes(avatarItem) ? [...progress.unlockedAvatarItems, avatarItem] : progress.unlockedAvatarItems;
  const unlockedCommands = {
    ...progress.unlockedCommands,
    [environmentId]: Array.from(new Set([...(progress.unlockedCommands[environmentId] ?? []), ...(environment?.levels.find((item) => item.id === levelId)?.missions.find((item) => item.id === missionId)?.unlockedCommands ?? [])])),
  };

  return saveProgress({
    ...progress,
    globalXp,
    globalLevel,
    rank: rankForLevel(globalLevel),
    completedMissions: { ...progress.completedMissions, [environmentId]: [...completed] },
    environmentLevels,
    unlockedCommands,
    unlockedBadges,
    unlockedAvatarItems,
  });
}

export function isEnvironmentUnlocked(environmentId: EnvironmentId, progress: UserProgress) {
  if (["debian", "powershell", "macos"].includes(environmentId)) return true;
  if (environmentId === "fedora") return ["debian", "powershell", "macos"].some((id) => (progress.environmentLevels[id] ?? 1) >= 6);
  if (environmentId === "arch") return (progress.environmentLevels.debian ?? 1) >= 12 || (progress.environmentLevels.fedora ?? 1) >= 10;
  return false;
}

export function getNextMission(environmentId: EnvironmentId, progress: UserProgress) {
  const environment = environments.find((item) => item.id === environmentId);
  if (!environment) return undefined;
  const currentLevel = progress.environmentLevels[environmentId] ?? 1;
  const completed = new Set(progress.completedMissions[environmentId] ?? []);
  for (const level of environment.levels) {
    if (level.id > currentLevel) break;
    const normalMissions = level.missions.filter((mission) => mission.difficulty !== "boss");
    const bossMission = level.missions.find((mission) => mission.difficulty === "boss");
    const nextNormal = normalMissions.find((mission) => !completed.has(mission.id));
    if (nextNormal) return nextNormal;
    if (bossMission && !completed.has(bossMission.id)) return bossMission;
  }
  return undefined;
}

export function isMissionUnlocked(missionId: string, environmentId: EnvironmentId, progress: UserProgress) {
  const completed = progress.completedMissions[environmentId] ?? [];
  if (completed.includes(missionId)) return true;
  return getNextMission(environmentId, progress)?.id === missionId;
}

export function isLevelComplete(environmentId: EnvironmentId, levelId: number, progress: UserProgress) {
  const level = environments.find((item) => item.id === environmentId)?.levels.find((item) => item.id === levelId);
  if (!level || level.missions.length === 0) return false;
  const completed = new Set(progress.completedMissions[environmentId] ?? []);
  return level.missions.every((mission) => completed.has(mission.id));
}

export function isEnvironmentPathComplete(environmentId: EnvironmentId, progress: UserProgress) {
  const environment = environments.find((item) => item.id === environmentId);
  if (!environment) return false;
  const playableComplete = environment.levels.every((level) => level.missions.length === 0 || isLevelComplete(environmentId, level.id, progress));
  return playableComplete && (progress.environmentLevels[environmentId] ?? 1) >= 12;
}

export function getNextAction(progress: UserProgress): NextAction {
  if (!progress.isAuthenticated) return { type: "login", href: "/auth/login" };
  if (!progress.profileComplete) return { type: "profile", href: "/onboarding/profile" };
  if (!progress.activeEnvironment) return { type: "environment", href: "/onboarding/environment" };
  const mission = getNextMission(progress.activeEnvironment, progress);
  if (mission) return { type: "mission", href: `/mission/${mission.id}`, missionId: mission.id, levelId: mission.levelId };
  if (!isEnvironmentPathComplete(progress.activeEnvironment, progress)) {
    const environment = environments.find((item) => item.id === progress.activeEnvironment);
    const levelId = progress.environmentLevels[progress.activeEnvironment] ?? 1;
    return { type: "level", href: `/quest/${environment?.slug ?? progress.activeEnvironment}/level/${levelId}`, levelId };
  }
  return { type: "certificate", href: `/profile/certificates` };
}

export async function getCertificates() {
  if (typeof indexedDB === "undefined") return [];
  return db.certificates.toArray();
}

export async function getCertificateById(certificateId: string) {
  const local = typeof indexedDB === "undefined" ? undefined : await db.certificates.get(certificateId);
  if (local) return local;
  if (!supabase) return undefined;
  const { data } = await supabase.from("certificates").select("*").eq("certificate_id", certificateId).maybeSingle();
  return data ? fromCertificateRow(data) : undefined;
}

export async function getCertificateByVerificationSlug(verificationSlug: string) {
  const local = typeof indexedDB === "undefined" ? undefined : await db.certificates.where("verificationSlug").equals(verificationSlug).first();
  if (local) return local;
  if (!supabase) return undefined;
  const { data } = await supabase.from("certificates").select("*").eq("verification_slug", verificationSlug).eq("is_public", true).maybeSingle();
  return data ? fromCertificateRow(data) : undefined;
}

function fromCertificateRow(row: any): CertificateRecord {
  return {
    id: row.id,
    userId: row.user_id,
    environmentId: row.environment_id,
    certificateId: row.certificate_id,
    title: row.title,
    issuedTo: row.issued_to,
    issuedAt: row.issued_at,
    totalMissions: row.total_missions,
    totalXp: row.total_xp,
    skillsCovered: row.skills_covered ?? [],
    verificationSlug: row.verification_slug,
    isPublic: row.is_public,
  };
}

export async function ensureCertificate(environmentId: EnvironmentId) {
  const progress = await getProgress();
  if (!progress.isAuthenticated || !progress.profileComplete) throw new Error("profile-incomplete");
  if (!isEnvironmentPathComplete(environmentId, progress)) throw new Error("path-incomplete");
  const existing = await db.certificates.filter((certificate) => certificate.userId === progress.id && certificate.environmentId === environmentId).first();
  if (existing) return existing;

  const environment = environments.find((item) => item.id === environmentId);
  if (!environment) throw new Error("environment-not-found");
  const certificateId = `BBB-${environmentId.toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const verificationSlug = `${environmentId}-${certificateId.toLowerCase()}`;
  const skillsCovered = environment.levels.map((level) => level.title);
  const record: CertificateRecord = {
    id: crypto.randomUUID(),
    userId: progress.id,
    environmentId,
    certificateId,
    title: `BitByBit Certified Terminal Operator — ${environment.name} Path`,
    issuedTo: progress.displayName,
    issuedAt: new Date().toISOString(),
    totalMissions: environment.levels.flatMap((level) => level.missions).length,
    totalXp: progress.globalXp,
    skillsCovered,
    verificationSlug,
    isPublic: true,
  };

  await db.certificates.put(record);
  await db.syncQueue.add({ type: "certificate", payload: record, createdAt: new Date().toISOString() });
  await syncCertificateToSupabase(record);
  return record;
}

async function syncCertificateToSupabase(record: CertificateRecord) {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("certificates").upsert({
    id: record.id,
    user_id: data.user.id,
    environment_id: record.environmentId,
    certificate_id: record.certificateId,
    title: record.title,
    issued_to: record.issuedTo,
    issued_at: record.issuedAt,
    total_missions: record.totalMissions,
    total_xp: record.totalXp,
    skills_covered: record.skillsCovered,
    verification_slug: record.verificationSlug,
    is_public: record.isPublic,
  });
}

export async function resetEnvironmentProgress(environmentId: EnvironmentId) {
  const progress = await getProgress();
  const next = {
    ...progress,
    completedMissions: { ...progress.completedMissions, [environmentId]: [] },
    environmentLevels: { ...progress.environmentLevels, [environmentId]: 1 },
    unlockedCommands: { ...progress.unlockedCommands, [environmentId]: ["pwd", "ls", "cd", "clear", "whoami"] },
  };
  return saveProgress(next);
}

export async function exportProgress() {
  return JSON.stringify(await getProgress(), null, 2);
}

export async function importProgress(json: string) {
  const parsed = JSON.parse(json) as UserProgress;
  return saveProgress({ ...freshDefaultProgress(), ...parsed, id: "local-player" });
}

export async function resetProgress() {
  const progress = freshDefaultProgress();
  writeFallbackProgress(progress);
  if (typeof indexedDB === "undefined") return progress;
  await db.transaction("rw", db.progress, db.syncQueue, async () => {
    await db.progress.clear();
    await db.syncQueue.clear();
    await db.progress.put(progress);
  });
  return progress;
}

function normalizeProgress(progress: Partial<UserProgress>): UserProgress {
  const normalized = {
    ...freshDefaultProgress(),
    ...progress,
    id: progress.id ?? "local-player",
    isAuthenticated: Boolean(progress.isAuthenticated),
    profileComplete: Boolean(progress.profileComplete),
    profilePhotoDataUrl: progress.profilePhotoDataUrl ?? null,
    avatarConfig: { ...freshDefaultProgress().avatarConfig, ...progress.avatarConfig },
    completedMissions: progress.completedMissions ?? {},
    environmentLevels: progress.environmentLevels ?? { debian: 1, powershell: 1, macos: 1 },
    unlockedCommands: progress.unlockedCommands ?? { debian: ["pwd", "ls", "cd", "clear", "whoami"] },
    unlockedBadges: progress.unlockedBadges ?? [],
    unlockedAvatarItems: progress.unlockedAvatarItems ?? ["Terminal Hoodie"],
    updatedAt: progress.updatedAt ?? new Date().toISOString(),
  };
  return { ...normalized, environmentLevels: repairEnvironmentLevels(normalized) };
}

function repairEnvironmentLevels(progress: UserProgress) {
  const repaired = { ...progress.environmentLevels };
  environments.forEach((environment) => {
    const completed = new Set(progress.completedMissions[environment.id] ?? []);
    const highestUnlocked = environment.levels.reduce((levelCap, level) => {
      if (level.id > levelCap) return levelCap;
      if (!level.missions.length) return levelCap;
      const levelComplete = level.missions.every((mission) => completed.has(mission.id));
      return levelComplete ? Math.min(level.id + 1, environment.levels.length) : levelCap;
    }, repaired[environment.id] ?? 1);
    repaired[environment.id] = Math.max(repaired[environment.id] ?? 1, highestUnlocked);
  });
  return repaired;
}

function readFallbackProgress() {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(progressStorageKey);
    return raw ? normalizeProgress(JSON.parse(raw) as Partial<UserProgress>) : undefined;
  } catch {
    return undefined;
  }
}

function writeFallbackProgress(progress: UserProgress) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(progressStorageKey, JSON.stringify(progress));
  } catch {
    // Local progress is best effort; IndexedDB remains the primary store.
  }
}

export async function getQueuedSyncCount() {
  if (typeof indexedDB === "undefined") return 0;
  return db.syncQueue.count();
}

export async function flushSyncQueue() {
  if (typeof indexedDB === "undefined" || !navigator.onLine) return 0;
  const jobs = await db.syncQueue.toArray();
  for (const job of jobs) {
    if (job.type === "certificate") await syncCertificateToSupabase(job.payload as CertificateRecord);
  }
  await db.syncQueue.clear();
  return jobs.length;
}
