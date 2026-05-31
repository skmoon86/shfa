// 열거형 값 한글 사전. 이름(useKoNames) 외 모든 명칭을 한글로 표시하기 위한 매핑.
// 매핑 없으면 원문 폴백.

export const species: Record<string, string> = {
  Alligator: '악어', Anteater: '개미핥기', Bear: '곰', Bird: '새', Bull: '황소',
  Cat: '고양이', Chicken: '닭', Cow: '소', Cub: '새끼곰', Deer: '사슴',
  Dog: '개', Duck: '오리', Eagle: '독수리', Elephant: '코끼리', Frog: '개구리',
  Goat: '염소', Gorilla: '고릴라', Hamster: '햄스터', Hippo: '하마', Horse: '말',
  Kangaroo: '캥거루', Koala: '코알라', Lion: '사자', Monkey: '원숭이', Mouse: '쥐',
  Octopus: '문어', Ostrich: '타조', Penguin: '펭귄', Pig: '돼지', Rabbit: '토끼',
  Rhino: '코뿔소', Sheep: '양', Squirrel: '다람쥐', Tiger: '호랑이', Wolf: '늑대',
}

export const gender: Record<string, string> = { Male: '남성', Female: '여성' }

export const sign: Record<string, string> = {
  Aquarius: '물병자리', Aries: '양자리', Cancer: '게자리', Capricorn: '염소자리',
  Gemini: '쌍둥이자리', Leo: '사자자리', Libra: '천칭자리', Pisces: '물고기자리',
  Sagittarius: '사수자리', Scorpio: '전갈자리', Taurus: '황소자리', Virgo: '처녀자리',
}

export const hobby: Record<string, string> = {
  Education: '교육', Fashion: '패션', Fitness: '운동', Music: '음악',
  Nature: '자연', Play: '놀이',
}

// 취향 스타일(의류 스타일과 동일 어휘)
export const style: Record<string, string> = {
  Active: '액티브', Cool: '쿨', Cute: '큐트', Elegant: '엘레강스',
  Gorgeous: '고저스', Simple: '심플',
}

export const color: Record<string, string> = {
  Aqua: '하늘색', Beige: '베이지', Black: '검정', Blue: '파랑', Brown: '갈색',
  Colorful: '컬러풀', Gray: '회색', Green: '초록', Orange: '주황', Pink: '분홍',
  Purple: '보라', Red: '빨강', White: '하양', Yellow: '노랑',
}

export const month: Record<string, string> = {
  January: '1월', February: '2월', March: '3월', April: '4월', May: '5월',
  June: '6월', July: '7월', August: '8월', September: '9월', October: '10월',
  November: '11월', December: '12월',
}

// 물고기/해산물 서식지
export const fishLocation: Record<string, string> = {
  Pier: '부두', Pond: '연못', River: '강', 'River (clifftop)': '강(절벽 위)',
  'River (mouth)': '강(하구)', Sea: '바다', 'Sea (raining)': '바다(비 올 때)',
}

// 그림자 크기
export const shadow: Record<string, string> = {
  Tiny: '극소', Small: '소', Medium: '중', Large: '대', 'Very large': '특대',
  'Very large (finned)': '특대(지느러미)', Huge: '초대형', Long: '길쭉함',
}

// 곤충 출현 위치
export const bugLocation: Record<string, string> = {
  Flying: '날아다님',
  'Flying near flowers': '꽃 주변 비행',
  'Flying near light sources': '불빛 주변 비행',
  'Flying near water': '물가 비행',
  'Flying near blue, purple, and black flowers': '파랑·보라·검정 꽃 주변',
  'Flying near trash or rotten turnips': '쓰레기·썩은 무 주변',
  'On flowers': '꽃 위',
  'On white flowers': '하얀 꽃 위',
  'On trees (any kind)': '나무 위(종류 무관)',
  'On trees (hardwood and cedar)': '나무 위(활엽수·침엽수)',
  'On palm trees': '야자나무 위',
  'On the ground': '땅 위',
  'On rocks and bushes': '바위·덤불 위',
  'On beach rocks': '해변 바위 위',
  'On rivers and ponds': '강·연못 위',
  'On tree stumps': '그루터기 위',
  'On villagers': '주민 몸에',
  'On/near spoiled turnips/candy/lollipops': '썩은 무·사탕 주변',
  'Disguised on shoreline': '해안가에 위장',
  'Disguised under trees': '나무 아래 위장',
  'From hitting rocks': '바위를 치면',
  'Pushing snowballs': '눈덩이 굴리는 중',
  'Shaking trees': '나무 흔들기',
  'Shaking trees (hardwood and cedar)': '나무 흔들기(활엽수·침엽수)',
  'Shaking non-fruit hardwood trees or cedar trees': '열매 없는 활엽수·침엽수 흔들기',
  Underground: '땅속',
}

// 아이템 카테고리(상세 모달 등)
export const itemCategoryName: Record<string, string> = {
  Housewares: '가구', 'Wall-mounted': '벽걸이', Miscellaneous: '잡화',
  'Ceiling Decor': '천장 장식', Wallpaper: '벽지', Floors: '바닥', Rugs: '러그',
  Tops: '상의', Bottoms: '하의', 'Dress-Up': '원피스', Headwear: '모자',
  Accessories: '액세서리', Socks: '양말', Shoes: '신발', Bags: '가방',
  Tools: '도구', Photos: '사진', Posters: '포스터', Gyroids: '자이로이드',
  Fencing: '울타리', Music: '음악', Umbrellas: '우산', Other: '기타',
}

// 아이템 테마(HHA)
export const theme: Record<string, string> = {
  'Amusement park': '놀이공원', Ancient: '고대', 'Apparel shop': '옷가게',
  Arcade: '오락실', Bathroom: '욕실', 'Café': '카페', Cafe: '카페',
  "Child's room": '아이 방', 'City life': '도시', Concert: '콘서트',
  'Construction site': '공사장', Den: '서재', European: '유럽풍',
  Expensive: '고급', Facility: '시설', Fancy: '팬시', Fantasy: '판타지',
  Fitness: '피트니스', 'Freezing cold': '한랭', Garden: '정원',
  Harmonious: '조화', Heritage: '전통', Horror: '호러', Hospital: '병원',
  Kitchen: '주방', Lab: '실험실', 'Living room': '거실', Local: '향토',
  Music: '음악', Nature: '자연', Ocean: '바다', Office: '사무실',
  Outdoors: '야외', Park: '공원', Party: '파티', 'Public bath': '대중목욕탕',
  Resort: '리조트', Restaurant: '레스토랑', Retro: '레트로', School: '학교',
  'Sci-Fi': 'SF', 'Sci-fi': 'SF', Shop: '상점', Space: '우주', Sports: '스포츠',
  Stylish: '스타일리시', Supermarket: '슈퍼마켓', Workshop: '작업실',
}

// 범용 변환기: 사전에 없으면 원문 유지
export function tr(map: Record<string, string>, v?: string): string {
  if (!v) return ''
  return map[v] ?? v
}

// 배열용
export function trList(map: Record<string, string>, arr?: string[]): string {
  if (!arr || arr.length === 0) return ''
  return arr.map((x) => map[x] ?? x).join(', ')
}
