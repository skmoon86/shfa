import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Supabase(PostgREST) 기본 조회 한도는 1000행. 보유/도감 행이 1000을 넘으면
// 페이지네이션 없이는 앞 1000개만 와서 나머지가 '미보유'로 보인다.
// .range()로 1000개씩 끝까지 받아 합친다.
const PAGE_SIZE = 1000
async function selectAll<T>(
  table: string,
  columns: string,
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const rows = (data ?? []) as T[]
    all.push(...rows)
    if (rows.length < PAGE_SIZE) break
  }
  return all
}

// ── 도감 진행상황 ─────────────────────────────────────────
export interface CritterState {
  caught: boolean
  donated: boolean
  model: boolean // 모형 보유(물고기·곤충 한정, 저스틴/레온 주문 제작)
}
type CritterMap = Record<string, CritterState> // key: `${category}:${entryId}`

export function useCritterpedia() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['critterpedia', uid]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<CritterMap> => {
      const rows = await selectAll<{
        category: string
        entry_id: string
        caught: boolean
        donated: boolean
        model: boolean | null
      }>('critterpedia_progress', 'category, entry_id, caught, donated, model')
      const map: CritterMap = {}
      for (const r of rows) {
        map[`${r.category}:${r.entry_id}`] = {
          caught: r.caught,
          donated: r.donated,
          model: r.model ?? false,
        }
      }
      return map
    },
  })

  const toggle = useMutation({
    mutationFn: async (args: {
      category: string
      entryId: string
      field: 'caught' | 'donated' | 'model'
    }) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const cur =
        (qc.getQueryData<CritterMap>(key) ?? {})[
          `${args.category}:${args.entryId}`
        ] ?? { caught: false, donated: false, model: false }
      const next = { ...cur, [args.field]: !cur[args.field] }
      // 기증하면 자동으로 채집 처리
      if (args.field === 'donated' && next.donated) next.caught = true
      const { error } = await supabase.from('critterpedia_progress').upsert({
        user_id: uid,
        category: args.category,
        entry_id: args.entryId,
        caught: next.caught,
        donated: next.donated,
        model: next.model,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return { ...args, next }
    },
    onSuccess: (res) => {
      qc.setQueryData<CritterMap>(key, (old) => ({
        ...(old ?? {}),
        [`${res.category}:${res.entryId}`]: res.next,
      }))
    },
  })

  return { map: query.data ?? {}, isLoading: query.isLoading, toggle }
}

// ── 레시피 습득 ───────────────────────────────────────────
export function useRecipeProgress() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['recipes-progress', uid]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<Set<string>> => {
      const rows = await selectAll<{ recipe_id: string; learned: boolean }>(
        'recipe_progress',
        'recipe_id, learned',
      )
      return new Set(rows.filter((r) => r.learned).map((r) => r.recipe_id))
    },
  })

  const toggle = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const learned = !(qc.getQueryData<Set<string>>(key) ?? new Set()).has(
        recipeId,
      )
      const { error } = await supabase.from('recipe_progress').upsert({
        user_id: uid,
        recipe_id: recipeId,
        learned,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return { recipeId, learned }
    },
    onSuccess: ({ recipeId, learned }) => {
      qc.setQueryData<Set<string>>(key, (old) => {
        const next = new Set(old ?? [])
        if (learned) next.add(recipeId)
        else next.delete(recipeId)
        return next
      })
    },
  })

  return { learned: query.data ?? new Set<string>(), isLoading: query.isLoading, toggle }
}

// ── 아이템 컬렉션(보유/위시리스트/숨김) ───────────────────
export interface ItemState {
  owned: boolean
  wishlist: boolean
  hidden: boolean
}
type ItemMap = Record<string, ItemState>

export function useItemCollection() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['item-collection', uid]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<ItemMap> => {
      const rows = await selectAll<{
        item_id: string
        owned: boolean
        wishlist: boolean
        hidden: boolean
      }>('item_collection', 'item_id, owned, wishlist, hidden')
      const map: ItemMap = {}
      for (const r of rows) {
        map[r.item_id] = { owned: r.owned, wishlist: r.wishlist, hidden: r.hidden }
      }
      return map
    },
  })

  const toggle = useMutation({
    mutationFn: async (args: {
      itemId: string
      category: string
      field: 'owned' | 'wishlist' | 'hidden'
    }) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const cur =
        (qc.getQueryData<ItemMap>(key) ?? {})[args.itemId] ?? {
          owned: false,
          wishlist: false,
          hidden: false,
        }
      const next = { ...cur, [args.field]: !cur[args.field] }
      const { error } = await supabase.from('item_collection').upsert({
        user_id: uid,
        item_id: args.itemId,
        category: args.category,
        owned: next.owned,
        wishlist: next.wishlist,
        hidden: next.hidden,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return { itemId: args.itemId, next }
    },
    onSuccess: ({ itemId, next }) => {
      qc.setQueryData<ItemMap>(key, (old) => ({ ...(old ?? {}), [itemId]: next }))
    },
  })

  return { map: query.data ?? {}, isLoading: query.isLoading, toggle }
}

// ── 즐겨찾기 주민 ─────────────────────────────────────────
export function useFavoriteVillagers() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['favorite-villagers', uid]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('favorite_villagers')
        .select('villager_id')
      if (error) throw error
      return new Set((data ?? []).map((r) => r.villager_id))
    },
  })

  const toggle = useMutation({
    mutationFn: async (villagerId: string) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const isFav = (qc.getQueryData<Set<string>>(key) ?? new Set()).has(
        villagerId,
      )
      if (isFav) {
        const { error } = await supabase
          .from('favorite_villagers')
          .delete()
          .eq('user_id', uid)
          .eq('villager_id', villagerId)
        if (error) throw error
        return { villagerId, fav: false }
      } else {
        const { error } = await supabase
          .from('favorite_villagers')
          .insert({ user_id: uid, villager_id: villagerId })
        if (error) throw error
        return { villagerId, fav: true }
      }
    },
    onSuccess: ({ villagerId, fav }) => {
      qc.setQueryData<Set<string>>(key, (old) => {
        const next = new Set(old ?? [])
        if (fav) next.add(villagerId)
        else next.delete(villagerId)
        return next
      })
    },
  })

  return { favorites: query.data ?? new Set<string>(), toggle }
}

// ── 주민 액자(사진) 획득 ──────────────────────────────────
export function useVillagerPhotos() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['villager-photos', uid]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('villager_photos')
        .select('villager_id')
      if (error) throw error
      return new Set((data ?? []).map((r) => r.villager_id))
    },
  })

  const toggle = useMutation({
    mutationFn: async (villagerId: string) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const has = (qc.getQueryData<Set<string>>(key) ?? new Set()).has(
        villagerId,
      )
      if (has) {
        const { error } = await supabase
          .from('villager_photos')
          .delete()
          .eq('user_id', uid)
          .eq('villager_id', villagerId)
        if (error) throw error
        return { villagerId, has: false }
      } else {
        const { error } = await supabase
          .from('villager_photos')
          .insert({ user_id: uid, villager_id: villagerId })
        if (error) throw error
        return { villagerId, has: true }
      }
    },
    onSuccess: ({ villagerId, has }) => {
      qc.setQueryData<Set<string>>(key, (old) => {
        const next = new Set(old ?? [])
        if (has) next.add(villagerId)
        else next.delete(villagerId)
        return next
      })
    },
  })

  return { photos: query.data ?? new Set<string>(), toggle }
}
