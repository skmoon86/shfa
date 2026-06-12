-- ── 주민 액자(사진) 획득 ──────────────────────────────────
-- 친밀도 최대 시 주민에게 받는 액자(사진)를 획득한 주민 기록.
create table if not exists public.villager_photos (
  user_id      uuid not null references auth.users (id) on delete cascade,
  villager_id  text not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, villager_id)
);

alter table public.villager_photos enable row level security;
drop policy if exists "본인 액자 전체접근" on public.villager_photos;
create policy "본인 액자 전체접근" on public.villager_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
