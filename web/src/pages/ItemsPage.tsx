import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { nookipedia } from '../lib/nookipedia'
import { useItemCollection } from '../hooks/useProgress'
import { useKoNamesMulti } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { CategoryTabs } from '../components/CategoryTabs'
import { ItemDetailModal, type DetailItem } from '../components/ItemDetailModal'
import { itemCategory, ui, tSource } from '../i18n/ko'
import { fmtBells } from '../lib/format'

type DataCat = 'furniture' | 'clothing' | 'interior' | 'tools' | 'items' | 'photos' | 'gyroids'
const DATA_CATS: DataCat[] = ['furniture', 'clothing', 'interior', 'tools', 'items', 'photos', 'gyroids']
const TABS: { code: DataCat; label: string }[] = DATA_CATS.map((c) => ({
  code: c,
  label: itemCategory[c],
}))
const PAGE = 60

type Row = DetailItem & { __cat: DataCat }

export function ItemsPage() {
  const [selected, setSelected] = useState<Set<DataCat>>(new Set())
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [filter, setFilter] = useState<'all' | 'owned' | 'wishlist'>('all')
  const [reformOnly, setReformOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'default' | 'name'>('default')
  const [detail, setDetail] = useState<Row | null>(null)
  const canSave = useCanSave()
  const { map, toggle } = useItemCollection()
  const ko = useKoNamesMulti(DATA_CATS)

  // 이름 한글화 ((fake)/(real) 접미사 처리 포함)
  const itemKo = (r: Row): string => {
    const direct = ko(r.name, r.__cat)
    if (direct !== r.name) return direct
    const m = /^(.*?)\s*\((fake|real)\)$/i.exec(r.name)
    if (m) {
      const base = ko(m[1], r.__cat)
      if (base !== m[1]) return base + (/fake/i.test(m[2]) ? ' (위작)' : ' (진품)')
    }
    return direct
  }

  const toggleCat = (c: DataCat) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
    setLimit(PAGE)
  }

  // 아무것도 선택 안 하면 7개 모두, 아니면 선택 카테고리만 로드
  const cats: DataCat[] = selected.size === 0 ? DATA_CATS : DATA_CATS.filter((c) => selected.has(c))
  const queries = useQueries({
    queries: cats.map((c) => ({
      queryKey: ['nook', c],
      queryFn: () => nookipedia[c]() as Promise<DetailItem[]>,
    })),
  })
  const isLoading = queries.some((qr) => qr.isLoading)
  const anyError = queries.some((qr) => qr.isError)
  const allError = queries.length > 0 && queries.every((qr) => qr.isError)

  const data = useMemo<Row[]>(() => {
    const out: Row[] = []
    cats.forEach((c, i) => {
      for (const r of (queries[i].data ?? []) as DetailItem[]) {
        out.push(Object.assign({ __cat: c }, r) as Row)
      }
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats.join(','), queries.map((qr) => qr.data).join(',')])

  const filtered = useMemo(() => {
    let rows = data
    if (q.trim()) {
      const l = q.toLowerCase()
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(l) || ko(r.name, r.__cat).toLowerCase().includes(l),
      )
    }
    if (reformOnly) rows = rows.filter((r) => r.customizable)
    if (filter !== 'all') rows = rows.filter((r) => map[r.name]?.[filter])
    return rows
  }, [data, q, reformOnly, filter, map, ko])

  const sorted = useMemo(() => {
    if (sortBy !== 'name') return filtered
    return [...filtered].sort((a, b) => itemKo(a).localeCompare(itemKo(b), 'ko'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortBy, ko])

  const shown = sorted.slice(0, limit)
  const ownedCount = data.filter((r) => map[r.name]?.owned).length

  const acq = (r: DetailItem) => (r.availability ?? []).map((a) => tSource(a.from)).join(', ')
  const inCatalog = (r: DetailItem) =>
    (r.availability ?? []).some((a) => /Nook|catalog|Shopping/i.test(a.from)) ||
    (r.buy ?? []).some((b) => b.price > 0)

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">아이템 컬렉션</h1>

      <CategoryTabs
        tabs={TABS}
        selected={selected}
        onToggle={toggleCat}
        onClear={() => {
          setSelected(new Set())
          setLimit(PAGE)
        }}
      />

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <SearchBar value={q} onChange={setQ} />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
        >
          <option value="all">{ui.all}</option>
          <option value="owned">{ui.owned}</option>
          <option value="wishlist">{ui.wishlist}</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
        >
          <option value="default">기본 정렬</option>
          <option value="name">가나다순</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={reformOnly}
            onChange={(e) => setReformOnly(e.target.checked)}
          />
          {ui.reformable}만
        </label>
        <span className="ml-auto text-xs text-leaf-400">
          {ui.owned} {ownedCount} / 전체 {data.length}
        </span>
      </div>

      {anyError && data.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          일부 카테고리를 일시적으로 불러오지 못했어요(Nookipedia 서버 상태). 잠시 후 새로고침해 보세요.
        </div>
      )}
      {isLoading && data.length === 0 ? (
        <Spinner />
      ) : allError && data.length === 0 ? (
        <ErrorState error={new Error('Nookipedia 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도하세요.')} />
      ) : shown.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((r) => {
              const st = map[r.name] ?? { owned: false, wishlist: false }
              return (
                <div key={`${r.__cat}:${r.name}`} className="card flex flex-col p-3">
                  <button onClick={() => setDetail(r)} className="flex h-24 items-center justify-center">
                    <img
                      src={r.image_url || r.variations?.[0]?.image_url}
                      alt={r.name}
                      loading="lazy"
                      className="max-h-24 object-contain"
                    />
                  </button>
                  <button
                    onClick={() => setDetail(r)}
                    className="mt-2 text-left text-sm font-semibold hover:text-leaf-500"
                  >
                    {itemKo(r)}
                  </button>
                  <div className="mt-1 text-xs text-leaf-500">
                    💰 {fmtBells(r.sell)} 벨
                    {r.customizable && <span className="ml-1 text-amber-600">🎨 리폼</span>}
                  </div>
                  {acq(r) && (
                    <div className="mt-0.5 truncate text-[11px] text-leaf-400" title={acq(r)}>
                      📦 {acq(r)}
                    </div>
                  )}
                  <div className="mt-0.5">
                    {inCatalog(r) ? (
                      <span className="chip text-[10px]">🗂 카탈로그</span>
                    ) : (
                      <span className="text-[10px] text-leaf-300">카탈로그 미등록</span>
                    )}
                  </div>
                  <div className="mt-auto flex gap-1.5 pt-2">
                    <ToggleButton
                      label={ui.owned}
                      active={st.owned}
                      disabled={!canSave}
                      onClick={() => toggle.mutate({ itemId: r.name, category: r.__cat, field: 'owned' })}
                    />
                    <ToggleButton
                      label={ui.wishlist}
                      active={st.wishlist}
                      disabled={!canSave}
                      onClick={() => toggle.mutate({ itemId: r.name, category: r.__cat, field: 'wishlist' })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {limit < filtered.length && (
            <div className="mt-6 text-center">
              <button onClick={() => setLimit((l) => l + PAGE)} className="btn-primary">
                더 보기 ({filtered.length - limit}개 남음)
              </button>
            </div>
          )}
        </>
      )}

      <ItemDetailModal
        item={detail}
        title={detail ? itemKo(detail) : undefined}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
