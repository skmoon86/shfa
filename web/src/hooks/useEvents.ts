import { useQuery } from '@tanstack/react-query'
import { nookipedia, type NHEvent } from '../lib/nookipedia'

// /nh/events?year=YYYY → 날짜별 행사(북반구 기준). 연 단위로 캐시.
export function useEvents(year: number) {
  return useQuery({
    queryKey: ['nook', 'events', year],
    queryFn: () => nookipedia.events({ year }),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// 특정 ISO 날짜(YYYY-MM-DD)의 이벤트만 추리는 헬퍼.
export function eventsOn(events: NHEvent[] | undefined, iso: string): NHEvent[] {
  if (!events) return []
  return events.filter((e) => e.date === iso)
}
