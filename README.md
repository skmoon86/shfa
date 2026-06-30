# 🍃 동물의 숲 도감 · 컬렉션 웹앱

모여봐요 동물의 숲(New Horizons) **도감 · 컬렉션(아이템/DIY 레시피) · 주민 정보**를
조회하고, 로그인하여 진행상황을 저장하는 웹앱입니다.

- **데이터**: [Nookipedia API](https://api.nookipedia.com/) 실시간 연동
- **인증/DB**: Supabase (Google 로그인 + Postgres + Edge Functions)
- **프론트엔드**: React + Vite + TypeScript + Tailwind + TanStack Query
- **API 키 보안**: Edge Function 프록시가 Nookipedia 키를 서버에 숨김

## 주요 기능
- **도감**: 물고기/곤충/해산물/화석/미술품 — 채집·기증 체크, 진행률, 반구·현재 시즌 필터, 판매가
- **아이템 컬렉션**: 가구/의류/실내장식/도구/잡화/사진/자이로이드 — 구매가·판매가, **가구 리폼 정보**(필요 키트·색상/패턴 변형 갤러리), 보유/위시리스트
- **DIY 레시피**: 재료·입수처·습득 체크·습득률, 재료 합산 계산기
- **주민**: 성격·생일·취향, **호감 선물 추정**(호감 스타일/색상 매칭), **성격별 레시피**, 즐겨찾기
- **홈 대시보드**: 카테고리별 진행률 요약

---

## 디렉토리
```
fa/
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/0001_init.sql          # 테이블 + RLS
│  └─ functions/nookipedia-proxy/index.ts  # Nookipedia 프록시(Deno)
└─ web/                                  # React + Vite 프론트엔드
```

---

## 셋업

### 0. 사전 준비
- Node.js 20+ / npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase ...` 로 사용 가능, 로컬 실행 시 Docker 필요)
- **Nookipedia API 키**: [발급 신청](https://api.nookipedia.com/) (폼/Discord)

### 1. Supabase 프로젝트 생성
1. https://supabase.com 에서 무료 프로젝트 생성
2. **Project Settings → API** 에서 `Project URL`, `anon public key` 복사
3. **Authentication → Providers → Google** 활성화
   - Google Cloud Console에서 OAuth 클라이언트 ID/시크릿 발급
   - 승인된 리디렉션 URI에 `https://<project>.supabase.co/auth/v1/callback` 추가
   - 발급한 ID/Secret을 Supabase Google provider에 입력

### 2. DB 마이그레이션 적용
```bash
npx supabase login            # 대화형 로그인 (! 로 실행)
npx supabase link --project-ref <YOUR-PROJECT-REF>
npx supabase db push          # 0001_init.sql 적용
```

### 3. Edge Function 배포 + 키 등록
```bash
# Nookipedia 키를 secret으로 등록 (클라이언트에 노출되지 않음)
npx supabase secrets set NOOKIPEDIA_API_KEY=<발급받은-키>

# 프록시 함수 배포
npx supabase functions deploy nookipedia-proxy
```

### 4. 프론트엔드 환경변수
`web/.env` 파일 생성 (`web/.env.example` 참고):
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_NOOKIPEDIA_FN=nookipedia-proxy
```

### 5. 실행
```bash
cd web
npm install
npm run dev        # http://localhost:5173
```

---

## 로컬 전체 스택(선택, Docker 필요)
```bash
npx supabase start                       # 로컬 Postgres/Auth/Storage
npx supabase functions serve nookipedia-proxy --env-file ./supabase/.env.local
# web/.env 의 URL/KEY 를 supabase start 출력값으로 교체 후 npm run dev
```
> `--env-file` 에 `NOOKIPEDIA_API_KEY=...` 를 넣어 로컬에서도 프록시가 동작합니다.

## 배포
- **프론트엔드**: Vercel / Cloudflare Pages / Netlify (빌드 명령 `npm run build`, 출력 `web/dist`).
  배포 후 도메인을 Supabase Auth의 **Redirect URLs**에 추가하세요.
- **백엔드**: 위 3단계(`db push` + `functions deploy`)로 Supabase에 반영.

---

## 보안 메모
- 모든 사용자 데이터 테이블은 **RLS**로 본인 행만 접근 가능합니다.
- `anon key`는 공개되어도 안전합니다(RLS 전제).
- Nookipedia 키는 **Edge Function secret**에만 존재하며 클라이언트 번들에 포함되지 않습니다.
- 무료 Supabase 프로젝트는 **7일 미사용 시 일시정지**됩니다. 필요 시 `pg_cron` heartbeat로 방지하세요.

## 데이터 출처 / 참고
- Nookipedia API: https://api.nookipedia.com/
- 성격별 레시피(`web/src/data/villagerRecipes.ts`)는 Nookipedia 위키와 커뮤니티 연구 기반의
  **대표 시드**이며 자유롭게 보완할 수 있습니다. (Nookipedia API에는 성격↔레시피 매핑이 없습니다.)
- **날씨 예측**(`web/src/lib/weather/`)은 **MeteoNook**의 알고리즘을 옮긴 것입니다.
  MeteoNook © 2020 Ash Wolf ("Ninji"), https://github.com/Treeki/MeteoNook (AGPL-3.0).

---

## 라이선스
- 이 저장소는 **GNU Affero General Public License v3.0 (AGPL-3.0)** 으로 배포됩니다 — 루트 [`LICENSE`](./LICENSE) 참조.
- 날씨 기능(`web/src/lib/weather/`)이 AGPL-3.0인 [MeteoNook](https://github.com/Treeki/MeteoNook)(© Ash Wolf)의
  파생물이므로, 이를 포함하는 본 저작물 전체가 AGPL-3.0를 따릅니다.
- AGPL §13에 따라 네트워크로 제공되는 앱(날씨 페이지)에 **소스 코드 안내 링크**를 표시합니다.
