import { useQuery, useQueries } from '@tanstack/react-query'

async function fetchKo(category: string): Promise<Record<string, string>> {
  const res = await fetch(`/ko/${category}.json`)
  if (!res.ok) return {}
  return res.json()
}

// 카테고리별 "영문명 → 한글명" 슬림 맵(/public/ko/<category>.json)을 lazy 로드.
// 반환값은 ko(englishName) 함수: 매핑 없으면 원문(영문) 폴백.
export function useKoNames(category: string) {
  const { data } = useQuery({
    queryKey: ['ko', category],
    queryFn: () => fetchKo(category),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  const map = data ?? {}
  return (name?: string) => {
    if (!name) return ''
    return map[name.toLowerCase().trim()] ?? name
  }
}

// 여러 카테고리를 동시에 로드. 반환값은 ko(name, category) 함수.
export function useKoNamesMulti(categories: string[]) {
  const results = useQueries({
    queries: categories.map((c) => ({
      queryKey: ['ko', c],
      queryFn: () => fetchKo(c),
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
    })),
  })
  const maps: Record<string, Record<string, string>> = {}
  categories.forEach((c, i) => {
    maps[c] = results[i].data ?? {}
  })
  return (name?: string, category?: string) => {
    if (!name) return ''
    const m = category ? maps[category] : undefined
    return (m && m[name.toLowerCase().trim()]) ?? name
  }
}
