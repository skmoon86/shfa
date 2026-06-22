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

// 이벤트 분류(availability.note + 일부 from 기반). 획득방법 드롭다운을 대체.
export type EventKey =
  | 'bunny' | 'festivale' | 'turkey' | 'toyday' | 'halloween' | 'valentine'
  | 'wedding' | 'mayday' | 'fishing' | 'bugoff' | 'fireworks' | 'museum'
  | 'countdown' | 'musicfest'
  | 'mushroom' | 'cherry' | 'maple'
  | 'sanrio' | 'mario' | 'zelda' | 'splatoon' | 'lego' | 'pocketcamp'
  | 'celeste' | 'gullivarrr' | 'pascal' | 'hotel'
  | 'spring' | 'summer' | 'fall' | 'winter' | 'seasonal'
  | 'etc'

// 우선순위 = 매칭 순서(위가 우선). 명절·행사 > 자연 시즌 > 콜라보 > NPC/특수 > 계절 > 기타.
const EVENT_RULES: [Exclude<EventKey, 'etc'>, RegExp][] = [
  ['bunny', /bunny day/],
  ['festivale', /festivale/],
  ['turkey', /turkey day/],
  ['toyday', /toy day/],
  ['halloween', /halloween/],
  ['valentine', /valentine/],
  ['wedding', /wedding/],
  ['mayday', /may day/],
  ['fishing', /fishing tourney/],
  ['bugoff', /bug-?off/],
  ['fireworks', /fireworks/],
  ['museum', /museum day/],
  ['countdown', /countdown/],
  ['musicfest', /music festival/],
  ['mushroom', /mushroom/],
  ['cherry', /cherry.?blossom/],
  ['maple', /maple leaf/],
  ['sanrio', /sanrio/],
  ['mario', /mario/],
  ['zelda', /zelda/],
  ['splatoon', /splatoon/],
  ['lego', /lego/],
  ['pocketcamp', /pocket camp/],
  ['celeste', /celeste|meteor shower|zodiac/],
  ['gullivarrr', /gullivarrr/],
  ['pascal', /pascal/],
  ['hotel', /hotel souvenir/],
  ['spring', /\bspring\b/],
  ['summer', /\bsummer\b/],
  ['fall', /\bfall\b/],
  ['winter', /\bwinter\b/],
  ['seasonal', /\bseasonal\b/],
]

// 드롭다운 노출 순서(고정 논리 순서) + 라벨
export const EVENT_ORDER: EventKey[] = [...EVENT_RULES.map(([k]) => k), 'etc']
export const itemEventLabel: Record<EventKey, string> = {
  bunny: '부활절', festivale: '페스티벌', turkey: '추수감사절', toyday: '토이데이',
  halloween: '핼러윈', valentine: '발렌타인데이', wedding: '웨딩 시즌', mayday: '메이데이',
  fishing: '낚시 대회', bugoff: '곤충 채집 대회', fireworks: '불꽃놀이', museum: '국제 박물관의 날',
  countdown: '카운트다운', musicfest: '뮤직 페스티벌',
  mushroom: '버섯 시즌', cherry: '벚꽃 시즌', maple: '단풍 시즌',
  sanrio: '산리오', mario: '마리오', zelda: '젤다', splatoon: '스플래툰', lego: '레고', pocketcamp: '포켓캠프',
  celeste: '부옥이 별똥별', gullivarrr: '해적 죠니', pascal: '해탈한', hotel: '호텔 기념품',
  spring: '봄', summer: '여름', fall: '가을', winter: '겨울', seasonal: '시즌',
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

// 모형: availability.from 이 저스틴(C.J.) 또는 레온(Flick)
function isModelRow(row: { availability?: Availability[] }): boolean {
  return (row.availability ?? []).some((a) => {
    const f = norm(a.from)
    return f === 'c.j.' || f === 'flick'
  })
}

function inCatalog(row: { availability?: Availability[]; buy?: PriceEntry[] }): boolean {
  return (
    (row.availability ?? []).some((a) => /Nook|catalog|Shopping/i.test(a.from)) ||
    (row.buy ?? []).some((b) => b.price > 0)
  )
}

// availability.note(+from)를 모아 위키 마크업 제거 후 우선순위 키워드로 이벤트 판정.
function eventOf(row: { availability?: Availability[] }): EventKey {
  const parts: string[] = []
  for (const a of row.availability ?? []) {
    if (a.from) parts.push(a.from)
    if (a.note) parts.push(a.note)
  }
  if (parts.length === 0) return 'etc'
  const text = parts.join(' | ').toLowerCase().replace(/\[\[|\]\]/g, '')
  for (const [key, re] of EVENT_RULES) if (re.test(text)) return key
  return 'etc'
}

export function classify(input: ClassifyInput): ClassifyResult {
  const { furniture, clothing, interior, items, tools, gyroids, music, art, recipes, structureNames } = input

  // 레시피 이름셋(__hasRecipe 판정)
  const recipeNames = new Set(recipes.map((r) => norm(r.name)))
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
    __event: eventOf(row),
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
