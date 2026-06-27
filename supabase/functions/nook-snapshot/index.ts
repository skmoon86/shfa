// Nookipedia 스냅샷 적재 함수 (Supabase Edge Function, Deno)
//
// 역할:
//  - 로그인 사용자가 "데이터 갱신" 버튼을 누르면 호출된다.
//  - 엔드포인트 1개를 Nookipedia에서 받아 오염검사 후 nook_dataset 테이블에 upsert.
//  - 클라이언트는 평소 nook_dataset을 직접 읽으므로 Nookipedia를 매번 치지 않는다.
//
// 호출: /functions/v1/nook-snapshot?endpoint=<cat>[&year=YYYY]
//   - endpoint: fish|bugs|sea|fossils|art|recipes|villagers|furniture|clothing|
//               interior|items|tools|photos|gyroids|events
//   - events는 year 필수 → 저장 키는 'events:<year>'
//
// 게이팅: Authorization 토큰이 "로그인 사용자"여야 한다(anon 키는 거부 = 401).
//
// 필요한 secret(기존 nookipedia-proxy와 동일):
//  - NOOKIPEDIA_API_KEY
//  - SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (Supabase 자동 주입)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOOKIPEDIA_BASE = 'https://api.nookipedia.com'
const ACCEPT_VERSION = '1.0.0'

// 적재 가능한 엔드포인트(클라이언트 nookipedia.ts의 키와 일치)
const ALLOWED = new Set([
  'fish', 'bugs', 'sea', 'fossils', 'art', 'recipes', 'villagers',
  'furniture', 'clothing', 'interior', 'items', 'tools', 'photos', 'gyroids', 'events',
])

// ── 오염(잘림/카테고리 불일치) 검사 — nookipedia-proxy와 동일 로직 ──
const MIN_LIST_LEN = 5
function isDegenerateList(data: unknown): boolean {
  return Array.isArray(data) && data.length < MIN_LIST_LEN
}
const MIN_COUNTS: Record<string, number> = {
  'nh/recipes': 300, 'nh/items': 250, 'nh/furniture': 1500, 'nh/clothing': 1000,
  'nh/interior': 400, 'nh/photos': 500, 'nh/tools': 80, 'nh/gyroids': 20,
  'nh/fish': 60, 'nh/bugs': 60, 'nh/sea': 30, 'nh/art': 30,
}
function isTruncatedList(endpointPath: string, data: unknown): boolean {
  const min = MIN_COUNTS[endpointPath]
  if (min == null || !Array.isArray(data)) return false
  return data.length < min
}
const FOREIGN_SIGNATURES: Record<string, string[]> = {
  'nh/items': ['sound', 'cyrus_price'],
  'nh/gyroids': ['edible', 'is_fence', 'material_type'],
  'nh/tools': ['sound', 'edible', 'cyrus_price'],
}
function isWrongShapeList(endpointPath: string, data: unknown): boolean {
  const foreign = FOREIGN_SIGNATURES[endpointPath]
  if (!foreign || !Array.isArray(data) || data.length === 0) return false
  const first = data[0]
  if (!first || typeof first !== 'object') return false
  const has = (k: string) => Object.prototype.hasOwnProperty.call(first, k)
  return foreign.some(has)
}
const EXPECTED_CATEGORIES: Record<string, Set<string>> = {
  'nh/clothing': new Set([
    'tops', 'bottoms', 'dress-up', 'headwear', 'accessories',
    'socks', 'shoes', 'bags', 'umbrellas', 'other',
  ]),
  'nh/interior': new Set(['wallpaper', 'floors', 'rugs']),
  'nh/furniture': new Set(['housewares', 'miscellaneous', 'wall-mounted', 'ceiling decor']),
  'nh/photos': new Set(['photos', 'posters']),
}
function isMislabeledList(endpointPath: string, data: unknown): boolean {
  const expected = EXPECTED_CATEGORIES[endpointPath]
  if (!expected || !Array.isArray(data) || data.length === 0) return false
  const cats = data
    .map((x) => String((x as { category?: string })?.category ?? '').toLowerCase().trim())
    .filter(Boolean)
  if (cats.length === 0) return false
  const bad = cats.filter((c) => !expected.has(c)).length
  return bad > cats.length / 2
}
function isContaminated(endpointPath: string, data: unknown): boolean {
  return (
    isDegenerateList(data) ||
    isTruncatedList(endpointPath, data) ||
    isMislabeledList(endpointPath, data) ||
    isWrongShapeList(endpointPath, data)
  )
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}
function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extra },
  })
}

// 화석은 그룹 응답을 개별 조각으로 평탄화(클라이언트가 받던 모양과 동일)
interface FossilPieceRaw {
  name: string; url?: string; image_url?: string; sell?: number
  width?: number; length?: number; colors?: string[]
}
interface FossilGroupRaw { name: string; fossils?: FossilPieceRaw[] }
function flattenFossils(groups: FossilGroupRaw[]): unknown[] {
  return groups.flatMap((g) =>
    (g.fossils ?? []).map((f) => ({
      name: f.name, url: f.url, image_url: f.image_url, sell: f.sell,
      fossil_group: g.name, width: f.width, length: f.length, colors: f.colors,
    })),
  )
}

const apiKey = Deno.env.get('NOOKIPEDIA_API_KEY') ?? ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null

// Nookipedia 호출(5xx 재시도 + 타임아웃). 실패 시 null.
async function fetchUpstream(path: string): Promise<{ payload: unknown | null; status: number }> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let lastStatus = 0
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const upstream = await fetch(`${NOOKIPEDIA_BASE}/${path}`, {
        headers: { 'X-API-KEY': apiKey, 'Accept-Version': ACCEPT_VERSION, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      })
      if (upstream.ok) return { payload: await upstream.json(), status: 200 }
      lastStatus = upstream.status
      if (upstream.status < 500) return { payload: null, status: upstream.status }
    } catch (_e) {
      lastStatus = 599
    }
    if (attempt < 1) await sleep(800)
  }
  return { payload: null, status: lastStatus }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!apiKey) return json({ error: 'NOOKIPEDIA_API_KEY 가 설정되지 않았습니다.' }, 500)
  if (!admin) return json({ error: '서버 설정 오류(service role).' }, 500)

  // ── 게이팅: 로그인 사용자만 ──
  const authHeader = req.headers.get('Authorization') ?? ''
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return json({ error: '로그인이 필요합니다.' }, 401)

  const url = new URL(req.url)
  const endpoint = (url.searchParams.get('endpoint') ?? '').toLowerCase().trim()
  if (!ALLOWED.has(endpoint)) {
    return json({ error: `허용되지 않은 endpoint: ${endpoint}` }, 400)
  }

  // 엔드포인트 → 업스트림 경로 + 저장 키 + 오염검사용 경로
  let upstreamPath: string
  let storeKey: string
  let guardPath: string // isContaminated에 쓰는 경로(MIN_COUNTS 등 매칭용)
  if (endpoint === 'fossils') {
    upstreamPath = 'nh/fossils/all'; storeKey = 'fossils'; guardPath = 'nh/fossils'
  } else if (endpoint === 'villagers') {
    upstreamPath = 'villagers?game=NH&nhdetails=true'; storeKey = 'villagers'; guardPath = 'villagers'
  } else if (endpoint === 'events') {
    const year = (url.searchParams.get('year') ?? '').trim()
    if (!/^\d{4}$/.test(year)) return json({ error: 'events 는 year(YYYY)가 필요합니다.' }, 400)
    upstreamPath = `nh/events?year=${year}`; storeKey = `events:${year}`; guardPath = 'nh/events'
  } else {
    upstreamPath = `nh/${endpoint}`; storeKey = endpoint; guardPath = `nh/${endpoint}`
  }

  // 업스트림 호출
  const { payload, status } = await fetchUpstream(upstreamPath)
  if (payload === null) {
    return json({ endpoint: storeKey, error: `Nookipedia 일시 오류(${status}).` }, 502)
  }
  if (isContaminated(guardPath, payload)) {
    return json({ endpoint: storeKey, error: '응답이 비정상(잘림/오염)이라 저장하지 않았습니다. 잠시 후 다시 시도하세요.' }, 502)
  }

  // 정규화 + 저장
  const data = endpoint === 'fossils' ? flattenFossils(payload as FossilGroupRaw[]) : payload
  const count = Array.isArray(data) ? data.length : 0
  const fetched_at = new Date().toISOString()
  const { error } = await admin
    .from('nook_dataset')
    .upsert({ endpoint: storeKey, data, count, fetched_at })
  if (error) return json({ endpoint: storeKey, error: `저장 실패: ${error.message}` }, 500)

  return json({ endpoint: storeKey, count, fetched_at })
})
