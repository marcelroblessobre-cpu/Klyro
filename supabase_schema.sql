-- ============================================================
-- KLYRO — Supabase Schema
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. USERS
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  xp integer default 0,
  streak integer default 0,
  level integer default 1,
  created_at timestamptz default now()
);

-- 2. WORKOUTS
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  type text not null check (type in ('push', 'pull', 'legs')),
  completed boolean default false,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- 3. LEAGUES
create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamptz default now()
);

-- 4. LEAGUE MEMBERS
create table if not exists public.league_members (
  user_id uuid references public.users(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (user_id, league_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.users enable row level security;
alter table public.workouts enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Users: solo leer/editar tu propio perfil
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Workouts: solo tu propio
create policy "workouts_select_own" on public.workouts
  for select using (auth.uid() = user_id);

create policy "workouts_insert_own" on public.workouts
  for insert with check (auth.uid() = user_id);

create policy "workouts_update_own" on public.workouts
  for update using (auth.uid() = user_id);

-- Leagues: cualquiera puede leer (para unirse con código)
create policy "leagues_select_all" on public.leagues
  for select using (true);

create policy "leagues_insert_auth" on public.leagues
  for insert with check (auth.uid() is not null);

-- League members: leer todos los de una liga que tú perteneces; insertar propio
create policy "league_members_select" on public.league_members
  for select using (
    auth.uid() = user_id
    or league_id in (
      select league_id from public.league_members where user_id = auth.uid()
    )
  );

create policy "league_members_insert_own" on public.league_members
  for insert with check (auth.uid() = user_id);

-- Para ranking: necesitamos leer otros users que estén en la misma liga
-- Añadimos política para leer users de compañeros de liga
create policy "users_select_leaguemates" on public.users
  for select using (
    id in (
      select lm.user_id from public.league_members lm
      where lm.league_id in (
        select league_id from public.league_members where user_id = auth.uid()
      )
    )
  );
