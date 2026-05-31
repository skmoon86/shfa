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
  furniture: ['Housewares', 'Wall-mounted', 'Ceiling Decor', 'Miscellaneous', 'Interior Structures'],
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

async function main() {
  const outDir = new URL('../web/public/ko/', import.meta.url)
  await mkdir(outDir, { recursive: true })

  for (const [cat, sheets] of Object.entries(MAP)) {
    const map = {}
    for (const sheet of sheets) {
      const rows = await fetchSheet(sheet)
      for (const r of rows) {
        const ko = r?.translations?.kRko
        if (!ko) continue
        // 매칭 키: name, 영문 번역(eUen/uSen) 모두 등록
        for (const key of [r.name, r?.translations?.eUen, r?.translations?.uSen]) {
          const k = norm(key)
          if (k && !map[k]) map[k] = ko
        }
      }
    }
    const path = new URL(`${cat}.json`, outDir)
    await writeFile(path, JSON.stringify(map))
    console.log(`${cat}: ${Object.keys(map).length} entries (${sheets.join(', ')})`)
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

  console.log('done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
