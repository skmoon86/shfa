// 성격별 주민이 줄 수 있는 DIY 레시피(대표 시드).
//
// ⚠️ Nookipedia API 는 "어느 성격이 어떤 레시피를 주는지"를 구조화 데이터로
//    제공하지 않는다(레시피 availability.from 은 "Villagers" 로만 표기).
//    아래 매핑은 Nookipedia 위키 "DIY recipes/Villagers" 및 커뮤니티 연구
//    (BellTree)에 기반한 *대표 예시*이며, 자유롭게 보완할 수 있다.
//    레시피 이름은 Nookipedia 의 recipe `name` 과 대소문자 무시로 매칭한다.
//
// 출처:
//   https://nookipedia.com/wiki/DIY_recipes
//   https://www.belltreeforums.com/threads/research-thread-diy-recipes-vs-villager-personalities.513851/

export type Personality =
  | 'Normal'
  | 'Peppy'
  | 'Snooty'
  | 'Cranky'
  | 'Lazy'
  | 'Jock'
  | 'Smug'
  | 'Big sister'

// 모든 성격이 공통으로 줄 수 있는 레시피(꽃 화관/리스 등)
export const COMMON_RECIPES: string[] = [
  'wild bouquet',
  'wooden-block wall clock',
]

// 성격별 대표 레시피
export const VILLAGER_RECIPES: Record<Personality, string[]> = {
  Normal: ['tea table', 'doll', 'cutting board', 'tray of tarts', 'birdhouse'],
  Peppy: ['cute music player', 'cute bed', 'dreamy bed', 'star clock', 'pink rose wreath'],
  Snooty: ['elaborate kimono stand', 'elegant console table', 'classic-library wall', 'grand piano'],
  Cranky: ['throwback skull radio', 'rack of mallets', 'campfire', 'log bench', 'fish print'],
  Lazy: ['cutting board', 'tea set', 'pot', 'apple chair', 'frying pan'],
  Jock: ['inflatable kiddie pool', 'sandbag', 'tape deck', 'basketball hoop', 'wood-plank sign'],
  Smug: ['nova light', 'den desk', 'jukebox', 'garden chair', 'simple panel'],
  'Big sister': ['boxing barbell', 'studio wall', 'tabletop foosball', 'iron worktable'],
}

// 성격 문자열 정규화(Nookipedia 표기 흔들림 대응)
export function normalizePersonality(p?: string): Personality | null {
  if (!p) return null
  const key = p.trim().toLowerCase()
  const table: Record<string, Personality> = {
    normal: 'Normal',
    peppy: 'Peppy',
    snooty: 'Snooty',
    cranky: 'Cranky',
    lazy: 'Lazy',
    jock: 'Jock',
    smug: 'Smug',
    'big sister': 'Big sister',
    sisterly: 'Big sister',
    uchi: 'Big sister',
  }
  return table[key] ?? null
}

export function recipesForPersonality(p?: string): string[] {
  const norm = normalizePersonality(p)
  if (!norm) return COMMON_RECIPES
  return [...VILLAGER_RECIPES[norm], ...COMMON_RECIPES]
}
