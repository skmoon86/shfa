import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// 사용자 환경설정: 반구(기본 북) + 숨긴 프리셋 목록.
export interface UserPrefs {
  hemisphere: 'north' | 'south'
  enabledPresets: string[] // 표시할 프리셋 명. 빈 배열이면 전부 표시(기본).
}

const DEFAULT_PREFS: UserPrefs = { hemisphere: 'north', enabledPresets: [] }

export function useUserPrefs() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['user-prefs', uid]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<UserPrefs> => {
      const { data, error } = await supabase
        .from('user_prefs')
        .select('hemisphere, enabled_presets')
        .maybeSingle()
      if (error) throw error
      if (!data) return DEFAULT_PREFS
      return {
        hemisphere: (data.hemisphere as 'north' | 'south') ?? 'north',
        enabledPresets: (data.enabled_presets as string[]) ?? [],
      }
    },
  })

  const update = useMutation({
    mutationFn: async (patch: Partial<UserPrefs>) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const cur = qc.getQueryData<UserPrefs>(key) ?? DEFAULT_PREFS
      const next = { ...cur, ...patch }
      const { error } = await supabase.from('user_prefs').upsert({
        user_id: uid,
        hemisphere: next.hemisphere,
        enabled_presets: next.enabledPresets,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return next
    },
    onSuccess: (next) => qc.setQueryData<UserPrefs>(key, next),
  })

  return { prefs: query.data ?? DEFAULT_PREFS, isLoading: query.isLoading, update }
}
