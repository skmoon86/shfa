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
])
// nh 아래가 아닌 게임 공통 엔드포인트
const ALLOWED_TOP = new Set(['villagers'])

// Nookipedia 목록 엔드포인트 누락 보정: 단건 조회로는 존재하나 목록에서 빠진 아이템.
// 업스트림이 수정되면 이미 목록에 있으므로 자동으로 무시된다.
const LIST_PATCHES: Record<string, string[]> = {
  'nh/tools': ['yellow balloon'],
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
      if (age < CACHE_TTL_MS) {
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

  // 3) 실패 시: 만료된 캐시라도 있으면 그것을 반환(stale-on-error)
  if (payload === null) {
    if (cachedRow) {
      return json(cachedRow.data, 200, { 'X-Cache': 'STALE' })
    }
    return json(
      { error: `Nookipedia 일시 오류(${lastStatus}). 잠시 후 다시 시도하세요.` },
      503,
    )
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
