create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_config jsonb not null default '{}'::jsonb,
  avatar_url text,
  active_environment text,
  global_xp integer not null default 0,
  global_level integer not null default 1,
  rank text not null default 'Terminal Rookie',
  preferred_locale text not null default 'en-US' check (preferred_locale in ('es-MX', 'en-US', 'zh-CN')),
  streak_count integer not null default 0,
  last_activity_date date,
  public_profile boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists preferred_locale text not null default 'en-US' check (preferred_locale in ('es-MX', 'en-US', 'zh-CN'));

create table if not exists public.environments (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text not null,
  difficulty text not null,
  is_beginner boolean not null default false,
  unlock_requirement jsonb not null default '{}'::jsonb,
  order_index integer not null
);

create table if not exists public.missions (
  id text primary key,
  environment_id text not null references public.environments(id),
  level_id text not null,
  title text not null,
  description text not null,
  briefing text not null,
  objective text not null,
  difficulty text not null,
  xp_reward integer not null default 0,
  order_index integer not null,
  initial_filesystem jsonb not null default '{}'::jsonb,
  validation_rules jsonb not null default '[]'::jsonb,
  unlocked_commands text[] not null default '{}',
  hints text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.user_environment_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  environment_id text not null references public.environments(id),
  status text not null default 'active',
  level integer not null default 1,
  xp integer not null default 0,
  completed_missions text[] not null default '{}',
  unlocked_commands text[] not null default '{}',
  unlocked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, environment_id)
);

create table if not exists public.user_mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null references public.missions(id),
  status text not null default 'not_started',
  attempts integer not null default 0,
  used_hints boolean not null default false,
  best_score integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  xp_bonus integer not null default 0,
  unlock_condition jsonb not null default '{}'::jsonb
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id),
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create table if not exists public.avatar_items (
  id text primary key,
  name text not null,
  type text not null,
  rarity text not null,
  unlock_condition jsonb not null default '{}'::jsonb,
  asset_url text
);

create table if not exists public.user_avatar_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  avatar_item_id text not null references public.avatar_items(id),
  unlocked_at timestamptz not null default now(),
  unique (user_id, avatar_item_id)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  environment_id text not null references public.environments(id),
  certificate_id text unique not null,
  title text not null,
  issued_to text not null,
  issued_at timestamptz not null default now(),
  total_missions integer not null default 0,
  total_xp integer not null default 0,
  skills_covered text[] not null default '{}',
  verification_slug text unique not null,
  is_public boolean not null default true
);

alter table public.profiles enable row level security;
alter table public.environments enable row level security;
alter table public.missions enable row level security;
alter table public.user_environment_progress enable row level security;
alter table public.user_mission_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.avatar_items enable row level security;
alter table public.user_avatar_items enable row level security;
alter table public.certificates enable row level security;

create policy "profiles_select_own_or_public" on public.profiles for select using (auth.uid() = id or public_profile = true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "environments_read_public" on public.environments for select using (true);
create policy "missions_read_public" on public.missions for select using (true);
create policy "achievements_read_public" on public.achievements for select using (true);
create policy "avatar_items_read_public" on public.avatar_items for select using (true);

create policy "environment_progress_select_own" on public.user_environment_progress for select using (auth.uid() = user_id);
create policy "environment_progress_insert_own" on public.user_environment_progress for insert with check (auth.uid() = user_id);
create policy "environment_progress_update_own" on public.user_environment_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mission_progress_select_own" on public.user_mission_progress for select using (auth.uid() = user_id);
create policy "mission_progress_insert_own" on public.user_mission_progress for insert with check (auth.uid() = user_id);
create policy "mission_progress_update_own" on public.user_mission_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);
create policy "user_achievements_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);
create policy "user_achievements_update_own" on public.user_achievements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_avatar_items_select_own" on public.user_avatar_items for select using (auth.uid() = user_id);
create policy "user_avatar_items_insert_own" on public.user_avatar_items for insert with check (auth.uid() = user_id);
create policy "user_avatar_items_update_own" on public.user_avatar_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "certificates_select_own_or_public" on public.certificates for select using (auth.uid() = user_id or is_public = true);
create policy "certificates_insert_own" on public.certificates for insert with check (auth.uid() = user_id);
create policy "certificates_update_own" on public.certificates for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.environments (id, name, slug, description, difficulty, is_beginner, unlock_requirement, order_index) values
  ('debian', 'Debian / Ubuntu', 'debian', 'Beginner-friendly Linux path for developers and server operators.', 'Beginner', true, '{}'::jsonb, 1),
  ('powershell', 'Windows PowerShell', 'powershell', 'Windows administration through PowerShell fundamentals.', 'Beginner', true, '{}'::jsonb, 2),
  ('macos', 'macOS Terminal', 'macos', 'Zsh, Homebrew, and macOS developer workstation skills.', 'Beginner', true, '{}'::jsonb, 3),
  ('fedora', 'Fedora / RHEL', 'fedora', 'Enterprise Linux with DNF, RPM, systemd, and SELinux.', 'Intermediate', false, '{"after":"complete_level_6_beginner"}'::jsonb, 4),
  ('arch', 'Arch Linux', 'arch', 'Power-user Linux path focused on system control and recovery.', 'Advanced', false, '{"after":"debian_level_12_or_fedora_level_10"}'::jsonb, 5)
on conflict (id) do nothing;

insert into public.achievements (id, name, description, icon, xp_bonus, unlock_condition) values
  ('shell-awakening', 'Shell Awakening', 'Complete the first terminal boss mission.', 'Sparkles', 25, '{"mission":"debian-l1-boss-hidden-folder"}'::jsonb),
  ('file-system-builder', 'File System Builder', 'Build a complete starter workspace.', 'FolderTree', 50, '{"mission":"debian-l2-boss-workspace"}'::jsonb),
  ('first-command', 'First Command', 'Complete your first mission.', 'Terminal', 10, '{"completed_missions":1}'::jsonb)
on conflict (id) do nothing;

insert into public.avatar_items (id, name, type, rarity, unlock_condition) values
  ('terminal-hoodie', 'Terminal Hoodie', 'outfit', 'common', '{}'::jsonb),
  ('shell-glasses', 'Shell Glasses', 'glasses', 'rare', '{"badge":"shell-awakening"}'::jsonb),
  ('debian-hoodie', 'Debian Hoodie', 'outfit', 'rare', '{"badge":"file-system-builder"}'::jsonb),
  ('fedora-jacket', 'Fedora Jacket', 'outfit', 'epic', '{"environment":"fedora"}'::jsonb),
  ('arch-cape', 'Arch Cape', 'outfit', 'legendary', '{"environment":"arch"}'::jsonb),
  ('powershell-badge', 'PowerShell Badge', 'badge', 'rare', '{"environment":"powershell"}'::jsonb),
  ('macos-zsh-aura', 'macOS Zsh Aura', 'background', 'rare', '{"environment":"macos"}'::jsonb),
  ('root-crown', 'Root Crown', 'helmet', 'legendary', '{"rank":"Terminal Operator"}'::jsonb)
on conflict (id) do nothing;
