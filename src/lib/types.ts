export type EnvironmentId = "debian" | "powershell" | "macos" | "fedora" | "arch";

export type AvatarConfig = {
  base: "dino" | "bot" | "pilot";
  skin: "green" | "blue" | "violet" | "amber";
  helmet: string;
  glasses: string;
  outfit: string;
  background: string;
};

export type VirtualNode = string | { [name: string]: VirtualNode };
export type VirtualFileSystem = Record<string, VirtualNode>;

export type ValidationRule =
  | { type: "historyIncludes"; command: string }
  | { type: "cwdEquals"; path: string }
  | { type: "pathExists"; path: string; nodeType?: "file" | "directory" }
  | { type: "fileContains"; path: string; text: string }
  | { type: "catRead"; path: string };

export type Mission = {
  id: string;
  environmentId: EnvironmentId;
  levelId: number;
  title: string;
  description: string;
  briefing: string;
  objective: string;
  difficulty: "starter" | "standard" | "boss";
  xpReward: number;
  orderIndex: number;
  initialFilesystem: VirtualFileSystem;
  startDirectory: string;
  validationRules: ValidationRule[];
  unlockedCommands: string[];
  hints: string[];
  badgeReward?: string;
  avatarItemReward?: string;
};

export type Level = {
  id: number;
  title: string;
  description: string;
  commands: string[];
  status?: "available" | "locked" | "complete";
  missions: Mission[];
};

export type EnvironmentPath = {
  id: EnvironmentId;
  name: string;
  slug: string;
  description: string;
  difficulty: string;
  isBeginner: boolean;
  orderIndex: number;
  initiallyUnlocked: boolean;
  unlockText: string;
  accent: string;
  levels: Level[];
};

export type UserProgress = {
  id: string;
  isAuthenticated: boolean;
  profileComplete: boolean;
  username: string;
  displayName: string;
  profilePhotoDataUrl?: string | null;
  avatarConfig: AvatarConfig;
  activeEnvironment: EnvironmentId | null;
  globalXp: number;
  globalLevel: number;
  rank: string;
  preferredLocale: "es-MX" | "en-US" | "zh-CN";
  streakCount: number;
  completedMissions: Record<string, string[]>;
  environmentLevels: Record<string, number>;
  unlockedCommands: Record<string, string[]>;
  unlockedBadges: string[];
  unlockedAvatarItems: string[];
  updatedAt: string;
};

export type CertificateRecord = {
  id: string;
  userId: string;
  environmentId: EnvironmentId;
  certificateId: string;
  title: string;
  issuedTo: string;
  issuedAt: string;
  totalMissions: number;
  totalXp: number;
  skillsCovered: string[];
  verificationSlug: string;
  isPublic: boolean;
};
