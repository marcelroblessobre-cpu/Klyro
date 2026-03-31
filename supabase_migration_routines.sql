-- ============================================================
-- KLYRO — Migración: Rutinas personalizadas
-- Ejecuta esto en el SQL Editor de Supabase
-- ============================================================

-- 1. Tabla de rutinas del usuario
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  exercises text[] not null default '{}',
  day_order integer not null default 0,
  estimated_minutes integer not null default 45,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Alterar tabla workouts: añadir campos nuevos si no existen
alter table public.workouts
  add column if not exists routine_id uuid references public.routines(id) on delete set null,
  add column if not exists xp_earned integer default 20,
  add column if not exists difficulty text check (difficulty in ('easy','normal','hard')) default 'normal',
  add column if not exists notes text;

-- La columna 'type' ya existe (push/pull/legs). La dejamos para no romper datos
-- existentes; simplemente dejaremos de usarla para usuarios nuevos.

-- 3. RLS para routines
alter table public.routines enable row level security;

create policy "routines_select_own" on public.routines
  for select using (auth.uid() = user_id);

create policy "routines_insert_own" on public.routines
  for insert with check (auth.uid() = user_id);

create policy "routines_update_own" on public.routines
  for update using (auth.uid() = user_id);

create policy "routines_delete_own" on public.routines
  for delete using (auth.uid() = user_id);

-- 4. Función para updated_at automático
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger routines_updated_at
  before update on public.routines
  for each row execute procedure public.handle_updated_at();
