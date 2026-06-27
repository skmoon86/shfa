-- ── To-do: 직접 추가 미션에 날짜 스코프 추가 ──────────────
-- 직접 추가한 todo 는 추가한 '그 날짜(the_date)'에만 표시(프리셋/자동등록은 날짜무관 유지).
-- 멱등(재실행 가능). 기존 직접추가 항목은 오늘 날짜로 백필.
alter table public.todos
  add column if not exists the_date date;

update public.todos
  set the_date = current_date
  where the_date is null and active = true;

create index if not exists todos_user_date_idx
  on public.todos (user_id, the_date);
