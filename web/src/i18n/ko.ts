// 한국어 라벨 모음. Nookipedia 데이터는 영어 기반이라 표시용 매핑을 둔다.

export const ui = {
  appName: '동물의 숲 도감',
  appNameSub: '도감 · 컬렉션 · 주민 관리',
  login: '로그인',
  loginWithGoogle: 'Google로 로그인',
  logout: '로그아웃',
  loginRequiredToSave: '저장하려면 로그인하세요',
  search: '검색',
  loading: '불러오는 중…',
  error: '오류가 발생했어요',
  empty: '결과가 없어요',
  caught: '채집',
  donated: '기증',
  learned: '습득',
  owned: '보유',
  wishlist: '위시리스트',
  progress: '진행률',
  all: '전체',
  detail: '상세',
  close: '닫기',
  northern: '북반구',
  southern: '남반구',
  sellPrice: '판매가',
  buyPrice: '구매가',
  materials: '재료',
  source: '입수처',
  reform: '리폼',
  reformable: '리폼 가능',
  notReformable: '리폼 불가',
  customKits: '필요 리폼 키트',
  variations: '변형',
  favGift: '호감 선물(추정)',
  estimated: '추정',
}

export const nav = {
  home: '홈',
  calendar: '캘린더',
  critterpedia: '도감',
  items: '아이템',
  recipes: '레시피',
  villagers: '주민',
  settings: '설정',
}

// 설정 · 데이터 관리 페이지
export const settings = {
  title: '데이터 관리',
  intro:
    '동물의 숲 데이터를 한 번 받아 저장해두고 사용합니다. 게임 업데이트 등으로 데이터가 바뀌면 아래 버튼으로 갱신하세요.',
  loginRequired: '데이터를 갱신하려면 로그인하세요.',
  refreshAll: '전체 데이터 갱신',
  refreshing: '갱신 중…',
  lastFetched: '마지막 갱신',
  countLabel: '개수',
  never: '아직 없음',
  doneAll: '갱신 완료',
  failed: '실패',
  retry: '재시도',
}

// nook_dataset 엔드포인트 → 한글 라벨 (events 저장키는 'events:YYYY')
export const datasetLabels: Record<string, string> = {
  fish: '물고기',
  bugs: '곤충',
  sea: '해산물',
  fossils: '화석',
  art: '미술품',
  recipes: 'DIY 레시피',
  villagers: '주민',
  furniture: '가구',
  clothing: '의류',
  interior: '실내장식',
  items: '잡화',
  tools: '도구',
  photos: '사진',
  gyroids: '자이로이드',
  events: '행사',
}

// 저장키('fish' 또는 'events:2026')를 한글 라벨로
export function datasetLabel(key: string): string {
  if (key.startsWith('events:')) return `${datasetLabels.events} (${key.slice(7)})`
  return datasetLabels[key] ?? key
}

// 도감 카테고리
export const critterCategory: Record<string, string> = {
  fish: '물고기',
  bugs: '곤충',
  sea: '해산물',
  fossils: '화석',
  art: '미술품',
}

// 아이템 카테고리
export const itemCategory: Record<string, string> = {
  furniture: '가구',
  clothing: '의류',
  interior: '실내장식',
  tools: '도구',
  items: '잡화',
  photos: '사진',
  gyroids: '자이로이드',
}

// 성격(Nookipedia 영어 키 → 한국어)
export const personality: Record<string, string> = {
  Normal: '친절(보통)',
  Peppy: '명랑',
  Snooty: '성숙(거만)',
  Cranky: '무뚝뚝',
  Lazy: '먹보',
  Jock: '운동광',
  Smug: '느끼',
  'Big sister': '단순(누나)',
  Sisterly: '단순(누나)',
}

// 월 라벨
export const monthLabel = (m: number) => `${m}월`

// 입수처 한국어(레시피 availability.from 등). 키는 Nookipedia 원문과 정확히 일치.
export const sourceLabel: Record<string, string> = {
  // 상점 / 마일 / 제작
  "Nook's Cranny": '너굴 상점',
  'Nook Stop': '너굴 포트(마일 교환)',
  'Nook Miles': '너굴 마일',
  Nintendo: '닌텐도 배포',
  Crafting: '제작',
  // 채집 / 자연
  balloons: '풍선',
  'egg balloon': '알 풍선',
  'message bottle': '유리병 편지',
  'egg bottle': '알 유리병',
  fishing: '낚시',
  rock: '바위(두드리기)',
  axe: '도끼(나무)',
  underground: '땅속(발굴)',
  restaurant: '레스토랑(파니)',
  // NPC
  'Tom Nook': '너굴',
  Isabelle: '여울',
  Blathers: '부엉',
  Celeste: '부옥',
  Brewster: '마스터',
  Cyrus: '리포',
  'Daisy Mae': '무파니',
  Gulliver: '죠니',
  Harvey: '빠삐용',
  Leif: '잎새',
  Pascal: '해탈한',
  Jingle: '룰루',
  Zipper: '토빗',
  'Pavé': '베르리나',
  Jack: '펌킹',
  Niko: '해피홈 파라다이스',
  Daisy: '무파니',
  Mom: '엄마',
  // 이벤트
  'Bunny Day': '부활절',
  'Turkey Day Recipes': '추수감사절 레시피',
  'Cozy Turkey Day DIY': '포근한 추수감사절 DIY',
  'Farway Museum': '박물관 이벤트',
  'Faraway Museum': '박물관 이벤트',
  Snowboy: '눈사람',
  Seasonal: '시즌 이벤트',
  // 레시피 모음(요리/도구 등)
  'Basic Cooking Recipes': '기본 요리 레시피',
  'Be a Chef! DIY Recipes+': '요리사가 되자! DIY 레시피+',
  'DIY for Beginners': '초보자용 DIY',
  'Pretty Good Tools Recipes': '쓸만한 도구 레시피',
  'Test Your DIY Skills': 'DIY 실력 테스트',
  'Custom Fencing in a Flash': '울타리 DIY 레시피',
  'Wildest Dreams DIY': '꿈꾸던 DIY',
  // 주민(성격별)은 villagerSource()에서 단/복수·대소문자 무시로 처리
  Balloons: '풍선',
  // 상점 / NPC / 시설
  'Able Sisters': '에이블 자매(의상실)',
  'apparel shop': '옷가게',
  Kicks: '슈슈(신발가게)',
  "Nook's Cranny (upgraded)": '너굴 상점(확장)',
  'Nook Shopping': '너굴 쇼핑',
  NookLink: '너굴링크',
  Timmy: '콩돌이',
  Tommy: '밤돌이',
  Saharah: '사하라',
  "Saharah's Co-Op": '사하라 협동조합',
  "Redd's Raffle": '갸르송 추첨',
  Reese: '리사',
  Label: '라벨',
  Mabel: '마블',
  "Kapp'n": '갈가펀',
  'C.J.': '저스틴',
  Flick: '레온',
  Wilbur: '로드리',
  Gullivarrr: '해적 죠니',
  Franklin: '프랭클린(추수감사절)',
  Rover: '미파',
  Luna: '루나(꿈섬)',
  Lloid: '로이드',
  Resetti: '다람이',
  Joan: '무파니 할머니',
  Wardell: '와델',
  Lottie: '로티',
  Cornimer: '코니마',
  // 시설 / 장소
  'Bank of Nook': '너굴 은행',
  'Dodo Airlines': '도도 항공',
  'Paradise Planning office': '파라다이스 플래닝',
  'hotel souvenir shop': '호텔 기념품점',
  School: '학교',
  hospital: '병원',
  'Boat tour': '보트 투어',
  'Slumber Island': '꿈섬',
  Archipelago: '외딴섬 투어',
  // 메커니즘
  crafting: '제작',
  cooking: '요리',
  catching: '채집',
  diving: '잠수',
  'dig spot': '땅 파기',
  Ground: '땅',
  beach: '해변',
  tree: '나무',
  balloon: '풍선',
  turnips: '무(순무)',
  'recycle box': '재활용 상자',
  'Lost item': '분실물',
  'Quest item': '퀘스트 보상',
  Unobtainable: '입수 불가',
  Birthday: '생일',
  'May Day': '메이데이',
  'Toy Day stockings': '토이데이 양말',
  communicator: '통신기',
  'communicator part': '통신기 부품',
  friendship: '주민 친밀도',
  'fountain firework': '불꽃놀이',
  'festive wrapping paper': '크리스마스 포장지',
  'lucky red envelope': '세뱃돈 봉투',
  'otoshidama envelope': '세뱃돈 봉투',
  'bokjumeoni lucky pouch': '복주머니',
  // 갸르송(Redd) 관련
  Redd: '갸르송',
  "Redd's Co-Op": '갸르송 협동조합',
  "Jolly Redd's Treasure Trawler": '갸르송의 보물선',
  // 기타
  Gift: '선물',
  mail: '우편',
}

// 입수처 비고(note) 흔한 값
export const noteLabel: Record<string, string> = {
  mailbox: '우편함',
  'mystery island': '신비한 섬',
  'mystery islands': '신비한 섬',
  crafting: '제작',
  'high friendship': '높은 친밀도',
  birthday: '생일',
}
export function tNote(note?: string): string {
  if (!note) return ''
  const lower = note.toLowerCase()
  const hit = Object.keys(noteLabel).find((k) => k.toLowerCase() === lower)
  return hit ? noteLabel[hit] : note
}

// 패턴 기반 변환(꽃/나무/작물 등 규칙적 항목)
const COLOR_TOKEN: Record<string, string> = {
  red: '빨강', blue: '파랑', white: '하양', yellow: '노랑', purple: '보라',
  orange: '주황', pink: '분홍', black: '검정', green: '초록', gold: '황금',
}
const FLOWER_TOKEN: Record<string, string> = {
  rose: '장미', tulip: '튤립', pansy: '팬지', lily: '백합', hyacinth: '히아신스',
  windflower: '아네모네', cosmos: '코스모스', mum: '국화',
}
const TREE_TOKEN: Record<string, string> = {
  apple: '사과', orange: '오렌지', peach: '복숭아', pear: '배', cherry: '체리',
  coconut: '코코넛', cedar: '삼나무', bamboo: '대나무',
}
const CROP_TOKEN: Record<string, string> = {
  tomato: '토마토', potato: '감자', carrot: '당근', wheat: '밀',
  sugarcane: '사탕수수', pumpkin: '호박',
}

function patternSource(from: string): string | null {
  // "<color>-<flower> plant" → "빨강 장미(재배)"
  let m = /^([a-z]+)-([a-z]+) plant$/.exec(from)
  if (m && COLOR_TOKEN[m[1]] && FLOWER_TOKEN[m[2]])
    return `${COLOR_TOKEN[m[1]]} ${FLOWER_TOKEN[m[2]]}(재배)`
  // "<fruit> tree" → "사과나무"
  m = /^([a-z]+) tree$/.exec(from)
  if (m && TREE_TOKEN[m[1]]) return `${TREE_TOKEN[m[1]]}나무`
  // 호박 색상: "green pumpkin" 등
  m = /^([a-z]+) pumpkin$/.exec(from)
  if (m && COLOR_TOKEN[m[1]]) return `${COLOR_TOKEN[m[1]]} 호박`
  // "ripe <x> plant", "<x> start", "seed <x>", "<x>" 작물
  m = /^(?:ripe )?([a-z]+)(?:-pumpkin)?(?: plant| start)?$/.exec(from)
  if (m && CROP_TOKEN[m[1]]) return `${CROP_TOKEN[m[1]]}(재배)`
  return null
}

// 주민 입수처: 데이터는 복수형·대소문자 혼재("Cranky villagers", "Normal villagers",
// "Big Sister villagers", "All villagers" 등). 성격별은 "주민:<성격>", 아무나면 "아무 주민".
const VILLAGER_PERS: Record<string, string> = {
  normal: '친절(보통)',
  peppy: '명랑',
  snooty: '성숙(거만)',
  cranky: '무뚝뚝',
  lazy: '먹보',
  jock: '운동광',
  smug: '느끼',
  'big sister': '단순(누나)',
  sisterly: '단순(누나)',
}
function villagerSource(from: string): string | null {
  const t = from.trim().toLowerCase()
  const m = /^(normal|peppy|snooty|cranky|lazy|jock|smug|big sister|sisterly|all|any)\s+villagers?\b/.exec(t)
  if (m) return m[1] === 'all' || m[1] === 'any' ? '아무 주민' : `주민:${VILLAGER_PERS[m[1]]}`
  if (/^villagers?$/.test(t)) return '주민'
  return null
}

export function tSource(from: string): string {
  if (!from) return ''
  const vil = villagerSource(from)
  if (vil) return vil
  if (sourceLabel[from]) return sourceLabel[from]
  const lower = from.toLowerCase()
  const hit = Object.keys(sourceLabel).find((k) => k.toLowerCase() === lower)
  if (hit) return sourceLabel[hit]
  const pat = patternSource(lower)
  return pat ?? from
}
export function tPersonality(p?: string): string {
  if (!p) return ''
  return personality[p] ?? p
}

// 이벤트(/nh/events 의 event 필드) 한국어화.
// 생일("<주민> 생일")은 주민 데이터에서 별도 처리하므로 tEvent는 ''(건너뜀)를 반환.
// 반구 표기·깨진 유니코드 제거 + 패턴(시작/종료·레시피 시즌·계절) 처리.
// 알 수 없는 minor 이벤트와 노이즈(개화/쇼핑 시즌 경계 등)는 ''로 숨겨 영문 노출을 방지한다.

// 주요 행사 키워드(부분 일치, 소문자 기준). 위가 우선.
const EVENT_TERMS: [RegExp, string][] = [
  [/bunny day/, '부활절'],
  [/festivale/, '페스티벌'],
  [/turkey day/, '추수감사절'],
  [/toy day/, '토이데이'],
  [/halloween/, '핼러윈'],
  [/valentine/, '발렌타인데이'],
  [/wedding season/, '웨딩 시즌'],
  [/may day/, '메이데이'],
  [/fishing tourney/, '낚시 대회'],
  [/bug-?off/, '곤충 채집 대회'],
  [/fireworks show/, '불꽃놀이'],
  [/international museum day/, '국제 박물관의 날'],
  [/museum day/, '박물관의 날'],
  [/nature day/, '자연의 날'],
  [/earth day/, '지구의 날'],
  [/mother'?s day/, '어머니의 날'],
  [/father'?s day/, '아버지의 날'],
  [/children'?s day/, '어린이날'],
  [/april fools'? day/, '만우절'],
  [/shamrock day/, '샴록 데이'],
  [/day of the dead/, '망자의 날'],
  [/new year'?s eve/, '섣달그믐'],
  [/new year'?s day/, '새해'],
  [/lunar new year|seollal|spring festival/, '설날'],
  [/countdown/, '카운트다운'],
  [/music festival/, '뮤직 페스티벌'],
  [/festive (shopping )?season/, '연말 시즌'],
  [/cherry.?blossom/, '벚꽃 시즌'],
  [/maple leaf/, '단풍 시즌'],
  [/mushroom/, '버섯 시즌'],
  [/snowflake/, '눈송이 시즌'],
]

// 레시피 시즌 재료 한글
const SEASON_MATERIAL: [RegExp, string][] = [
  [/cherry.?blossom/, '벚꽃'],
  [/young spring bamboo/, '봄 죽순'],
  [/summer shell/, '여름 조개'],
  [/maple leaf/, '단풍'],
  [/acorn|pine cone/, '도토리·솔방울'],
  [/mushroom/, '버섯'],
  [/snowflake/, '눈송이'],
  [/ornament/, '오너먼트'],
]

const SEASON_WORD: Record<string, string> = {
  spring: '봄', summer: '여름', fall: '가을', winter: '겨울',
}

function matchTerm(terms: [RegExp, string][], s: string): string | null {
  for (const [re, ko] of terms) if (re.test(s)) return ko
  return null
}

// 이벤트의 반구 표기(필터용). 없으면 null(양 반구 공통).
export function eventHemisphere(name: string): 'north' | 'south' | null {
  if (/northern hemisphere/i.test(name)) return 'north'
  if (/southern hemisphere/i.test(name)) return 'south'
  return null
}

export function tEvent(nameRaw?: string): string {
  if (!nameRaw) return ''
  // 깨진 유니코드(서로게이트) 제거
  let s = nameRaw.replace(/[\uD800-\uDFFF]/g, '').trim()
  if (!s) return ''
  // 반구 표기 제거(필터는 eventHemisphere)
  s = s.replace(/\s*\((?:northern|southern) hemisphere\)/i, '').trim()
  const lower = s.toLowerCase()
  // 생일은 별도 처리 → 건너뜀
  if (/'s birthday$/.test(lower)) return ''
  // 노이즈 숨김(개화·쇼핑 시즌 경계·솔스티스·폭설)
  if (/bushes (start|end) blooming|shopping season|solstice|heavy snowstorm/.test(lower)) return ''
  // 레시피 시즌 시작/마지막
  let m: RegExpExecArray | null
  if ((m = /^last day (.*?) recipes are available$/.exec(lower))) {
    return `${matchTerm(SEASON_MATERIAL, m[1]) ?? m[1]} 레시피 마지막 날`
  }
  if ((m = /^(.*?) recipes become available$/.exec(lower))) {
    return `${matchTerm(SEASON_MATERIAL, m[1]) ?? m[1]} 레시피 시작`
  }
  // 계절 시작/마지막
  if ((m = /^(first|last) day of (?:the )?(spring|summer|fall|winter)\b/.exec(lower))) {
    return `${SEASON_WORD[m[2]]} ${m[1] === 'first' ? '시작' : '마지막 날'}`
  }
  // 시작/종료 suffix 분리
  let suffix = ''
  let core = lower
  if ((m = /^(.*?) (?:nook shopping event|able sisters event|event) (begins?|ends?)$/.exec(lower))) {
    core = m[1]; suffix = m[2].startsWith('begin') ? ' 시작' : ' 종료'
  } else if ((m = /^(.*?) (begins?|ends?)$/.exec(lower))) {
    core = m[1]; suffix = m[2].startsWith('begin') ? ' 시작' : ' 종료'
  }
  const term = matchTerm(EVENT_TERMS, core)
  if (term) return term + suffix
  // 알 수 없는 minor 이벤트는 숨김(영문 노출 방지)
  return ''
}

// 캘린더 이벤트 앞 작은 아이콘(이모지). 이벤트 원문(영문)으로 종류·시작/종료 판정.
// 특정 종류(낚시/곤충/계절 시작)는 전용 아이콘이 시작/종료 화살표보다 우선.
export function eventIcon(nameRaw?: string): string {
  if (!nameRaw) return '🎉'
  const lower = nameRaw
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/\s*\((?:northern|southern) hemisphere\)/i, '')
    .toLowerCase()
    .trim()
  // 전용 아이콘(종류 우선)
  if (/fishing tourney/.test(lower)) return '🎣' // 낚시대회 → 낚싯대
  if (/bug-?off/.test(lower)) return '🪲' // 곤충채집대회 → 잠자리채(대체 이모지)
  let m: RegExpExecArray | null
  if ((m = /(first|last) day of (?:the )?(spring|summer|fall|winter)\b/.exec(lower))) {
    if (m[1] === 'first') return { spring: '🌸', summer: '☀️', fall: '🍁', winter: '⛄' }[m[2]]! // 계절 시작
    return '◀️' // 계절 마지막
  }
  // 시작/종료 방향 화살표
  if (/(begins?|become available)$/.test(lower) || /^(?:.*\s)?first day\b/.test(lower)) return '▶️' // START
  if (/(ends?|are available)$/.test(lower) || /last day\b/.test(lower)) return '◀️' // END
  return '🎉'
}
