// "영문명 → 한글명" 슬림 맵(web/public/ko/<category>.json) 생성기.
//
// 4층 병합(뒤가 우선):
//   ① Norviah/animal-crossing (2022-01 스냅샷 — 기본층. music 이미지·recipe-cats 등은 여기서만 나옴)
//   ② 기존 커밋된 web/public/ko/*.json (수동 보강분 보존 — 두 소스에 없는 이름 유지)
//   ③ 라이브 ACNH Translations 구글 시트 (게임 파일 추출 공식 텍스트, 콜라보/최신 업데이트 포함)
//   ④ scripts/ko-overrides.json (게임 실기기에서 확인한 확정 표기 — 시트가 낡은 항목만)
//
// 신규 산출물: catchphrases.json (주민 영문명 → 한국어 말버릇, 시트 Villagers+Villager Catchphrases 조인)
// recipes.json 은 Nookipedia 프록시(/nh/recipes, web/.env 필요)로 실제 레시피명 목록을 받아
// 그 이름들만 담는다(파일 비대 방지). 프록시 실패 시 기존 파일 + 시트 오버레이로 폴백.
//
// 실행: node scripts/gen-ko.mjs  (생성물 커밋)
import { writeFile, readFile, mkdir } from 'node:fs/promises'

const NORVIAH_BASE =
  'https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/data/'
const SHEET_ID = '1MMbsvDfu59OY9YBEAfHhFJ6O8vRTllNFgMrX7RBZuyI' // ACNH Translations (커뮤니티 데이터마인)
const SHEET_CSV = (gid) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`

// ── 우리 앱 카테고리 → Norviah 원본 시트(①층) ───────────────────────────
const NORVIAH_MAP = {
  fish: ['Fish'],
  bugs: ['Insects'],
  sea: ['Sea Creatures'],
  fossils: ['Fossils'],
  art: ['Artwork'],
  villagers: ['Villagers'],
  furniture: ['Housewares', 'Wall-mounted', 'Ceiling Decor', 'Miscellaneous', 'Interior Structures', 'Artwork'],
  clothing: ['Tops', 'Bottoms', 'Dress-Up', 'Headwear', 'Accessories', 'Socks', 'Shoes', 'Bags', 'Clothing Other'],
  interior: ['Floors', 'Wallpaper', 'Rugs'],
  tools: ['Tools-Goods'],
  photos: ['Photos', 'Posters'],
  gyroids: ['Gyroids'],
  items: ['Other', 'Fencing', 'Umbrellas', 'Music', 'Miscellaneous'],
}

// ── 라이브 번역 시트 탭(③층): 탭이름 → { gid, scope, targets } ──
// scope   = 이 탭이 값을 "갱신"해도 되는 카테고리(⚠ 반드시 제한 — 주민 Apple/Cherry/Clay/Boots/
//           Anchovy/Rocket 등이 같은 영문명의 과일·점토·장화·물고기·가구를 덮어쓴 사고 방지).
// targets = 어느 파일에도 없는 "새 이름"의 배치처. useKoNamesMulti 는 전 카테고리 폴백
//           스캔이 있어 배치가 다소 어긋나도 찾는다.
const ITEM_SCOPE = ['furniture', 'clothing', 'interior', 'tools', 'items', 'gyroids']
const SHEET_TABS = {
  Furniture: { gid: 0, scope: ITEM_SCOPE, targets: ['furniture'] },
  'Door Deco': { gid: 567222582, scope: ITEM_SCOPE, targets: ['furniture'] },
  'Event Items': { gid: 226155687, scope: ITEM_SCOPE, targets: ['items'] },
  Construction: { gid: 1478870584, scope: ITEM_SCOPE, targets: ['furniture'] },
  Etc: { gid: 1788803126, scope: ITEM_SCOPE, targets: ['items'] },
  "Harv's Island Items": { gid: 1311860374, scope: ITEM_SCOPE, targets: ['furniture'] },
  Wallpaper: { gid: 909863789, scope: ITEM_SCOPE, targets: ['interior'] },
  Floors: { gid: 113945682, scope: ITEM_SCOPE, targets: ['interior'] },
  Rugs: { gid: 128625322, scope: ITEM_SCOPE, targets: ['interior'] },
  Tops: { gid: 872045267, scope: ITEM_SCOPE, targets: ['clothing'] },
  Bottoms: { gid: 1212478370, scope: ITEM_SCOPE, targets: ['clothing'] },
  'Dress-Up': { gid: 907805217, scope: ITEM_SCOPE, targets: ['clothing'] },
  Accessories: { gid: 528526700, scope: ITEM_SCOPE, targets: ['clothing'] },
  Caps: { gid: 123966124, scope: ITEM_SCOPE, targets: ['clothing'] },
  Helmets: { gid: 395809644, scope: ITEM_SCOPE, targets: ['clothing'] },
  Socks: { gid: 1375287621, scope: ITEM_SCOPE, targets: ['clothing'] },
  Shoes: { gid: 65350946, scope: ITEM_SCOPE, targets: ['clothing'] },
  Wetsuits: { gid: 1669423106, scope: ITEM_SCOPE, targets: ['clothing'] },
  Bags: { gid: 1807065813, scope: ITEM_SCOPE, targets: ['clothing'] },
  Handbags: { gid: 1787419790, scope: ITEM_SCOPE, targets: ['clothing'] },
  Umbrellas: { gid: 1615771759, scope: ITEM_SCOPE, targets: ['clothing', 'items'] },
  Tools: { gid: 1700964087, scope: ITEM_SCOPE, targets: ['tools'] },
  Dishes: { gid: 1483680868, scope: ITEM_SCOPE, targets: ['items'] },
  'Crafting Items': { gid: 529683831, scope: ITEM_SCOPE, targets: ['items'] },
  Shells: { gid: 2043080243, scope: ITEM_SCOPE, targets: ['items'] },
  Plants: { gid: 1421532763, scope: ITEM_SCOPE, targets: ['items'] },
  Turnips: { gid: 1649283485, scope: ITEM_SCOPE, targets: ['items'] },
  Money: { gid: 591835200, scope: ITEM_SCOPE, targets: ['items'] },
  Fencing: { gid: 840585833, scope: ITEM_SCOPE, targets: ['items'] },
  Bugs: { gid: 256433914, scope: ['bugs'], targets: ['bugs'] },
  Fish: { gid: 1155396169, scope: ['fish'], targets: ['fish'] },
  'Sea Creatures': { gid: 1469702740, scope: ['sea'], targets: ['sea'] },
  Fossils: { gid: 1348734603, scope: ['fossils'], targets: ['fossils'] },
  'Fossil Groups': { gid: 1588709382, scope: ['fossils'], targets: ['fossils'] },
  Art: { gid: 1352612647, scope: ['art', 'furniture'], targets: ['art'] },
  Gyroids: { gid: 162274685, scope: ['gyroids'], targets: ['gyroids'] },
  Photos: { gid: 1021197727, scope: ['photos'], targets: ['photos'] },
  Posters: { gid: 896959717, scope: ['photos'], targets: ['photos'] },
  Villagers: { gid: 355555655, scope: ['villagers'], targets: ['villagers'] },
  Music: { gid: 584703766, scope: [], targets: [] }, // music.json ko 오버레이 전용(파일 구조가 다름)
}
const CATCHPHRASE_GID = 150572861 // Villager Catchphrases (Id 조인)

const norm = (s) => String(s || '').toLowerCase().trim()

// ── CSV 파서(따옴표·쉼표·개행 포함 필드 대응) ───────────────────────────
function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQ = false
      } else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

async function fetchText(url, label) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (acnh-ko-gen)' } })
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`)
  return res.text()
}

async function fetchNorviah(name) {
  try {
    const t = await fetchText(NORVIAH_BASE + encodeURIComponent(name) + '.json', `Norviah ${name}`)
    return JSON.parse(t)
  } catch (e) {
    console.warn(`  ! ${e.message}`)
    return []
  }
}

// 번역 시트 탭 → [{ id, euen, usen, ko }]
async function fetchSheetTab(name, gid) {
  const rows = parseCsv(await fetchText(SHEET_CSV(gid), `시트 ${name}`))
  const header = rows[0].map((h) => h.trim())
  const iId = header.indexOf('Id')
  const iEu = header.indexOf('EUen')
  const iUs = header.indexOf('USen')
  const iKo = header.indexOf('KRko')
  if (iKo < 0 || (iEu < 0 && iUs < 0)) throw new Error(`시트 ${name}: 헤더에 EUen/USen/KRko 없음 (${header.join(',')})`)
  return rows.slice(1).map((r) => ({
    id: iId >= 0 ? (r[iId] ?? '').trim() : '',
    euen: norm(r[iEu]),
    usen: norm(r[iUs]),
    ko: (r[iKo] ?? '').trim(),
  })).filter((e) => e.ko && (e.euen || e.usen))
}

// 깨진 번역값 거르기(Norviah 변형 라벨 오염)
const BAD = new Set(['종류 없음', 'No Variations', ''])
const validKo = (r) => {
  const ko = r?.translations?.kRko
  if (!ko || BAD.has(ko)) return null
  const en = r?.translations?.eUen
  if (en && /^no variations$/i.test(en)) return null
  return ko
}

async function readJsonOr(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch { return fallback }
}

// Nookipedia 프록시로 실제 레시피명 목록(recipes.json 축소 유지용)
async function fetchRecipeNames() {
  try {
    const env = Object.fromEntries(
      (await readFile(new URL('../web/.env', import.meta.url), 'utf8'))
        .split(/\r?\n/).filter((l) => l.includes('='))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
    )
    const res = await fetch(
      `${env.VITE_SUPABASE_URL}/functions/v1/${env.VITE_NOOKIPEDIA_FN}/nh/recipes`,
      { headers: { Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` } },
    )
    if (!res.ok) throw new Error(`proxy recipes: HTTP ${res.status}`)
    return new Set((await res.json()).map((r) => norm(r.name)))
  } catch (e) {
    console.warn(`  ! 레시피명 목록 실패(${e.message}) — 기존 recipes.json 키 유지`)
    return null
  }
}

async function main() {
  const outDir = new URL('../web/public/ko/', import.meta.url)
  await mkdir(outDir, { recursive: true })

  // ── ①층: Norviah ──
  console.log('① Norviah 기본층 로드…')
  const maps = {} // category → { key: ko }
  const allNames = {} // 전체 이름 사전(레시피명 폴백용)
  const norviahCache = new Map()
  const getNorviah = async (sheet) => {
    if (!norviahCache.has(sheet)) norviahCache.set(sheet, await fetchNorviah(sheet))
    return norviahCache.get(sheet)
  }
  for (const [cat, sheets] of Object.entries(NORVIAH_MAP)) {
    const map = {}
    for (const sheet of sheets) {
      for (const r of await getNorviah(sheet)) {
        const ko = validKo(r)
        if (!ko) continue
        for (const key of [r.name, r?.translations?.eUen, r?.translations?.uSen]) {
          const k = norm(key)
          if (k && !map[k]) map[k] = ko
          if (k && !allNames[k]) allNames[k] = ko
        }
      }
    }
    maps[cat] = map
  }

  // ── ②층: 기존 커밋된 맵(수동 보강 보존) ──
  console.log('② 기존 ko/*.json 병합…')
  for (const cat of Object.keys(NORVIAH_MAP)) {
    const existing = await readJsonOr(new URL(`${cat}.json`, outDir), {})
    for (const [k, v] of Object.entries(existing)) {
      maps[cat][k] = v // 기존 값이 Norviah 보다 우선(수동 수정 반영분)
      if (!allNames[k]) allNames[k] = v
    }
  }
  const existingRecipes = await readJsonOr(new URL('recipes.json', outDir), {})

  // ── ③층: 라이브 번역 시트 오버레이 ──
  console.log('③ 라이브 번역 시트 오버레이…')
  const stats = {}
  const bump = (cat, kind) => {
    stats[cat] ??= { updated: 0, added: 0 }
    stats[cat][kind]++
  }
  const hasHangul = (s) => /[가-힣]/.test(s)
  const hasKana = (s) => /[぀-ヿ一-鿿]/.test(s) // 가나/한자 = 미번역 유입
  // 아이템류 이름 사전(레시피명 해석용). ⚠ 주민/생물 탭은 여기 넣지 말 것 —
  // 주민 Rocket(4호)이 DIY '로켓' 등 동명 아이템을 오염시킨다.
  const sheetNames = {}
  for (const [tab, { gid, scope, targets }] of Object.entries(SHEET_TABS)) {
    let entries
    try { entries = await fetchSheetTab(tab, gid) } catch (e) { console.warn(`  ! ${e.message}`); continue }
    const itemish = tab === 'Music' || targets.some((t) => ITEM_SCOPE.includes(t))
    for (const e of entries) {
      if (hasKana(e.ko)) continue // KRko 칸에 일본어가 남은 미번역 행
      const keys = [...new Set([e.euen, e.usen].filter(Boolean))]
      if (itemish && hasHangul(e.ko)) for (const k of keys) sheetNames[k] = e.ko
      if (tab === 'Music') continue // music.json 은 아래 별도 처리
      // 같은 영문명이 scope 내 여러 파일에 있으면(예: tank = 가구'탱크'+의류'탱크톱')
      // 서로 다른 아이템의 동명이인 — 이 탭의 targets 파일만 갱신한다.
      const occurrences = scope.filter((cat) => keys.some((k) => k in maps[cat]))
      const updateCats = occurrences.length <= 1 ? occurrences
        : occurrences.filter((cat) => targets.includes(cat))
      for (const cat of updateCats) {
        for (const k of keys) {
          if (maps[cat][k] !== e.ko) bump(cat, k in maps[cat] ? 'updated' : 'added')
          maps[cat][k] = e.ko
        }
      }
      // 신규 이름: 한글 번역이 있는 것만 추가(영문=원문이면 폴백과 동일해 무의미,
      // FtrOneroomBox 류 내부 플레이스홀더 차단)
      if (occurrences.length === 0 && hasHangul(e.ko)) {
        for (const cat of targets) {
          for (const k of keys) { maps[cat][k] = e.ko; bump(cat, 'added') }
        }
      }
    }
    console.log(`  ${tab}: ${entries.length}행`)
  }

  // ── recipes.json: 실제 레시피명만 (프록시 실패 시 기존 키 유지) ──
  const recipeNameSet = await fetchRecipeNames()
  const recipeKeys = recipeNameSet ?? new Set(Object.keys(existingRecipes))
  const recipes = {}
  for (const k of recipeKeys) {
    const ko = sheetNames[k] ?? existingRecipes[k] ?? allNames[k]
    if (ko && !BAD.has(ko)) recipes[k] = ko
  }

  // ── catchphrases.json: 주민 영문명 → 한국어 말버릇 ──
  console.log('④ 말버릇(catchphrases) 생성…')
  const catchphrases = {}
  try {
    const villagers = await fetchSheetTab('Villagers', SHEET_TABS.Villagers.gid)
    const phrases = await fetchSheetTab('Villager Catchphrases', CATCHPHRASE_GID)
    const phraseById = new Map(phrases.filter((p) => p.id).map((p) => [p.id, p.ko]))
    for (const v of villagers) {
      const ko = phraseById.get(v.id)
      if (!ko) continue
      for (const k of [v.euen, v.usen]) if (k) catchphrases[k] = ko
    }
    console.log(`  말버릇 ${Object.keys(catchphrases).length}건`)
  } catch (e) {
    console.warn(`  ! 말버릇 생성 실패(${e.message}) — 기존 파일 유지`)
    Object.assign(catchphrases, await readJsonOr(new URL('catchphrases.json', outDir), {}))
  }

  // ── ④층: 오버라이드(게임 실측 확정값) ──
  const overrides = await readJsonOr(new URL('./ko-overrides.json', import.meta.url), {})
  for (const [file, entries] of Object.entries(overrides)) {
    if (file.startsWith('_')) continue // _comment 등 메타 키
    const target = file === 'recipes' ? recipes : file === 'catchphrases' ? catchphrases : maps[file]
    if (!target) { console.warn(`  ! 오버라이드 대상 없음: ${file}`); continue }
    for (const [k, v] of Object.entries(entries)) target[norm(k)] = v
  }

  // ── 저장 ──
  for (const [cat, map] of Object.entries(maps)) {
    await writeFile(new URL(`${cat}.json`, outDir), JSON.stringify(map))
    const s = stats[cat] ?? { updated: 0, added: 0 }
    console.log(`${cat}: ${Object.keys(map).length} entries (시트 갱신 ${s.updated} · 추가 ${s.added})`)
  }
  await writeFile(new URL('recipes.json', outDir), JSON.stringify(recipes))
  console.log(`recipes: ${Object.keys(recipes).length} entries`)
  await writeFile(new URL('catchphrases.json', outDir), JSON.stringify(catchphrases))

  // ── 음악(앨범 이미지 포함 데이터맵) — Norviah 기반 + 시트 ko 오버레이 ──
  {
    const rows = await getNorviah('Music')
    const existing = await readJsonOr(new URL('music.json', outDir), {})
    const music = {}
    for (const r of rows) {
      const k = norm(r.name)
      if (!k) continue
      music[k] = {
        ko: sheetNames[k] || validKo(r) || existing[k]?.ko || r.name,
        buy: typeof r.buy === 'number' ? r.buy : null,
        sell: typeof r.sell === 'number' ? r.sell : null,
        image: r.albumImage || r.framedImage || null,
        recipe: r.recipe ?? null,
      }
    }
    // Norviah 에 없는 기존 항목 보존
    for (const [k, v] of Object.entries(existing)) if (!music[k]) music[k] = v
    await writeFile(new URL('music.json', outDir), JSON.stringify(music))
    console.log(`music: ${Object.keys(music).length} entries`)
  }

  // ── 레시피 카테고리 / 내부구조(Norviah 전용 — 기존 로직 유지) ──
  {
    const RECIPE_CAT = {
      Housewares: 'furniture', 'Wall-mounted': 'wall', 'Ceiling Decor': 'wall',
      Wallpaper: 'interior', Floors: 'interior', Rugs: 'interior',
      Tools: 'tools', Equipment: 'equipment', Savory: 'food', Sweet: 'food',
      Miscellaneous: 'misc', Other: 'misc',
    }
    const rows = await getNorviah('Recipes')
    const existing = await readJsonOr(new URL('recipe-cats.json', outDir), {})
    const rcat = { ...existing }
    for (const r of rows) {
      const code = RECIPE_CAT[r.category]
      if (!code) continue
      for (const key of [r.name, r?.translations?.eUen, r?.translations?.uSen]) {
        const k = norm(key)
        if (k && !rcat[k]) rcat[k] = code
      }
    }
    await writeFile(new URL('recipe-cats.json', outDir), JSON.stringify(rcat))
    console.log(`recipe-cats: ${Object.keys(rcat).length} entries`)

    const st = await getNorviah('Interior Structures')
    const existingSt = await readJsonOr(new URL('interior-structures.json', outDir), {})
    const structures = { ...existingSt }
    for (const r of st) {
      const k = norm(r.name)
      if (!k) continue
      structures[k] = sheetNames[k] || validKo(r) || structures[k] || r.name
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
