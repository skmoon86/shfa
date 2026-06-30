-- ── 날씨 기능: 섬 날씨 시드 저장 ──────────────────────────
-- user_prefs 에 weather_seed 컬럼 추가(멱등). RLS는 기존 본인행 정책으로 충분.
-- 시드는 0 ~ 2147483647(31비트) 범위의 섬 고정값. NULL = 미설정.
alter table public.user_prefs
  add column if not exists weather_seed bigint;
