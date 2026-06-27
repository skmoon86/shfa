import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { DateProvider } from './context/DateContext.tsx'
import { queryClient, idbPersister } from './lib/queryClient.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbPersister,
        maxAge: Infinity, // 저장본은 갱신 버튼으로만 바뀌므로 만료시키지 않음
        buster: 'nook-v1', // 데이터 구조 변경 시 이 값을 올려 영속 캐시 무효화
        dehydrateOptions: {
          // nook(저장본)·ko(한글맵)만 영속. auth/Supabase 진행상황은 제외.
          shouldDehydrateQuery: (q) => {
            const k = q.queryKey?.[0]
            return (k === 'nook' || k === 'ko') && q.state.status === 'success'
          },
        },
      }}
    >
      <AuthProvider>
        <DateProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DateProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
