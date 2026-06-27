-- 0006_nook_dataset.sql
-- Nookipedia 스냅샷 저장본 테이블.
--   - 기존 nook_cache(프록시 전용, service-role만 접근)와 달리, 클라이언트가 직접 읽는다.
--   - 공개 게임 데이터(비밀 아님)이므로 anon/authenticated 모두 SELECT 허용.
--   - 쓰기 정책은 두지 않으므로 service_role(Edge Function `nook-snapshot`)만 기록 가능.
-- 멱등 작성(재실행 가능).

create table if not exists public.nook_dataset (
  endpoint   text primary key,            -- 'fish'…'gyroids', 'villagers', 'events:2026'
  data       jsonb not null,
  count      int  not null default 0,
  fetched_at timestamptz not null default now()
);

alter table public.nook_dataset enable row level security;

drop policy if exists nook_dataset_read on public.nook_dataset;
create policy nook_dataset_read on public.nook_dataset
  for select to anon, authenticated using (true);
-- insert/update/delete 정책 없음 → service_role만 기록(기존 nook_cache와 동일 패턴).
