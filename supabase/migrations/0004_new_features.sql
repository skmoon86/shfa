-- ── 6대 기능 재작성: 주민 3상태 · 환경설정 · To-do · 모형 ──
-- 모든 사용자 테이블 RLS = 본인 행만. 멱등(재실행 가능).

-- ── 도감: 모형(저스틴/레온 주문 제작) 보유 컬럼 추가 ───────
-- 물고기·곤충 카드의 3번째 상태. 화석·미술품·해산물엔 미사용.
alter table public.critterpedia_progress
  add column if not exists model boolean not null default false;

-- ── 주민 3상태(거주/위시/액자) ────────────────────────────
create table if not exists public.villager_state (
  user_id     uuid not null references auth.users (id) on delete cascade,
  villager_id text not null,
  resident    boolean not null default false,
  wish        boolean not null default false,
  photo       boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, villager_id)
);

alter table public.villager_state enable row level security;
drop policy if exists "본인 주민상태 전체접근" on public.villager_state;
create policy "본인 주민상태 전체접근" on public.villager_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 기존 데이터 백필(멱등): favorite_villagers→resident, villager_photos→photo
insert into public.villager_state (user_id, villager_id, resident)
  select user_id, villager_id, true from public.favorite_villagers
  on conflict (user_id, villager_id) do update set resident = true;

insert into public.villager_state (user_id, villager_id, photo)
  select user_id, villager_id, true from public.villager_photos
  on conflict (user_id, villager_id) do update set photo = true;

-- ── 사용자 환경설정(반구/프리셋 표시) ─────────────────────
create table if not exists public.user_prefs (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  hemisphere      text not null default 'north',
  enabled_presets jsonb not null default '[]'::jsonb,
  updated_at      timestamptz not null default now()
);

alter table public.user_prefs enable row level security;
drop policy if exists "본인 환경설정 전체접근" on public.user_prefs;
create policy "본인 환경설정 전체접근" on public.user_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── To-do: 직접 추가 미션 ─────────────────────────────────
create table if not exists public.todos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  sort_order int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;
drop policy if exists "본인 todo 전체접근" on public.todos;
create policy "본인 todo 전체접근" on public.todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── To-do: 날짜별 완료 기록 ───────────────────────────────
-- task_key = 'preset:<명>' | 'todo:<uuid>'. 날짜별 행 → 날짜 전환 시 자동 리셋.
create table if not exists public.todo_completions (
  user_id    uuid not null references auth.users (id) on delete cascade,
  the_date   date not null,
  task_key   text not null,
  done       boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, the_date, task_key)
);

alter table public.todo_completions enable row level security;
drop policy if exists "본인 todo완료 전체접근" on public.todo_completions;
create policy "본인 todo완료 전체접근" on public.todo_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
