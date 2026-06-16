-- ── 아이템 숨김 처리 ──────────────────────────────────────
-- 컬렉션에서 보고 싶지 않은 아이템을 숨긴다. 숨긴 항목은 목록/카운트에서 제외.
alter table public.item_collection
  add column if not exists hidden boolean not null default false;
