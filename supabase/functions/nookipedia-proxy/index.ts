// Nookipedia API 프록시 (Supabase Edge Function, Deno)
//
// 역할:
//  - API 키(X-API-KEY)를 서버 secret에 보관해 클라이언트 노출 방지
//  - nook_cache 테이블에 TTL 캐싱하여 Nookipedia rate-limit 보호
//  - 허용된 엔드포인트만 통과시키는 화이트리스트
//
// 호출 경로: /functions/v1/nookipedia-proxy/nh/<category>[/<name>]?<params>
//
// 필요한 secret:
//  - NOOKIPEDIA_API_KEY            : Nookipedia 발급 키
//  - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY : (Supabase가 자동 주입)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOOKIPEDIA_BASE = 'https://api.nookipedia.com'
const ACCEPT_VERSION = '1.0.0'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7일

// 허용 NH 카테고리(/nh/<category>)
const ALLOWED_NH = new Set([
  'fish',
  'bugs',
  'sea',
  'fossils',
  'art',
  'recipes',
  'furniture',
  'clothing',
  'interior',
  'items',
  'tools',
  'photos',
  'gyroids',
  'events',
])
// nh 아래가 아닌 게임 공통 엔드포인트
const ALLOWED_TOP = new Set(['villagers'])

// Nookipedia 목록 엔드포인트 누락 보정: 단건 조회로는 존재하나 목록에서 빠진 아이템.
// 업스트림이 수정되면 이미 목록에 있으므로 자동으로 무시된다.
const LIST_PATCHES: Record<string, string[]> = {
  'nh/tools': ['yellow balloon'],
}

// 정상 목록 엔드포인트(fish/sea/items 등)는 항상 수십 개 이상을 반환한다.
// 비정상적으로 짧은 배열은 업스트림 일시 오류로 잘린 응답으로 간주해
// 캐시에 저장하지도, 신선 캐시로 제공하지도 않는다(7일짜리 오염 방지).
// 단건 조회(nh/fish/<name>)는 객체를 반환하므로 이 판정에 걸리지 않는다.
const MIN_LIST_LEN = 5
function isDegenerateList(data: unknown): boolean {
  return Array.isArray(data) && data.length < MIN_LIST_LEN
}

// 엔드포인트별 정상 최소 개수. 업스트림 일시 오류로 '잘린' 응답(예: recipes는
// 924개여야 하나 73개만 캐시된 사례)을 전역 MIN_LIST_LEN(5)으로는 못 잡으므로
// 별도 하한을 둔다. events는 연 단위 호출이라 응답이 작을 수 있어 의도적으로 제외.
const MIN_COUNTS: Record<string, number> = {
  'nh/recipes': 300,
  'nh/items': 250,
  'nh/furniture': 1500,
  'nh/clothing': 1000,
  'nh/interior': 400,
  'nh/photos': 500,
  'nh/tools': 80,
  'nh/gyroids': 20,
  'nh/fish': 60,
  'nh/bugs': 60,
  'nh/sea': 30,
  'nh/art': 30,
}
function isTruncatedList(endpointPath: string, data: unknown): boolean {
  const min = MIN_COUNTS[endpointPath]
  if (min == null || !Array.isArray(data)) return false
  return data.length < min
}

// category 필드가 없는 엔드포인트는 isMislabeledList로 오염을 못 잡는다.
// (예: nh/items 캐시가 자이로이드 데이터로 오염된 사례.) 정상 응답을 잘못
// 차단하지 않도록 '기대 키 누락'이 아니라 '다른 엔드포인트의 고유 키 존재'로 판정.
//  - 자이로이드 고유: sound / cyrus_price
//  - 잡화(items) 고유: edible / is_fence / material_type
const FOREIGN_SIGNATURES: Record<string, string[]> = {
  'nh/items': ['sound', 'cyrus_price'], // items 자리에 자이로이드가 오면
  'nh/gyroids': ['edible', 'is_fence', 'material_type'], // gyroids 자리에 items가 오면
  'nh/tools': ['sound', 'edible', 'cyrus_price'],
}
function isWrongShapeList(endpointPath: string, data: unknown): boolean {
  const foreign = FOREIGN_SIGNATURES[endpointPath]
  if (!foreign || !Array.isArray(data) || data.length === 0) return false
  const first = data[0]
  if (!first || typeof first !== 'object') return false
  const has = (k: string) => Object.prototype.hasOwnProperty.call(first, k)
  return foreign.some(has) // 다른 엔드포인트 고유 키가 있으면 오염
}

// 엔드포인트별 정상 category 값(소문자). 캐시가 다른 엔드포인트 데이터로 오염되면
// (예: nh/clothing 캐시에 interior 데이터가 들어가 Rugs/Wallpaper/Floors가 나오는 사례)
// category가 기대집합을 벗어나므로 감지할 수 있다. category 필드가 없는
// items/tools/gyroids는 대상에서 제외(아래 함수가 자동으로 판정 보류).
const EXPECTED_CATEGORIES: Record<string, Set<string>> = {
  'nh/clothing': new Set([
    'tops', 'bottoms', 'dress-up', 'headwear', 'accessories',
    'socks', 'shoes', 'bags', 'umbrellas', 'other',
  ]),
  'nh/interior': new Set(['wallpaper', 'floors', 'rugs']),
  'nh/furniture': new Set(['housewares', 'miscellaneous', 'wall-mounted', 'ceiling decor']),
  'nh/photos': new Set(['photos', 'posters']),
}

// 응답 배열의 category 값이 해당 엔드포인트의 기대집합을 과반 이탈하면
// 다른 엔드포인트 데이터로 오염된 것으로 보고 신선/저장 대상에서 제외한다.
function isMislabeledList(endpointPath: string, data: unknown): boolean {
  const expected = EXPECTED_CATEGORIES[endpointPath]
  if (!expected || !Array.isArray(data) || data.length === 0) return false
  const cats = data
    .map((x) => String((x as { category?: string })?.category ?? '').toLowerCase().trim())
    .filter(Boolean)
  if (cats.length === 0) return false // category 정보가 없으면 판정 보류
  const bad = cats.filter((c) => !expected.has(c)).length
  return bad > cats.length / 2
}

// 짧은 응답(잘림) · 엔드포인트별 최소개수 미달 · 카테고리 불일치 · 필드 시그니처
// 불일치(다른 엔드포인트로 오염) 통합 판정.
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
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extra },
  })
}

const apiKey = Deno.env.get('NOOKIPEDIA_API_KEY') ?? ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const admin =
  supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET') {
    return json({ error: 'GET만 허용됩니다.' }, 405)
  }
  if (!apiKey) {
    return json({ error: 'NOOKIPEDIA_API_KEY 가 설정되지 않았습니다.' }, 500)
  }

  const url = new URL(req.url)
  // /functions/v1/nookipedia-proxy/nh/<category>/...  →  nh/... 추출
  const marker = '/nookipedia-proxy/'
  const idx = url.pathname.indexOf(marker)
  const subPath =
    idx >= 0 ? url.pathname.slice(idx + marker.length) : url.pathname.replace(/^\/+/, '')

  // 기대 형식: nh/<category>[/<name>]  또는  villagers
  const segments = subPath.split('/').filter(Boolean)
  const isTop = ALLOWED_TOP.has(segments[0])
  const isNh = segments[0] === 'nh' && segments.length >= 2 && ALLOWED_NH.has(segments[1])
  if (!isTop && !isNh) {
    return json(
      { error: '허용되지 않은 경로입니다. (nh/<category> 또는 villagers)' },
      400,
    )
  }

  // 오염(카테고리 불일치) 판정용 경로(쿼리 제외)
  const endpointPath = segments.join('/')

  // 캐시 키 = 경로 + 정렬된 쿼리스트링
  const sortedQuery = [...url.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  const cacheKey = `${segments.join('/')}${sortedQuery ? `?${sortedQuery}` : ''}`

  // 1) 캐시 조회 (TTL 무관하게 읽어두고, 신선하면 즉시 반환·아니면 폴백용 보관)
  let cachedRow: { data: unknown; fetched_at: string } | null = null
  if (admin) {
    const { data: cached } = await admin
      .from('nook_cache')
      .select('data, fetched_at')
      .eq('endpoint', cacheKey)
      .maybeSingle()
    cachedRow = cached ?? null
    if (cachedRow) {
      const age = Date.now() - new Date(cachedRow.fetched_at).getTime()
      // 오염된(짧거나 카테고리 불일치) 캐시는 신선해도 제공하지 않고 재요청해 자가복구한다.
      if (age < CACHE_TTL_MS && !isContaminated(endpointPath, cachedRow.data)) {
        return json(cachedRow.data, 200, { 'X-Cache': 'HIT' })
      }
    }
  }

  // 2) Nookipedia 호출 (5xx/네트워크 오류는 재시도, 대용량 대비 타임아웃 상향)
  const target = `${NOOKIPEDIA_BASE}/${segments.join('/')}${
    sortedQuery ? `?${sortedQuery}` : ''
  }`
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let payload: unknown = null
  let lastStatus = 0
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const upstream = await fetch(target, {
        headers: {
          'X-API-KEY': apiKey,
          'Accept-Version': ACCEPT_VERSION,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(20000),
      })
      if (upstream.ok) {
        payload = await upstream.json()
        break
      }
      lastStatus = upstream.status
      // 4xx는 재시도 의미 없음(404 등) → 중단
      if (upstream.status < 500) {
        const text = await upstream.text()
        return json(
          { error: `Nookipedia ${upstream.status}`, detail: text.slice(0, 300) },
          upstream.status,
        )
      }
    } catch (_e) {
      lastStatus = 599
    }
    if (attempt < 1) await sleep(800)
  }

  // 3) 실패 시: 만료된 캐시라도 있으면 그것을 반환(stale-on-error). 단 오염 캐시는 제외.
  if (payload === null) {
    if (cachedRow && !isContaminated(endpointPath, cachedRow.data)) {
      return json(cachedRow.data, 200, { 'X-Cache': 'STALE' })
    }
    return json(
      { error: `Nookipedia 일시 오류(${lastStatus}). 잠시 후 다시 시도하세요.` },
      503,
    )
  }

  // 3.5) 응답이 오염(짧거나 카테고리 불일치)이면(업스트림 일시 오류 추정):
  //      정상 캐시가 있으면 그것을 반환하고, 오염 방지를 위해 저장하지 않는다.
  if (isContaminated(endpointPath, payload)) {
    if (cachedRow && !isContaminated(endpointPath, cachedRow.data)) {
      return json(cachedRow.data, 200, { 'X-Cache': 'STALE-GUARD' })
    }
    return json(payload, 200, { 'X-Cache': 'BYPASS' })
  }

  // 4) 목록 누락 보정(베스트에포트): 빠진 항목을 단건 조회로 받아 병합
  const missing = LIST_PATCHES[segments.join('/')]
  if (missing && Array.isArray(payload)) {
    const names = new Set(
      (payload as { name?: string }[]).map((it) => (it.name ?? '').toLowerCase()),
    )
    for (const name of missing) {
      if (names.has(name.toLowerCase())) continue
      try {
        const res = await fetch(
          `${NOOKIPEDIA_BASE}/${segments.join('/')}/${encodeURIComponent(name)}`,
          {
            headers: {
              'X-API-KEY': apiKey,
              'Accept-Version': ACCEPT_VERSION,
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          },
        )
        if (res.ok) (payload as unknown[]).push(await res.json())
      } catch (_e) {
        // 보정 실패는 무시 — 원본 목록 그대로 반환
      }
    }
  }

  // 5) 캐시 저장(베스트에포트)
  if (admin) {
    await admin
      .from('nook_cache')
      .upsert({ endpoint: cacheKey, data: payload, fetched_at: new Date().toISOString() })
  }

  return json(payload, 200, { 'X-Cache': 'MISS' })
})
