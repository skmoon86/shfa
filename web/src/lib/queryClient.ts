import { QueryClient } from '@tanstack/react-query'

// Nookipedia 데이터는 거의 정적이므로 길게 캐시한다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1시간
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
