// DIY 레시피 입수처(카테고리) 분류. availability(from/note) + 제작 재료 + 이름을 종합.
// RecipesPage '입수처' 드롭다운을 사용자 지정 목록·순서로 교체한다.
import type { Recipe } from './nookipedia'

export const RECIPE_CAT_ORDER = [
  'carnival', 'easter', 'wedding', 'fireworks', 'halloween', 'turkey', 'christmas',
  'cherry', 'shell', 'acorn', 'mushroom', 'maple', 'snow', 'ornament',
  'npc_brewster', 'npc_daisymae', 'npc_flick', 'npc_cj', 'npc_celeste', 'npc_gulliver', 'npc_pascal', 'npc_mom',
  'vil_smug', 'vil_sisterly', 'vil_lazy', 'vil_peppy', 'vil_cranky', 'vil_snooty', 'vil_jock', 'vil_normal',
  'nookcranny', 'nookstop', 'bottle', 'balloon', 'hhp', 'etc',
] as const
export type RecipeCat = (typeof RECIPE_CAT_ORDER)[number]

export const recipeCatLabel: Record<RecipeCat, string> = {
  carnival: '카니발:베르리나', easter: '이스터(부활절):토빗', wedding: '웨딩:리포&리사',
  fireworks: '불꽃 축제', halloween: '할로윈:펌킹', turkey: '추수감사절', christmas: '크리스마스',
  cherry: '대나무&벚꽃', shell: '여름 조개껍데기', acorn: '도토리&솔방울', mushroom: '버섯',
  maple: '단풍잎', snow: '눈사람', ornament: '오너먼트',
  npc_brewster: 'NPC:마스터', npc_daisymae: 'NPC:무파니', npc_flick: 'NPC:레온', npc_cj: 'NPC:저스틴',
  npc_celeste: 'NPC:부옥이', npc_gulliver: 'NPC:죠니', npc_pascal: 'NPC:해탈한', npc_mom: 'NPC:엄마',
  vil_smug: '주민:느끼', vil_sisterly: '주민:단순활발', vil_lazy: '주민:먹보', vil_peppy: '주민:아이돌(명랑)',
  vil_cranky: '주민:무뚝뚝', vil_snooty: '주민:성숙', vil_jock: '주민:운동광', vil_normal: '주민:친절',
  nookcranny: '너굴상점', nookstop: '너굴포트(마일교환)', bottle: '유리병', balloon: '풍선',
  hhp: '해피홈 파라다이스', etc: '기타',
}

// 레시피 → 카테고리(첫 매칭). 우선순위 = RECIPE_CAT_ORDER.
export function recipeCatOf(r: Recipe): RecipeCat {
  const fn = (r.availability ?? [])
    .flatMap((a) => [a.from, a.note])
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()
    .replace(/\[\[|\]\]/g, '')
  const mats = (r.materials ?? []).map((mt) => mt.name).join(' | ').toLowerCase()
  const nm = (r.name ?? '').toLowerCase()
  const f = (...res: RegExp[]) => res.some((re) => re.test(fn)) // from/note
  const m = (re: RegExp) => re.test(mats) // 제작 재료
  const n = (re: RegExp) => re.test(nm) // 결과물 이름

  // 명절/행사(소스 NPC·이벤트)
  if (f(/festivale|pav[eé]/)) return 'carnival'
  if (f(/bunny day|zipper/)) return 'easter'
  if (f(/wedding|\bcyrus\b|\breese\b/)) return 'wedding'
  if (f(/fireworks/)) return 'fireworks'
  if (f(/halloween|\bjack\b/)) return 'halloween'
  if (f(/turkey day|franklin/)) return 'turkey'
  if (f(/toy day|jingle/)) return 'christmas' // 토이데이(루돌) 전용. 오너먼트 제작 DIY는 아래 ornament 로.
  // 시즌 재료(재료/이름/노트)
  if (m(/cherry.?blossom petal|young spring bamboo|bamboo shoot/) || n(/cherry.?blossom|bamboo/) || f(/cherry.?blossom season/)) return 'cherry'
  if (m(/summer shell/) || n(/\bshell\b/)) return 'shell'
  if (m(/\bacorn\b|pine cone/) || n(/\bacorn\b|pine ?cone/)) return 'acorn'
  if (m(/mushroom/) || f(/mushroom season/)) return 'mushroom'
  if (m(/maple leaf/) || f(/maple leaf season/)) return 'maple'
  if (m(/snowflake/) || f(/snowboy|snow person/)) return 'snow'
  if (m(/ornament/) || f(/festive season/)) return 'ornament'
  // NPC
  if (f(/\bbrewster\b|caf[eé]/)) return 'npc_brewster'
  if (f(/daisy mae|\bdaisy\b/)) return 'npc_daisymae'
  if (f(/\bflick\b/)) return 'npc_flick'
  if (f(/c\.j\./)) return 'npc_cj'
  if (f(/\bceleste\b|meteor shower/)) return 'npc_celeste'
  if (f(/gulliver(?:rr)?\b/)) return 'npc_gulliver'
  if (f(/\bpascal\b/)) return 'npc_pascal'
  if (f(/\bmom\b/)) return 'npc_mom'
  // 주민(성격별) — from 은 단수형("cranky villager" 등)
  if (f(/smug villager/)) return 'vil_smug'
  if (f(/big sister villager|sisterly villager/)) return 'vil_sisterly'
  if (f(/lazy villager/)) return 'vil_lazy'
  if (f(/peppy villager/)) return 'vil_peppy'
  if (f(/cranky villager/)) return 'vil_cranky'
  if (f(/snooty villager/)) return 'vil_snooty'
  if (f(/jock villager/)) return 'vil_jock'
  if (f(/normal villager/)) return 'vil_normal'
  // 상점/입수 경로
  if (f(/nook's cranny/)) return 'nookcranny'
  if (f(/nook stop|nook miles/)) return 'nookstop'
  if (f(/message bottle|egg bottle/)) return 'bottle'
  if (f(/balloon/)) return 'balloon'
  if (f(/niko|paradise planning|wardell|lottie|happy home/)) return 'hhp'
  return 'etc'
}
