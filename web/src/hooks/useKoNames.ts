import { useQuery } from '@tanstack/react-query'

// 카테고리별 "영문명 → 한글명" 슬림 맵(/public/ko/<category>.json)을 lazy 로드.
// 반환값은 ko(englishName) 함수: 매핑 없으면 원문(영문) 폴백.
export function useKoNames(category: string) {
  const { data } = useQuery({
    queryKey: ['ko', category],
    queryFn: async (): Promise<Record<string, string>> => {
      const res = await fetch(`/ko/${category}.json`)
      if (!res.ok) return {}
      return res.json()
    },
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
