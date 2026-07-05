import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { nookipedia } from '../lib/nookipedia'
import type { Furniture, Clothing, Interior, Item, Tool, Gyroid, Art, Recipe, Photo, Villager } from '../lib/nookipedia'
import { classify, type Bucket, type ItemRow, type MusicMap } from '../lib/itemBuckets'
import { useItemCollection } from './useProgress'

// 8개 엔드포인트(photos는 NPC 액자만) + recipes/art + music.json/interior-structures.json을
// 한 번 모아 분류기를 적용하는 통합 스토어. ItemsPage·HomePage·RecipesPage 공유.
// villagers는 주민용 액자 제외 판별용 — 홈/주민 페이지와 동일 키·params라 캐시 공유.

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) return fallback
  return res.json()
}

export interface BucketRate {
  owned: number
  total: number
  rate: number // 0~1
}

export function useItemsStore() {
  // Nookipedia 엔드포인트(키 ['nook',cat]는 기존 페이지와 공유 → 캐시 재사용)
  const results = useQueries({
    queries: [
      { queryKey: ['nook', 'furniture'], queryFn: () => nookipedia.furniture() },
      { queryKey: ['nook', 'clothing'], queryFn: () => nookipedia.clothing() },
      { queryKey: ['nook', 'interior'], queryFn: () => nookipedia.interior() },
      { queryKey: ['nook', 'items'], queryFn: () => nookipedia.items() },
      { queryKey: ['nook', 'tools'], queryFn: () => nookipedia.tools() },
      { queryKey: ['nook', 'gyroids'], queryFn: () => nookipedia.gyroids() },
      { queryKey: ['nook', 'recipes'], queryFn: () => nookipedia.recipes() },
      { queryKey: ['nook', 'art'], queryFn: () => nookipedia.art() },
      { queryKey: ['nook', 'photos'], queryFn: () => nookipedia.photos() },
      { queryKey: ['nook', 'villagers'], queryFn: () => nookipedia.villagers({ nhdetails: true }) },
    ],
  })
  // 신규 쿼리는 맨 끝에만 추가할 것 — 중간 삽입 시 구조분해 인덱스가 조용히 밀린다.
  const [furnitureQ, clothingQ, interiorQ, itemsQ, toolsQ, gyroidsQ, recipesQ, artQ, photosQ, villagersQ] = results

  const musicQ = useQuery({
    queryKey: ['ko', 'music'],
    queryFn: () => fetchJson<MusicMap>('/ko/music.json', {}),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  const structuresQ = useQuery({
    queryKey: ['ko', 'interior-structures'],
    queryFn: () => fetchJson<Record<string, string>>('/ko/interior-structures.json', {}),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  const { map: itemMap } = useItemCollection()

  const { rows, byBucket, modelNames } = useMemo(() => {
    return classify({
      furniture: (furnitureQ.data ?? []) as Furniture[],
      clothing: (clothingQ.data ?? []) as Clothing[],
      interior: (interiorQ.data ?? []) as Interior[],
      items: (itemsQ.data ?? []) as Item[],
      tools: (toolsQ.data ?? []) as Tool[],
      gyroids: (gyroidsQ.data ?? []) as Gyroid[],
      music: musicQ.data ?? {},
      art: (artQ.data ?? []) as Art[],
      recipes: (recipesQ.data ?? []) as Recipe[],
      photos: (photosQ.data ?? []) as Photo[],
      villagerNames: new Set(((villagersQ.data ?? []) as Villager[]).map((v) => v.name.toLowerCase())),
      structureNames: new Set(Object.keys(structuresQ.data ?? {})),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    furnitureQ.data, clothingQ.data, interiorQ.data, itemsQ.data, toolsQ.data,
    gyroidsQ.data, musicQ.data, artQ.data, recipesQ.data, photosQ.data,
    villagersQ.data, structuresQ.data,
  ])

  // 보유율(숨김 제외). rows를 받아 owned/total 계산.
  const rate = (rs: ItemRow[]): BucketRate => {
    const visible = rs.filter((r) => !itemMap[r.name]?.hidden)
    const owned = visible.filter((r) => itemMap[r.name]?.owned).length
    const total = visible.length
    return { owned, total, rate: total ? owned / total : 0 }
  }
  const bucketRate = (b: Bucket): BucketRate => rate(byBucket[b])

  // 핵심 엔드포인트(furniture/clothing/interior/items)가 모두 비면 로딩/에러로 본다.
  const coreLoading = furnitureQ.isLoading || clothingQ.isLoading || interiorQ.isLoading || itemsQ.isLoading
  const allError = results.every((r) => r.isError)
  const anyError = results.some((r) => r.isError)

  return {
    rows,
    byBucket,
    modelNames,
    itemMap,
    rate,
    bucketRate,
    isLoading: coreLoading && rows.length === 0,
    anyError,
    allError,
  }
}
