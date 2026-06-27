// 아이템 분류기(순수 함수). 7개 엔드포인트 + Norviah music 데이터를 모아
// 각 행에 버킷(__bucket)과 파생 플래그를 부여한다.
//
// 제외: 사진/포스터(주민용) · 미술품(도감용) · 모형 160(도감 토글용).
// 정규화는 소문자+trim — furniture에 'Wall-Mounted'/'Wall-mounted' 대소문자 혼재 대응.

import type {
  Furniture, Clothing, Interior, Item, Tool, Gyroid, Art, Recipe,
  PriceEntry, Availability, Variation,
} from './nookipedia'

export type Bucket =
  | 'structures' | 'furniture' | 'misc' | 'wallmount'
  | 'interior' | 'clothing' | 'accessories' | 'bagshat'
  | 'food' | 'music' | 'gyroids' | 'other'

// 탭 노출 순서 + 한글 라벨
export const BUCKET_ORDER: Bucket[] = [
  'furniture', 'misc', 'wallmount', 'structures', 'interior',
  'clothing', 'accessories', 'bagshat', 'food', 'music', 'gyroids', 'other',
]
export const bucketLabel: Record<Bucket, string> = {
  structures: '내부구조',
  furniture: '가구',
  misc: '잡화',
  wallmount: '벽걸이·천장',
  interior: '벽지·바닥·러그',
  clothing: '의류',
  accessories: '액세서리',
  bagshat: '가방·모자·신발·우산',
  food: '음식',
  music: '음악',
  gyroids: '토용',
  other: '기타',
}

// 이벤트/시리즈 분류. availability(from/note) + item_series + 이름 + (제작 시)레시피 재료를 종합 판정.
// 아이템 페이지 '이벤트' 드롭다운을 대체. 사용자 지정 33종 + 미매칭은 'etc'(드롭다운 미노출).
export type EventKey =
  | 'valentine' | 'festivale' | 'bunny' | 'mayday' | 'museum' | 'wedding'
  | 'fireworks' | 'halloween' | 'turkey' | 'toyday' | 'countdown'
  | 'cherry' | 'shell' | 'acorn' | 'mushroom' | 'maple' | 'snow' | 'ornament'
  | 'bugoff' | 'fishing' | 'celeste' | 'brewster' | 'gullivarrr' | 'pascal' | 'hotel'
  | 'birthday' | 'mom'
  | 'sanrio' | 'mario' | 'zelda' | 'splatoon' | 'lego' | 'pocketcamp'
  | 'etc'

// 드롭다운 노출 순서(사용자 지정). 'etc'는 목록에서 제외(전체에서만 노출).
export const EVENT_ORDER: EventKey[] = [
  'valentine', 'festivale', 'bunny', 'mayday', 'museum', 'wedding',
  'fireworks', 'halloween', 'turkey', 'toyday', 'countdown',
  'cherry', 'shell', 'acorn', 'mushroom', 'maple', 'snow', 'ornament',
  'bugoff', 'fishing', 'celeste', 'brewster', 'gullivarrr', 'pascal', 'hotel',
  'birthday', 'mom',
  'sanrio', 'mario', 'zelda', 'splatoon', 'lego', 'pocketcamp',
]
export const itemEventLabel: Record<EventKey, string> = {
  valentine: '밸런타인데이', festivale: '카니발', bunny: '이스터(부활절)', mayday: '근로자의 날(메이데이)',
  museum: '국제 박물관의 날', wedding: '웨딩 이벤트', fireworks: '불꽃 축제', halloween: '할로윈',
  turkey: '추수감사절', toyday: '크리스마스', countdown: '새해 카운트다운',
  cherry: '대나무&벚꽃', shell: '여름 조개껍데기', acorn: '도토리&솔방울', mushroom: '버섯',
  maple: '단풍잎', snow: '눈사람', ornament: '오너먼트',
  bugoff: '곤충채집대회', fishing: '낚시대회', celeste: '별똥별 부옥이', brewster: '카페 마스터',
  gullivarrr: '해적 죠니', pascal: '해탈한', hotel: '호텔기념품', birthday: '생일', mom: '엄마',
  sanrio: '산리오', mario: '마리오', zelda: '젤다', splatoon: '스플래툰', lego: '레고', pocketcamp: '포켓캠프',
  etc: '기타',
}

// 음악 데이터맵(music.json) 한 행
export interface MusicEntry {
  ko: string
  buy: number | null
  sell: number | null
  image: string | null
  recipe: unknown
}
export type MusicMap = Record<string, MusicEntry>

// 페이지/모달이 사용하는 통합 행. DetailItem 호환(느슨) + 분류 메타.
export interface ItemRow {
  name: string
  __cat: string // 원본 엔드포인트(ko 조회·저장 카테고리). 'music' 포함
  __bucket: Bucket
  __ko?: string // 음악 등 별도 ko (있으면 우선 사용)
  image_url?: string
  category?: string
  buy?: PriceEntry[]
  sell?: number
  availability?: Availability[]
  variations?: Variation[]
  customizable?: boolean
  variation_total?: number
  themes?: string[]
  styles?: string[]
  custom_kits?: number
  custom_kit_type?: string
  pattern_total?: number
  item_series?: string
  item_set?: string
  function?: string
  grid_width?: number
  grid_length?: number
  // 파생 플래그
  __hasVariation: boolean
  __reformable: boolean
  __hasRecipe: boolean
  __catalogable: boolean
  __event: EventKey
}

// finalize 입력: 플래그를 제외한 행(원본 엔드포인트의 여분 필드는 런타임에 보존됨)
type RawRow = Omit<
  ItemRow,
  '__hasVariation' | '__reformable' | '__hasRecipe' | '__catalogable' | '__event'
>

export interface ClassifyInput {
  furniture: Furniture[]
  clothing: Clothing[]
  interior: Interior[]
  items: Item[]
  tools: Tool[]
  gyroids: Gyroid[]
  music: MusicMap
  art: Art[]
  recipes: Recipe[]
  structureNames: Set<string> // interior-structures.json 키(소문자)
}

export interface ClassifyResult {
  rows: ItemRow[]
  byBucket: Record<Bucket, ItemRow[]>
  modelNames: Set<string> // 제외된 모형 160 (도감 토글 매칭용, 소문자)
}

const norm = (s?: string) => (s ?? '').toLowerCase().trim()

// 모형 160: 저스틴(C.J.)/레온(Flick)에게 "물고기/곤충 3마리 교환"으로 받는 모형.
// 주의: 곤충채집대회(Bug-Off)·낚시대회(Fishing Tourney) 보상 가구도 C.J./Flick에서 오므로,
// from 만으로 제외하면 정상 가구(개미집·생선 건조대 등)가 누락된다. note 가 "Trade in …" 인 행만 모형.
function isModelRow(row: { availability?: Availability[] }): boolean {
  return (row.availability ?? []).some((a) => {
    const f = norm(a.from)
    return (f === 'c.j.' || f === 'flick') && /^trade in\b/.test(norm(a.note))
  })
}

function inCatalog(row: { availability?: Availability[]; buy?: PriceEntry[] }): boolean {
  return (
    (row.availability ?? []).some((a) => /Nook|catalog|Shopping/i.test(a.from)) ||
    (row.buy ?? []).some((b) => b.price > 0)
  )
}

// 아이템 → 이벤트/시리즈 키. availability(from/note) + item_series + 이름 + 제작 재료를 종합.
// 우선순위 = EVENT_ORDER(사용자 지정). 위에서부터 첫 매칭 채택.
function eventOf(
  row: { availability?: Availability[]; item_series?: string; name?: string },
  recipeMats: Map<string, string[]>,
): EventKey {
  const fn = (row.availability ?? [])
    .flatMap((a) => [a.from, a.note])
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()
    .replace(/\[\[|\]\]/g, '')
  const series = norm(row.item_series)
  const name = norm(row.name)
  const mats = (recipeMats.get(name) ?? []).join(' | ').toLowerCase()
  const f = (...res: RegExp[]) => res.some((re) => re.test(fn)) // from/note
  const m = (re: RegExp) => re.test(mats) // 제작 재료
  const s = (...vals: string[]) => vals.some((v) => series.includes(v)) // item_series

  if (f(/valentine/)) return 'valentine'
  if (f(/festivale|pav[eé]/) || s('festivale')) return 'festivale'
  if (f(/bunny day|zipper/) || s('bunny day')) return 'bunny'
  if (f(/may day/)) return 'mayday'
  if (f(/museum day/)) return 'museum'
  if (f(/wedding|\bcyrus\b|\breese\b/) || s('wedding')) return 'wedding'
  if (f(/fireworks/)) return 'fireworks'
  if (f(/halloween|\bjack\b/) || s('spooky')) return 'halloween'
  if (f(/turkey day|franklin/) || s('turkey day')) return 'turkey'
  if (f(/toy day|jingle/)) return 'toyday'
  if (f(/countdown/)) return 'countdown'
  if (m(/cherry.?blossom|young spring bamboo|bamboo (?:piece|shoot)/) || s('cherry blossom', 'bamboo') || f(/cherry.?blossom/) || /\bbamboo\b/.test(name)) return 'cherry'
  if (m(/summer shell/) || s('shell') || f(/summer shell/)) return 'shell'
  if (m(/\bacorn\b|pine cone/) || s("tree's bounty", 'leaves') || f(/\bacorn\b|pine cone/)) return 'acorn'
  if (m(/mushroom/) || s('mush') || f(/mushroom/)) return 'mushroom'
  if (m(/maple leaf/) || f(/maple leaf/)) return 'maple'
  if (m(/snowflake/) || s('frozen') || f(/snowflake|snowboy/)) return 'snow'
  if (m(/ornament/) || s('festive') || f(/festive season/)) return 'ornament'
  if (f(/bug-?off/)) return 'bugoff'
  if (f(/fishing tourney/)) return 'fishing'
  if (f(/\bceleste\b|meteor shower|zodiac/) || s('stars', 'zodiac')) return 'celeste'
  if (f(/\bbrewster\b|caf[eé]/)) return 'brewster'
  if (f(/gullivarrr/)) return 'gullivarrr'
  if (f(/\bpascal\b/)) return 'pascal'
  if (f(/hotel souvenir|hotel room/)) return 'hotel'
  if (f(/\bbirthday\b/)) return 'birthday'
  if (f(/\bmom\b/)) return 'mom'
  if (f(/sanrio/) || s('cinnamoroll', 'hello kitty', 'kerokerokeroppi', 'my melody', 'pompompurin', 'kiki & lala')) return 'sanrio'
  if (s('mario') || f(/super mario|\bmario\b/)) return 'mario'
  if (s('the legend of zelda') || f(/zelda/)) return 'zelda'
  if (s('splatoon') || f(/splatoon/)) return 'splatoon'
  if (s('lego') || f(/lego/) || /lego/.test(name)) return 'lego'
  if (f(/pocket camp/)) return 'pocketcamp'
  return 'etc'
}

export function classify(input: ClassifyInput): ClassifyResult {
  const { furniture, clothing, interior, items, tools, gyroids, music, art, recipes, structureNames } = input

  // 레시피 이름셋(__hasRecipe 판정) + 제작결과명→재료명 맵(시즌 이벤트 판정용)
  const recipeNames = new Set(recipes.map((r) => norm(r.name)))
  const recipeMatsByName = new Map<string, string[]>(
    recipes.map((r) => [norm(r.name), (r.materials ?? []).map((mat) => mat.name)]),
  )
  // 미술품 이름셋(furniture에서 제외). 진품/위작 모두 이름 매칭.
  const artNames = new Set(art.map((a) => norm(a.name)))

  const rows: ItemRow[] = []
  const modelNames = new Set<string>()

  const finalize = (row: RawRow): ItemRow => ({
    ...row,
    __hasVariation: (row.variation_total ?? 0) > 1 || (row.variations?.length ?? 0) > 1,
    __reformable: row.customizable === true,
    __hasRecipe: recipeNames.has(norm(row.name)),
    __catalogable: inCatalog(row),
    __event: eventOf(row, recipeMatsByName),
  })

  // ── 가구 ──
  for (const f of furniture) {
    const n = norm(f.name)
    // 미술품(명화·조각상) 제외 — 위작 '(fake)' 접미사 또는 art 이름 매칭
    const base = n.replace(/\s*\(fake\)$/, '')
    if (/\(fake\)$/.test(n) || artNames.has(base)) continue
    // 모형 제외 + 이름 수집
    if (isModelRow(f)) { modelNames.add(n); continue }
    const cat = norm(f.category)
    let bucket: Bucket
    if (cat === 'housewares') bucket = structureNames.has(n) ? 'structures' : 'furniture'
    else if (cat === 'miscellaneous') bucket = 'misc'
    else if (cat === 'wall-mounted' || cat === 'ceiling decor') bucket = 'wallmount'
    else bucket = 'furniture' // 미지정 폴백
    rows.push(finalize({ ...f, __cat: 'furniture', __bucket: bucket }))
  }

  // ── 실내장식(벽지/바닥/러그) ──
  for (const it of interior) {
    rows.push(finalize({ ...it, __cat: 'interior', __bucket: 'interior' }))
  }

  // ── 의류 ──
  for (const c of clothing) {
    const cat = norm(c.category)
    let bucket: Bucket
    if (cat === 'accessories') bucket = 'accessories'
    else if (cat === 'headwear' || cat === 'bags' || cat === 'shoes' || cat === 'umbrellas')
      bucket = 'bagshat'
    else bucket = 'clothing' // tops/bottoms/dress-up/socks/other
    rows.push(finalize({ ...c, __cat: 'clothing', __bucket: bucket }))
  }

  // ── 잡화(items): 식용=음식, 비식용=기타 + 모형 제외 ──
  for (const it of items) {
    const n = norm(it.name)
    if (isModelRow(it)) { modelNames.add(n); continue }
    rows.push(
      finalize({ ...it, __cat: 'items', __bucket: it.edible === true ? 'food' : 'other' }),
    )
  }

  // ── 도구 → 기타 ──
  for (const t of tools) {
    rows.push(finalize({ ...t, __cat: 'tools', __bucket: 'other' }))
  }

  // ── 토용(gyroids) ──
  for (const g of gyroids) {
    rows.push(finalize({ ...g, __cat: 'gyroids', __bucket: 'gyroids' }))
  }

  // ── 음악(music.json 합성 행) ──
  for (const [name, m] of Object.entries(music)) {
    const buy: PriceEntry[] = m.buy != null ? [{ price: m.buy, currency: 'Bells' }] : []
    rows.push(
      finalize({
        name,
        __cat: 'music',
        __bucket: 'music',
        __ko: m.ko,
        image_url: m.image ?? undefined,
        buy,
        sell: m.sell ?? undefined,
        availability: [],
        variations: [],
      }),
    )
  }

  const byBucket = {} as Record<Bucket, ItemRow[]>
  for (const b of BUCKET_ORDER) byBucket[b] = []
  for (const r of rows) byBucket[r.__bucket].push(r)

  return { rows, byBucket, modelNames }
}
