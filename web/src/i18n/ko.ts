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
  critterpedia: '도감',
  items: '아이템',
  recipes: 'DIY 레시피',
  villagers: '주민',
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
  Pascal: '라코스케',
  Jingle: '룰루',
  Zipper: '토독',
  'Pavé': '파베',
  Jack: '펌킹',
  Niko: '니코',
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
  // 주민(성격별)
  'any villager': '아무 주민',
  'normal villager': '친절(보통) 주민',
  'peppy villager': '명랑 주민',
  'snooty villager': '성숙(거만) 주민',
  'cranky villager': '무뚝뚝 주민',
  'lazy villager': '먹보 주민',
  'jock villager': '운동광 주민',
  'smug villager': '느끼 주민',
  'big sister villager': '단순(누나) 주민',
  Villagers: '주민',
  Villager: '주민',
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

export function tSource(from: string): string {
  if (!from) return ''
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
