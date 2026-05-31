-- 동물의 숲 도감/컬렉션 앱 초기 스키마
-- 모든 사용자 데이터 테이블에 RLS 적용: 본인 행만 접근 가능.

-- ── profiles ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);
create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);
create policy "본인 프로필 삽입" on public.profiles
  for insert with check (auth.uid() = id);

-- 신규 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 도감 진행상황 ─────────────────────────────────────────
-- category ∈ ('fish','bugs','sea','fossils','art')
create table if not exists public.critterpedia_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  category   text not null,
  entry_id   text not null,
  caught     boolean not null default false,
  donated    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, category, entry_id)
);

alter table public.critterpedia_progress enable row level security;
create policy "본인 도감 전체접근" on public.critterpedia_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── DIY 레시피 습득 ───────────────────────────────────────
create table if not exists public.recipe_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  recipe_id  text not null,
  learned    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

alter table public.recipe_progress enable row level security;
create policy "본인 레시피 전체접근" on public.recipe_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 아이템 컬렉션(보유/위시리스트) ────────────────────────
-- 유저가 플래그한 항목만 저장.
create table if not exists public.item_collection (
  user_id    uuid not null references auth.users (id) on delete cascade,
  item_id    text not null,
  category   text not null,
  owned      boolean not null default false,
  wishlist   boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.item_collection enable row level security;
create policy "본인 아이템 전체접근" on public.item_collection
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 즐겨찾기 주민 ─────────────────────────────────────────
create table if not exists public.favorite_villagers (
  user_id      uuid not null references auth.users (id) on delete cascade,
  villager_id  text not null,
  note         text,
  created_at   timestamptz not null default now(),
  primary key (user_id, villager_id)
);

alter table public.favorite_villagers enable row level security;
create policy "본인 즐겨찾기 전체접근" on public.favorite_villagers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Nookipedia 응답 캐시 ──────────────────────────────────
-- Edge Function(service_role)만 접근. 클라이언트 직접 접근 차단(정책 없음 + RLS on).
create table if not exists public.nook_cache (
  endpoint   text primary key,
  data       jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.nook_cache enable row level security;
-- 정책을 추가하지 않으므로 anon/authenticated 키로는 접근 불가.
-- service_role 키는 RLS를 우회하므로 Edge Function에서만 읽기/쓰기 가능.
