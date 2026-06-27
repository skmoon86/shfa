import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

// Nookipedia 데이터는 거의 정적이므로 길게 캐시한다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1시간 (사용자/진행상황 쿼리 기본값)
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// 저장본(nook_dataset)·한글맵(ko/*.json)은 갱신 버튼으로만 바뀌므로 무기한 신선 처리.
// → 페이지 재방문/새로고침 시 재조회하지 않고 IndexedDB 영속 캐시에서 즉시 표시.
queryClient.setQueryDefaults(['nook'], { staleTime: Infinity, gcTime: Infinity })
queryClient.setQueryDefaults(['ko'], { staleTime: Infinity, gcTime: Infinity })

// IndexedDB 기반 영속 저장소(오프라인·재실행 즉시 표시).
// auth/Supabase 진행상황 응답은 영속 대상에서 제외(main.tsx의 dehydrate 필터).
export const idbPersister = createAsyncStoragePersister({
  key: 'acnh-rq-cache',
  storage: {
    getItem: (k: string) => get<string>(k).then((v) => v ?? null),
    setItem: (k: string, v: string) => set(k, v),
    removeItem: (k: string) => del(k),
  },
})
