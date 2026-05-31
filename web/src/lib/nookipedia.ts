// Nookipedia API 클라이언트 + 타입
// 실제 호출은 Supabase Edge Function 프록시를 경유한다(키 숨김 + 캐시).

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, NOOKIPEDIA_FN } from './supabase'

// ── 공통 보조 타입 ────────────────────────────────────────
export interface PriceEntry {
  price: number
  currency: string // "Bells", "Nook Miles", "Poki" 등
}
export interface Availability {
  from: string
  note?: string
}
export interface Hemisphere {
  months: string // 예: "3-6; 9-11"
  months_array: number[]
  availability_array: { months: string; time: string }[]
  times_by_month?: Record<string, string>
}

// ── 도감: 물고기/곤충/해산물 ──────────────────────────────
export interface Critter {
  name: string
  url: string
  number: number
  image_url: string
  render_url?: string
  location?: string // 잡히는 장소
  shadow_size?: string // 물고기 그림자
  weather?: string
  speed?: string // 해산물 이동 속도
  rarity?: string
  total_catch?: number
  sell_nook: number
  sell_cj?: number // 물고기 CJ
  sell_flick?: number // 곤충 플릭
  tank_width?: number
  tank_length?: number
  catchphrases?: string[]
  north: Hemisphere
  south: Hemisphere
}

// ── 도감: 화석 ────────────────────────────────────────────
// Nookipedia /nh/fossils/all 은 "그룹" 배열을 주고, 각 그룹 안에 개별 조각이 들어있다.
export interface FossilPiece {
  name: string
  url: string
  image_url: string
  sell: number
  hha_base?: number
  interactable?: boolean
  width?: number
  length?: number
  colors?: string[]
}
export interface FossilGroupRaw {
  name: string
  url: string
  room?: number
  description?: string
  fossils: FossilPiece[]
}
// 화면에서 사용하는 평탄화된 개별 화석
export interface Fossil {
  name: string
  url: string
  image_url: string
  sell: number
  fossil_group?: string
  width?: number
  length?: number
  colors?: string[]
}

// ── 도감: 미술품 ──────────────────────────────────────────
export interface Art {
  name: string
  url: string
  image_url: string
  has_fake: boolean
  fake_image_url?: string
  art_name?: string // 실제 작품명
  author?: string
  year?: string
  art_style?: string
  description?: string
  buy: PriceEntry[]
  sell: number
  availability?: string
  authenticity?: string // 위작 식별 포인트
  width?: number
  length?: number
}

// ── 변형(색상/패턴) ───────────────────────────────────────
export interface Variation {
  variation?: string
  pattern?: string
  image_url: string
  colors?: string[]
}

// ── 가구 ──────────────────────────────────────────────────
export interface Furniture {
  name: string
  url: string
  category?: string
  image_url?: string
  item_series?: string
  item_set?: string
  themes?: string[]
  hha_category?: string
  hha_base?: number
  lucky?: boolean
  lucky_season?: string
  function?: string
  buy: PriceEntry[]
  sell: number
  availability: Availability[]
  // 리폼/커스터마이즈
  variation_total?: number
  pattern_total?: number
  customizable?: boolean
  custom_kits?: number
  custom_kit_type?: string
  grid_width?: number
  grid_length?: number
  height?: number
  door_decor?: boolean
  unlocked?: boolean
  notes?: string
  variations?: Variation[]
}

// ── 의류 ──────────────────────────────────────────────────
export interface Clothing {
  name: string
  url: string
  category?: string
  image_url?: string
  styles?: string[]
  label_themes?: string[]
  villager_equippable?: boolean
  seasonality?: string
  buy: PriceEntry[]
  sell: number
  availability: Availability[]
  variation_total?: number
  notes?: string
  variations?: Variation[]
}

// ── 실내장식(벽지/바닥/러그) ──────────────────────────────
export interface Interior {
  name: string
  url: string
  category?: string
  image_url?: string
  colors?: string[]
  themes?: string[]
  hha_base?: number
  buy: PriceEntry[]
  sell: number
  availability: Availability[]
  vfx?: boolean
}

// ── 잡화 아이템 ───────────────────────────────────────────
export interface Item {
  name: string
  url: string
  image_url?: string
  stack?: number
  hha_base?: number
  buy: PriceEntry[]
  sell: number
  is_fence?: boolean
  material_type?: string
  material_seasonality?: string
  edible?: boolean
  plant_type?: string
  availability: Availability[]
  variations?: Variation[]
}

// ── 도구 ──────────────────────────────────────────────────
export interface Tool {
  name: string
  url: string
  image_url?: string
  uses?: number | string
  buy: PriceEntry[]
  sell: number
  availability: Availability[]
  customizable?: boolean
  custom_kits?: number
  custom_kit_type?: string
  variations?: Variation[]
}

// ── 사진/포스터 ───────────────────────────────────────────
export interface Photo {
  name: string
  url: string
  image_url?: string
  category?: string
  buy: PriceEntry[]
  sell: number
  availability: Availability[]
  customizable?: boolean
  custom_kits?: number
  custom_kit_type?: string
  variations?: Variation[]
}

// ── 자이로이드 ────────────────────────────────────────────
export interface Gyroid {
  name: string
  url: string
  image_url?: string
  buy: PriceEntry[]
  sell: number
  availability: Availability[]
  customizable?: boolean
  variations?: Variation[]
}

// ── DIY 레시피 ────────────────────────────────────────────
export interface RecipeMaterial {
  name: string
  count: number
}
export interface Recipe {
  name: string
  url: string
  image_url?: string
  serial_id?: number
  buy: PriceEntry[]
  sell: number
  recipes_to_unlock?: number
  materials: RecipeMaterial[]
  availability: Availability[]
}

// ── 주민 ──────────────────────────────────────────────────
export interface VillagerNHDetails {
  image_url?: string
  photo_url?: string
  icon_url?: string
  quote?: string
  'sub-personality'?: string
  catchphrase?: string
  clothing?: string
  clothing_variation?: string
  fav_styles?: string[]
  fav_colors?: string[]
  hobby?: string
  house_interior_url?: string
  house_exterior_url?: string
  house_wallpaper?: string
  house_flooring?: string
  house_music?: string
  house_music_note?: string
  umbrella?: string
}
export interface Villager {
  name: string
  url: string
  alt_name?: string
  title_color?: string
  text_color?: string
  id?: string
  image_url: string
  species: string
  personality: string
  gender: string
  birthday_month?: string
  birthday_day?: string
  sign?: string // 별자리
  quote?: string
  phrase?: string
  prev_phrases?: string[]
  clothing?: string
  islander?: boolean
  debut?: string
  nh_details?: VillagerNHDetails
  appearances?: string[]
}

// ── 핵심 fetch (Edge Function 경유) ──────────────────────
type QueryParams = Record<string, string | number | boolean | undefined>

async function nookFetch<T>(path: string, params?: QueryParams): Promise<T> {
  const u = new URL(`${SUPABASE_URL}/functions/v1/${NOOKIPEDIA_FN}/${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') u.searchParams.set(k, String(v))
    }
  }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token ?? SUPABASE_ANON_KEY
  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = JSON.stringify(await res.json())
    } catch {
      /* noop */
    }
    throw new Error(`Nookipedia 프록시 오류 (${res.status}) ${detail}`)
  }
  return res.json() as Promise<T>
}

// ── 카테고리별 API ────────────────────────────────────────
export const nookipedia = {
  fish: () => nookFetch<Critter[]>('nh/fish'),
  bugs: () => nookFetch<Critter[]>('nh/bugs'),
  sea: () => nookFetch<Critter[]>('nh/sea'),
  // 그룹 응답을 개별 화석 조각으로 평탄화
  fossils: async (): Promise<Fossil[]> => {
    const groups = await nookFetch<FossilGroupRaw[]>('nh/fossils/all')
    return groups.flatMap((g) =>
      (g.fossils ?? []).map((f) => ({
        name: f.name,
        url: f.url,
        image_url: f.image_url,
        sell: f.sell,
        fossil_group: g.name,
        width: f.width,
        length: f.length,
        colors: f.colors,
      })),
    )
  },
  art: () => nookFetch<Art[]>('nh/art'),
  recipes: () => nookFetch<Recipe[]>('nh/recipes'),
  // 주민은 게임 공통 엔드포인트(/villagers). NH 한정 + NH 상세 포함.
  villagers: (params?: QueryParams) =>
    nookFetch<Villager[]>('villagers', { game: 'NH', nhdetails: true, ...params }),
  furniture: (params?: QueryParams) => nookFetch<Furniture[]>('nh/furniture', params),
  clothing: (params?: QueryParams) => nookFetch<Clothing[]>('nh/clothing', params),
  interior: (params?: QueryParams) => nookFetch<Interior[]>('nh/interior', params),
  items: (params?: QueryParams) => nookFetch<Item[]>('nh/items', params),
  tools: (params?: QueryParams) => nookFetch<Tool[]>('nh/tools', params),
  photos: (params?: QueryParams) => nookFetch<Photo[]>('nh/photos', params),
  gyroids: (params?: QueryParams) => nookFetch<Gyroid[]>('nh/gyroids', params),
}
