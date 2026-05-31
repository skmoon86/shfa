import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  // 개발 편의를 위한 명확한 에러 메시지
  console.error(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다. web/.env 를 확인하세요.',
  )
}

// 환경변수가 없을 때도 앱이 즉시 크래시하지 않도록 placeholder 사용
// (네트워크 호출 시 명확한 오류로 안내됨)
const safeUrl = url || 'https://placeholder.supabase.co'
const safeKey = anonKey || 'placeholder-anon-key'

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const SUPABASE_URL = safeUrl
export const SUPABASE_ANON_KEY = safeKey
export const NOOKIPEDIA_FN =
  (import.meta.env.VITE_NOOKIPEDIA_FN as string) || 'nookipedia-proxy'
