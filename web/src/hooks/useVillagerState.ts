import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// 주민 3상태: 거주(resident) · 위시(wish) · 액자(photo).
// 기존 favorite_villagers/villager_photos는 0004에서 villager_state로 백필됨.
export interface VillagerStateRow {
  resident: boolean
  wish: boolean
  photo: boolean
}
type VillagerStateMap = Record<string, VillagerStateRow>
export type VillagerField = 'resident' | 'wish' | 'photo'

export function useVillagerState() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['villager-state', uid]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<VillagerStateMap> => {
      const { data, error } = await supabase
        .from('villager_state')
        .select('villager_id, resident, wish, photo')
      if (error) throw error
      const map: VillagerStateMap = {}
      for (const r of data ?? []) {
        map[r.villager_id] = { resident: r.resident, wish: r.wish, photo: r.photo }
      }
      return map
    },
  })

  const toggle = useMutation({
    mutationFn: async (args: { villagerId: string; field: VillagerField }) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const cur =
        (qc.getQueryData<VillagerStateMap>(key) ?? {})[args.villagerId] ?? {
          resident: false,
          wish: false,
          photo: false,
        }
      const next = { ...cur, [args.field]: !cur[args.field] }
      const { error } = await supabase.from('villager_state').upsert({
        user_id: uid,
        villager_id: args.villagerId,
        resident: next.resident,
        wish: next.wish,
        photo: next.photo,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return { villagerId: args.villagerId, next }
    },
    onSuccess: ({ villagerId, next }) => {
      qc.setQueryData<VillagerStateMap>(key, (old) => ({
        ...(old ?? {}),
        [villagerId]: next,
      }))
    },
  })

  return { map: query.data ?? {}, isLoading: query.isLoading, toggle }
}
