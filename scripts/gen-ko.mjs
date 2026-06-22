// Norviah/animal-crossing 데이터에서 "영문명 → 한글명" 슬림 맵을 추출해
// web/public/ko/<category>.json 으로 저장한다. (한 번 실행해 생성물 커밋)
//
// 실행: node scripts/gen-ko.mjs
import { writeFile, mkdir } from 'node:fs/promises'

const BASE =
  'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/'

// 우리 앱 카테고리 → Norviah 원본 파일들
const MAP = {
  fish: ['Fish'],
  bugs: ['Insects'],
  sea: ['Sea Creatures'],
  fossils: ['Fossils'],
  art: ['Artwork'],
  recipes: ['Recipes'],
  villagers: ['Villagers'],
  furniture: ['Housewares', 'Wall-mounted', 'Ceiling Decor', 'Miscellaneous', 'Interior Structures', 'Artwork'],
  clothing: ['Tops', 'Bottoms', 'Dress-Up', 'Headwear', 'Accessories', 'Socks', 'Shoes', 'Bags', 'Clothing Other'],
  interior: ['Floors', 'Wallpaper', 'Rugs'],
  tools: ['Tools-Goods'],
  photos: ['Photos', 'Posters'],
  gyroids: ['Gyroids'],
  items: ['Other', 'Fencing', 'Umbrellas', 'Music', 'Miscellaneous'],
}

const norm = (s) => String(s || '').toLowerCase().trim()

async function fetchSheet(name) {
  const url = BASE + encodeURIComponent(name) + '.json'
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ! ${name}: HTTP ${res.status}`)
    return []
  }
  return res.json()
}

// 깨진 번역값(변형 라벨이 이름 자리에 들어온 경우 등) 거르기
const BAD = new Set(['종류 없음', 'No Variations', ''])
const validKo = (r) => {
  const ko = r?.translations?.kRko
  if (!ko || BAD.has(ko)) return null
  // 영문 번역이 실제 이름과 다른 변형 라벨이면(예: "No Variations") 신뢰 불가
  const en = r?.translations?.eUen
  if (en && /^no variations$/i.test(en)) return null
  return ko
}

async function main() {
  const outDir = new URL('../web/public/ko/', import.meta.url)
  await mkdir(outDir, { recursive: true })

  // 전체 아이템 이름 → 한글 (레시피명 = 아이템명이므로 신뢰 가능한 소스)
  const allNames = {}

  for (const [cat, sheets] of Object.entries(MAP)) {
    if (cat === 'recipes') continue // 레시피는 아래에서 특별 처리
    const map = {}
    for (const sheet of sheets) {
      const rows = await fetchSheet(sheet)
      for (const r of rows) {
        const ko = validKo(r)
        if (!ko) continue
        for (const key of [r.name, r?.translations?.eUen, r?.translations?.uSen]) {
          const k = norm(key)
          if (k && !map[k]) map[k] = ko
          if (k && !allNames[k]) allNames[k] = ko
        }
      }
    }
    const path = new URL(`${cat}.json`, outDir)
    await writeFile(path, JSON.stringify(map))
    console.log(`${cat}: ${Object.keys(map).length} entries (${sheets.join(', ')})`)
  }

  // 레시피 이름: Recipes 시트의 번역이 정상일 때만 쓰고, 아니면 아이템명 사전으로 대체
  {
    const rows = await fetchSheet('Recipes')
    const map = {}
    for (const r of rows) {
      const k = norm(r.name)
      if (!k) continue
      // Recipes 시트 번역이 이름과 일치할 때만 신뢰
      const en = norm(r?.translations?.eUen)
      const trusted = en === k ? validKo(r) : null
      const ko = trusted || allNames[k]
      if (ko && !BAD.has(ko)) map[k] = ko
    }
    await writeFile(new URL('recipes.json', outDir), JSON.stringify(map))
    console.log(`recipes: ${Object.keys(map).length} entries (Recipes + 아이템명 보정)`)
  }

  // ── 레시피 카테고리(레시피명 → 대분류 코드) ───────────────
  const RECIPE_CAT = {
    Housewares: 'furniture',
    'Wall-mounted': 'wall',
    'Ceiling Decor': 'wall',
    Wallpaper: 'interior',
    Floors: 'interior',
    Rugs: 'interior',
    Tools: 'tools',
    Equipment: 'equipment',
    Savory: 'food',
    Sweet: 'food',
    Miscellaneous: 'misc',
    Other: 'misc',
  }
  const recipes = await fetchSheet('Recipes')
  const rcat = {}
  for (const r of recipes) {
    const code = RECIPE_CAT[r.category]
    if (!code) continue
    for (const key of [r.name, r?.translations?.eUen, r?.translations?.uSen]) {
      const k = norm(key)
      if (k && !rcat[k]) rcat[k] = code
    }
  }
  await writeFile(new URL('recipe-cats.json', outDir), JSON.stringify(rcat))
  console.log(`recipe-cats: ${Object.keys(rcat).length} entries`)

  // ── 음악(앨범 이미지 포함 데이터맵) ───────────────────────
  // Nookipedia엔 음악 엔드포인트가 없어 Norviah Music 시트로 합성 행을 만든다.
  {
    const rows = await fetchSheet('Music')
    const music = {}
    for (const r of rows) {
      const k = norm(r.name)
      if (!k) continue
      music[k] = {
        ko: validKo(r) || r.name,
        buy: typeof r.buy === 'number' ? r.buy : null,
        sell: typeof r.sell === 'number' ? r.sell : null,
        image: r.albumImage || r.framedImage || null,
        recipe: r.recipe ?? null,
      }
    }
    await writeFile(new URL('music.json', outDir), JSON.stringify(music))
    console.log(`music: ${Object.keys(music).length} entries (Music + 앨범 이미지)`)
  }

  // ── 내부구조 이름셋(분류기 전용) ──────────────────────────
  // 가구 Housewares에 섞인 기둥·아일랜드 조리대·칸막이벽 등을 이름으로 분리.
  {
    const rows = await fetchSheet('Interior Structures')
    const structures = {}
    for (const r of rows) {
      const k = norm(r.name)
      if (!k) continue
      structures[k] = validKo(r) || r.name
    }
    await writeFile(new URL('interior-structures.json', outDir), JSON.stringify(structures))
    console.log(`interior-structures: ${Object.keys(structures).length} entries`)
  }

  console.log('done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
