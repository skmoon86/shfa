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

// 입수처 한국어(레시피 availability.from 등)
export const sourceLabel: Record<string, string> = {
  Villagers: '주민',
  Villager: '주민',
  Balloons: '풍선',
  Balloon: '풍선',
  'Message bottles': '유리병 편지',
  'Message in a bottle': '유리병 편지',
  "Nook's Cranny": '너굴 상점',
  'Nook Stop': '너굴 포트(마일)',
  'Nook Miles': '너굴 마일',
  Crafting: '제작',
  'Tom Nook': '너굴',
  Isabelle: '여울',
  Mom: '엄마',
  'Gulliver': '죠니',
  'Seasonal': '시즌 이벤트',
}

export function tSource(from: string): string {
  return sourceLabel[from] ?? from
}
export function tPersonality(p?: string): string {
  if (!p) return ''
  return personality[p] ?? p
}
