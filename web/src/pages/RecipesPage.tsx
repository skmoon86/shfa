import { useMemo, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { nookipedia, type Recipe } from '../lib/nookipedia'
import type { DetailItem } from '../components/ItemDetailModal'
import { useRecipeProgress } from '../hooks/useProgress'
import { useKoNames } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { ProgressBar } from '../components/ProgressBar'
import { CategoryTabs } from '../components/CategoryTabs'
import { RecipeDetailModal } from '../components/RecipeDetailModal'
import { ui, tSource } from '../i18n/ko'
import { fmtBells } from '../lib/format'

// 레시피로 제작되는 결과물 아이템을 이름으로 찾기 위해 조회하는 카테고리
type DataCat = 'furniture' | 'interior' | 'tools' | 'items' | 'photos' | 'gyroids'
const ITEM_CATS: DataCat[] = ['furniture', 'interior', 'tools', 'items', 'photos', 'gyroids']

// 레시피 대분류(가구/벽걸이·천장/벽지·바닥·러그/도구/설비/요리/잡화)
const RECIPE_CATS: { code: string; label: string }[] = [
  { code: 'furniture', label: '가구' },
  { code: 'wall', label: '벽걸이·천장' },
  { code: 'interior', label: '벽지·바닥·러그' },
  { code: 'tools', label: '도구' },
  { code: 'equipment', label: '설비' },
  { code: 'food', label: '요리' },
  { code: 'misc', label: '잡화' },
]

export function RecipesPage() {
  const [q, setQ] = useState('')
  const [source, setSource] = useState<string>('')
  const [rcats, setRcats] = useState<Set<string>>(new Set())
  const [learnFilter, setLearnFilter] = useState<'all' | 'learned' | 'unlearned'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'name'>('default')
  const [detail, setDetail] = useState<Recipe | null>(null)
  const canSave = useCanSave()
  const { learned, toggle } = useRecipeProgress()
  const ko = useKoNames('recipes')
  const koItem = useKoNames('items')
  const catOf = useKoNames('recipe-cats') // 레시피명 → 대분류 코드

  const query = useQuery({
    queryKey: ['nook', 'recipes'],
    queryFn: () => nookipedia.recipes(),
  })
  const data = query.data ?? []

  // 상세 카드를 열 때만 결과물 아이템 데이터를 로드(아이템 페이지와 캐시 공유)
  const itemQueries = useQueries({
    queries: ITEM_CATS.map((c) => ({
      queryKey: ['nook', c],
      queryFn: () => nookipedia[c]() as Promise<DetailItem[]>,
      enabled: !!detail,
    })),
  })
  // 레시피 이름 → 제작 결과 아이템(이름 일치, 대소문자 무시)
  const craftedItem = useMemo<DetailItem | null>(() => {
    if (!detail) return null
    const key = detail.name.toLowerCase().trim()
    for (const qr of itemQueries) {
      const hit = (qr.data as DetailItem[] | undefined)?.find(
        (it) => it.name.toLowerCase().trim() === key,
      )
      if (hit) return hit
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, itemQueries.map((qr) => qr.data).join(',')])

  // 입수처 목록
  const sources = useMemo(() => {
    const set = new Set<string>()
    for (const r of data) for (const a of r.availability ?? []) if (a.from) set.add(a.from)
    return [...set].sort((a, b) => tSource(a).localeCompare(tSource(b), 'ko'))
  }, [data])

  const filtered = useMemo(() => {
    let rows = data
    if (q.trim()) {
      const l = q.toLowerCase()
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(l) || ko(r.name).toLowerCase().includes(l),
      )
    }
    if (source) {
      rows = rows.filter((r) => (r.availability ?? []).some((a) => a.from === source))
    }
    if (rcats.size) {
      rows = rows.filter((r) => rcats.has(catOf(r.name)))
    }
    if (learnFilter === 'learned') rows = rows.filter((r) => learned.has(r.name))
    else if (learnFilter === 'unlearned') rows = rows.filter((r) => !learned.has(r.name))
    if (sortBy === 'name') {
      rows = [...rows].sort((a, b) => ko(a.name).localeCompare(ko(b.name), 'ko'))
    }
    return rows
  }, [data, q, source, rcats, learnFilter, learned, ko, catOf, sortBy])

  const toggleCat = (c: string) =>
    setRcats((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })

  // 조회조건(검색·카테고리·입수처·미습득만)이 적용된 결과 기준 수량
  const learnedCount = filtered.filter((r) => learned.has(r.name)).length

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">DIY 레시피</h1>

      {/* 카테고리 탭 (다중선택) */}
      <CategoryTabs
        tabs={RECIPE_CATS}
        selected={rcats}
        onToggle={toggleCat}
        onClear={() => setRcats(new Set())}
      />

      <div className="card mb-4 space-y-3 p-4">
        <ProgressBar value={learnedCount} total={filtered.length} label="레시피 습득률" />
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={q} onChange={setQ} />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
          >
            <option value="">{ui.source}: 전체</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {tSource(s)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
          >
            <option value="default">기본 정렬</option>
            <option value="name">가나다순</option>
          </select>
          <select
            value={learnFilter}
            onChange={(e) => setLearnFilter(e.target.value as typeof learnFilter)}
            className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
          >
            <option value="all">학습 전체</option>
            <option value="learned">학습만</option>
            <option value="unlearned">미학습만</option>
          </select>
        </div>
        {!canSave && <p className="text-xs text-leaf-400">{ui.loginRequiredToSave}</p>}
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r: Recipe) => {
            const isLearned = learned.has(r.name)
            return (
              <div key={r.name} className="card flex gap-3 p-3">
                <button
                  onClick={() => setDetail(r)}
                  className="h-16 w-16 flex-shrink-0"
                >
                  <img
                    src={r.image_url}
                    alt={r.name}
                    loading="lazy"
                    className="h-16 w-16 object-contain"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => setDetail(r)}
                      className="text-left text-sm font-semibold hover:text-leaf-500"
                    >
                      {ko(r.name)}
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(r.materials ?? []).map((m) => (
                      <span key={m.name} className="chip">
                        {koItem(m.name)} ×{m.count}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-leaf-500">
                    {(r.availability ?? []).map((a) => tSource(a.from)).join(', ')}
                    {r.sell ? ` · 판매 ${fmtBells(r.sell)}` : ''}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <ToggleButton
                      label={ui.learned}
                      active={isLearned}
                      disabled={!canSave}
                      onClick={() => toggle.mutate(r.name)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <RecipeDetailModal
        recipe={detail}
        item={craftedItem}
        title={detail ? ko(detail.name) : undefined}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
