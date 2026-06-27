# CLAUDE.md

모여봐요 동물의 숲(ACNH) **도감 · 컬렉션 · 주민** 웹앱. 이 파일은 작업 시 반드시 참고.

## ⭐ 절대 규칙
- **모든 명칭은 한글로 표시한다.** 새 화면·필드를 추가할 때 영어가 노출되면 안 됨.
  - 고유 이름(생물·아이템·주민·레시피): `web/public/ko/<category>.json` 슬림맵 + `useKoNames`/`useKoNamesMulti` 훅.
  - 열거형 값(종·성별·별자리·취미·스타일·색상·월·서식지·그림자·테마·아이템 카테고리): `web/src/i18n/terms.ts`.
  - 입수처(`availability.from`)·비고(`note`): `web/src/i18n/ko.ts`의 `sourceLabel`/`tSource`, `noteLabel`/`tNote`.
  - 매핑에 없으면 영어로 폴백되므로, 새 값이 보이면 해당 사전에 추가.
- **시크릿을 커밋하지 말 것.** `E:\fa\웹서비스관련정보.txt`(URL/키/비번/토큰)와 `**/.env`는 `.gitignore`로 제외됨. CLAUDE.md·코드에 키를 적지 말 것(anon key 제외 — 공개 안전).

## 스택 / 구조
- 프론트: **React + Vite + TS + Tailwind + TanStack Query + React Router** (`web/`)
- 백엔드: **Supabase** (Auth=Google OAuth, Postgres+RLS, Edge Functions)
- 데이터: **Nookipedia API** (Edge Function 프록시 경유, 키 숨김 + 캐시)
- 한글 이름: **Norviah/animal-crossing** 데이터(`translations.kRko`)에서 추출

```
web/                         프론트엔드 (Vercel 배포, Root Directory = web)
  src/lib/        supabase.ts(클라이언트), nookipedia.ts(타입+프록시 호출), format.ts
  src/hooks/      useProgress.ts(진행상황 CRUD), useKoNames.ts(한글맵)
  src/i18n/       ko.ts(UI라벨+sourceLabel), terms.ts(열거형 한글 사전)
  src/components/ Layout, Sheet(바텀시트), ItemDetailModal, VillagerDetailModal …
  src/pages/      Home, Critterpedia, Items, Recipes, Villagers
  src/data/       villagerRecipes.ts(성격→레시피 시드)
  public/ko/      *.json 한글 이름 슬림맵 (gen-ko.mjs 산출물, 커밋함)
supabase/
  migrations/0001_init.sql           테이블+RLS
  functions/nookipedia-proxy/index.ts  프록시(재시도+stale 캐시 폴백)
scripts/gen-ko.mjs            한글맵 생성 스크립트
```

## 명령어
```bash
# 프론트
cd web && npm install
npm run dev            # http://localhost:5173
npm run build          # tsc -b && vite build (타입체크 포함 — 변경 후 항상 실행)

# 한글 이름 맵 재생성 (게임 업데이트/누락 보강 시)
node scripts/gen-ko.mjs

# PWA 아이콘 PNG 재생성 (web/public/icon-source.jpg 교체 시)
cd web && node scripts/gen-icons.mjs   # sharp 사용. 원본 정사각 jpg를 각 사이즈로 리사이즈, 산출물(pwa-*.png) 커밋함

# Supabase (로그인은 PAT 필요: supabase login --token <PAT>)
SUPABASE_ACCESS_TOKEN=<PAT> supabase functions deploy nookipedia-proxy
supabase db push --password <DB비번>
```
- 배포: 프론트는 **GitHub push → Vercel 자동 재배포**. 백엔드는 위 supabase 명령.
- Vercel 환경변수(필수): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_NOOKIPEDIA_FN`.
  ⚠️ Vite env는 **빌드 시 번들에 박힘** — env 추가/변경 후 반드시 재배포(캐시 없이).

## Nookipedia API 주의 (비자명·실수 잦음)
- **주민**: `/villagers?game=NH&nhdetails=true` — NH 전용 `/nh/` 아래가 아님. 프록시 화이트리스트에 `villagers` top-level 별도 허용.
- **화석**: `/nh/fossils/all` (그룹 배열 → 개별 조각 평탄화). `/nh/fossils`·`/nh/fossil_groups`는 404.
- **출현 시기 필드**(생물): `north`/`south` 객체 없음. 실제는 `availability_north/south`(배열 `{months,time}`), `n_availability_array/s_availability_array`(월 번호), `times_by_month_*`. 월/시간은 **축약형**("May – Oct") — `fmtMonths`/`fmtTime`로 한글화.
- **카테고리 값 대소문자 혼재**: furniture에 `Wall-Mounted`와 `Wall-mounted` 둘 다 존재 → `tr`은 대소문자 무시 매칭.
- **그림/미술품**: furniture 데이터에도 포함 — 위작만 `(fake)` 접미사, 진품은 접미사 없음(`(real)` 접미사는 실데이터에 없음). 위작 존재 여부는 `/nh/art`의 `has_fake`로 판별(이름만으론 일반 가구와 구분 불가). 아이템 페이지는 위작 행 제외 + 위작 없는 명화에 "(위작없음)" 표기. furniture 한글맵에 Artwork 시트 포함.
- **대용량/불안정**: furniture(3.6MB) 등 대용량 엔드포인트는 Nookipedia가 간헐적으로 502/504. 프록시가 재시도+만료캐시 폴백, 페이지는 일부 실패해도 정상분만 표시.

## 데이터 모델 (Postgres, 모두 RLS = 본인 행만)
`profiles`, `critterpedia_progress(user_id,category,entry_id,caught,donated)`, `recipe_progress`, `item_collection(owned,wishlist)`, `favorite_villagers`, `villager_photos`(액자 획득), `nook_cache`(Edge Function 전용). entry_id/item_id/recipe_id/villager_id = 영문 name.

## PWA / 안드로이드 APK(TWA)
- 앱은 **PWA**. `vite-plugin-pwa`(generateSW)가 `manifest.webmanifest`+`sw.js` 생성, 매니페스트/SW 등록은 `index.html`에 자동 주입(별도 import 코드 없음).
- 매니페스트·SW 설정은 `web/vite.config.ts`. 아이콘은 `web/public/pwa-{192,512}.png`+`pwa-maskable-512.png`(원본 `icon-source.jpg`(너굴 얼굴, 풀블리드)를 리사이즈).
- 프리캐시: 빌드 자산+`ko/*.json`(오프라인 한글 이름). 런타임 캐시: 이미지(생물·아이템)만 CacheFirst. **Supabase/인증 응답은 캐시 안 함**.
- **APK 생성(TWA)**: 배포된 Vercel URL을 **PWABuilder.com**에 입력 → Android 패키지 다운로드(안드로이드 스튜디오 불필요). TWA는 내부적으로 Chrome을 써서 **구글 OAuth 그대로 작동**(WebView 래퍼인 Capacitor는 OAuth 차단되어 부적합).
- 주소창 제거하려면 서명키 SHA-256 지문으로 `assetlinks.json` 만들어 `web/public/.well-known/assetlinks.json`에 두고 배포(도메인 소유 확인).

## 알려진 한계
- **주민 대사·말버릇**: 무료 데이터에 한국어가 없어 미표시(영어 노출 방지). 한국어 데이터셋 확보 시 추가 가능.
- **성격별 레시피**(`villagerRecipes.ts`): 위키 기반 대표 시드. 실제 존재하는 레시피만 한글로 표시. 정확도 높이려면 시드 보강.
- **무료 Supabase**: 7일 미사용 시 일시정지(필요 시 pg_cron heartbeat).

## 작업 컨벤션
- 변경 후 `cd web && npm run build`로 타입/빌드 검증.
- 커밋 메시지는 한국어. push는 skmoon86 계정으로(원격 URL에 사용자명 포함: `https://skmoon86@github.com/...`) → Vercel 자동 배포.
- **DB 마이그레이션은 Claude가 직접 적용**: 마이그레이션 추가 후 `supabase db push --password <DB비번>` 실행(비번은 `웹서비스관련정보.txt`). 사용자에게 미루지 말 것. 마이그레이션 SQL은 재실행 가능하게 멱등(`if not exists`, `drop policy if exists`)으로 작성.

---

## 최근 작업 기록 — 2026-06-27 (resume point)

> **배포 반영 = `main`.** Vercel Production은 `main` 브랜치를 빌드한다(`feature/six-features-rewrite`는 Preview). 작업 후 반드시 `main`에 올려야 사용자에게 보인다.
> **⚠️ 작업 폴더 함정:** Claude Code 세션 기본 cwd가 `E:\mail\HMS`(무관한 메일 프로젝트)일 수 있다. 이 저장소 명령은 **반드시 `E:\fa`를 대상**으로 — `cd /e/fa && …` 또는 `git -C E:/fa …`. (예: `git -C E:/fa push origin main`)
> 현재 `main` == `feature/six-features-rewrite` == `8116ee8`(원격 동기화 완료).

### 이번 라운드에 한 일 (요청 7건 + 버그수정)
1. **아이템 이벤트 필터 재구성** — `src/lib/itemBuckets.ts`: `EventKey`/`EVENT_ORDER`(지정 33종 순서)/`itemEventLabel` 재정의. `eventOf(row, recipeMats)`가 `availability(from/note)` + `item_series` + 이름 + **제작 레시피 재료**(시즌 판정)까지 종합. `ItemsPage`의 '이벤트' 드롭다운은 `EVENT_ORDER` 전체를 고정 순서로 노출.
2. **DIY 입수처 필터 재구성** — 신규 `src/lib/recipeCats.ts`: `RECIPE_CAT_ORDER`(지정 36종)/`recipeCatLabel`/`recipeCatOf(recipe)`. `RecipesPage`의 입수처 드롭다운을 이걸로 교체(종류 탭 `RECIPE_CATS`는 유지). 빈 카테고리(불꽃축제/NPC:레온·저스틴·엄마)는 데이터에 레시피가 0건이라 비어 있음(정상).
3. **모형 제외 버그 수정**(누락 아이템) — `itemBuckets.ts` `isModelRow`: 기존엔 from=C.J./Flick면 전부 제외 → **곤충채집대회(Bug-Off)·낚시대회(Fishing Tourney) 보상 가구(개미집·생선 건조대 등)까지 사라짐**. 이제 `note`가 `"Trade in …"`인 진짜 모형 160개만 제외.
4. **캘린더 이벤트 아이콘** — `ko.ts` `eventIcon(raw)`: 시작 ▶️/종료 ◀️, 낚시 🎣, 곤충 🪲, 봄🌸·여름☀️·가을🍁·겨울⛄. `CalendarPage`/`HomePage`/`MonthCalendar`(DayMark.eventIcon) 적용.
5. **할일 날짜 스코프** — 직접추가 todo는 추가한 날짜에만 노출. `migrations/0005_todo_date.sql`(todos에 `the_date` 컬럼 + 백필 + 인덱스, **원격 적용 완료**), `useTodos(iso)`가 `the_date`로 저장·조회. 프리셋(자동등록)은 날짜무관 유지.
6. **오늘 할일 '돈나무 심기' 추가** — `data/todoPresets.ts` `TODO_PRESETS`.
7. **신규 프리셋 사라짐 버그 수정** — `enabledPresets`(허용목록)에 없는 신규 프리셋이 prefs 로드 후 필터링돼 '나왔다 사라짐'. `todoPresets.ts`에 `LEGACY_PRESETS`(도입 당시 8종) 추가, `TodoList`의 `visiblePresets`는 *레거시 외(신규) 프리셋은 허용목록과 무관하게 항상 노출*. (제약: 레거시 허용목록 사용자는 신규 프리셋을 ⚙️로 숨길 수 없음 — 추후 denylist 전환 시 해소.)
8. **이름 매핑 수정** — `ko.ts` `sourceLabel`: `'Pavé'→'베르리나'`, `Niko→'해피홈 파라다이스'`(기존 파베/니코 오표기).
9. **영문 노출 한글명 162건 보강** — `public/ko/{furniture,clothing,interior,items,tools,photos}.json`에 레고/젤다/스플래툰/호텔/닌텐도 콘솔 등 추가.

### 누락 아이템 진단 결론 (중요)
- 실데이터 대조 결과 **사과·체리(과일)·침엽수 묘목·버섯·나뭇가지 등 '수집 가능한 형태'는 Nookipedia API에 있고 새 코드에서 정상 표시**(사과=음식 카테고리, 음식 총 32종 중 포함). 안 보였던 건 프로덕션이 옛 버전이었거나 PWA 캐시 때문.
- **진짜 누락 = '심어진 형태'**: `cedar tree`(침엽수 나무)·`apple tree`(사과나무)·꽃 모종(`*-rose plant` 등 ~40)·관목(`*bush` ~15)은 **Nookipedia API에 아예 없음**(게임 내 도감 수집 대상도 아님). `public/ko/items.json`엔 한글명이 있으나 API가 안 줘서 표시 불가.
- 진단 방법: `web/.env` 읽어 프록시(`/functions/v1/<fn>/nh/...`) 호출 → `public/ko/*.json` 키와 대조(스크래치패드 노드 스크립트). 모형/위작 제외 로직은 `classify` 참조.

### 남은 일 / TODO
- [ ] **프로덕션에서 사과·체리 표시 최종 확인**: 프로덕션이 새 코드(main 8116ee8)인데도 안 보이면 원인은 **PWA 서비스워커 캐시**. F12→Application→Service workers→Unregister + Storage→Clear site data 후 재확인. (코드/데이터상으로는 정상.)
- [ ] **(선택) '심어진 형태' 자연물 추가**: 침엽수 나무·사과나무·꽃 모종·관목 등을 보여주려면 별도 번들 데이터(`public/data/extra-items.json` 등) 필요 — Nookipedia에 없어 이미지 수집이 관건. 사용자 결정 대기.
- 참고: ESLint는 기존부터 일부 규칙 위반(예: `[...selected].join(',')` deps, `a ? b : c` 표현식 statement) 존재 — 이번 작업이 새로 만든 건 아님. `npm run build`(tsc)는 통과.
