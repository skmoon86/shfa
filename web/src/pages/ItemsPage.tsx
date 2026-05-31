import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nookipedia } from '../lib/nookipedia'
import { useItemCollection } from '../hooks/useProgress'
import { useKoNames } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { ItemDetailModal, type DetailItem } from '../components/ItemDetailModal'
import { itemCategory, ui, tSource } from '../i18n/ko'
import { fmtBells } from '../lib/format'

type Cat = 'furniture' | 'clothing' | 'interior' | 'tools' | 'items' | 'photos' | 'gyroids'
const CATS: Cat[] = ['furniture', 'clothing', 'interior', 'tools', 'items', 'photos', 'gyroids']
const PAGE = 60

export function ItemsPage() {
  const [cat, setCat] = useState<Cat>('furniture')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [filter, setFilter] = useState<'all' | 'owned' | 'wishlist'>('all')
  const [reformOnly, setReformOnly] = useState(false)
  const [detail, setDetail] = useState<DetailItem | null>(null)
  const canSave = useCanSave()
  const { map, toggle } = useItemCollection()
  const ko = useKoNames(cat)

  const query = useQuery({
    queryKey: ['nook', cat],
    queryFn: () => nookipedia[cat](),
  })
  const data = (query.data ?? []) as DetailItem[]

  const filtered = useMemo(() => {
    let rows = data
    if (q.trim()) {
      const l = q.toLowerCase()
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(l) || ko(r.name).toLowerCase().includes(l),
      )
    }
    if (reformOnly) rows = rows.filter((r) => r.customizable)
    if (filter !== 'all') {
      rows = rows.filter((r) => map[r.name]?.[filter])
    }
    return rows
  }, [data, q, reformOnly, filter, map, ko])

  // 획득방법 요약 + 카탈로그 등록 가능 여부(획득처로 유추)
  const acq = (r: DetailItem) =>
    (r.availability ?? []).map((a) => tSource(a.from)).join(', ')
  const inCatalog = (r: DetailItem) =>
    (r.availability ?? []).some((a) => /Nook|catalog|Shopping/i.test(a.from)) ||
    (r.buy ?? []).some((b) => b.price > 0)

  const shown = filtered.slice(0, limit)
  const ownedCount = data.filter((r) => map[r.name]?.owned).length

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">아이템 컬렉션</h1>

      <div className="no-scrollbar mb-4 -mx-4 flex gap-2 overflow-x-auto px-4">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCat(c)
              setLimit(PAGE)
            }}
            className={
              'shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ' +
              (cat === c
                ? 'bg-leaf-500 text-white'
                : 'bg-leaf-100 text-leaf-600 hover:bg-leaf-200 dark:bg-leaf-700 dark:text-sand-50')
            }
          >
            {itemCategory[c]}
          </button>
        ))}
      </div>

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
        {cat === 'furniture' && (
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={reformOnly}
              onChange={(e) => setReformOnly(e.target.checked)}
            />
            {ui.reformable}만
          </label>
        )}
        <span className="ml-auto text-xs text-leaf-400">
          {ui.owned} {ownedCount} / 전체 {data.length}
        </span>
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : shown.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((r) => {
              const st = map[r.name] ?? { owned: false, wishlist: false }
              return (
                <div key={r.name} className="card flex flex-col p-3">
                  <button
                    onClick={() => setDetail(r)}
                    className="flex h-24 items-center justify-center"
                  >
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
                    {ko(r.name)}
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
                      onClick={() =>
                        toggle.mutate({ itemId: r.name, category: cat, field: 'owned' })
                      }
                    />
                    <ToggleButton
                      label={ui.wishlist}
                      active={st.wishlist}
                      disabled={!canSave}
                      onClick={() =>
                        toggle.mutate({ itemId: r.name, category: cat, field: 'wishlist' })
                      }
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
        title={detail ? ko(detail.name) : undefined}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
