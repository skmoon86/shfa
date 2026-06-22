import { useMemo, useState } from 'react'
import { useItemCollection } from '../hooks/useProgress'
import { useItemsStore } from '../hooks/useItemsStore'
import { useKoNamesMulti } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { CategoryTabs } from '../components/CategoryTabs'
import { ProgressBar } from '../components/ProgressBar'
import { ItemDetailModal } from '../components/ItemDetailModal'
import { BUCKET_ORDER, bucketLabel, type Bucket, type ItemRow } from '../lib/itemBuckets'
import { ui, tSource } from '../i18n/ko'
import { fmtBells, fmtBuy } from '../lib/format'

const KO_CATS = ['furniture', 'clothing', 'interior', 'items', 'tools', 'gyroids']
const TABS = BUCKET_ORDER.map((b) => ({ code: b, label: bucketLabel[b] }))
const PAGE = 60

type Check = 'owned' | 'reform' | 'catalog' | 'recipe' | 'variation' | 'unowned' | 'wishlist' | 'hidden'

export function ItemsPage() {
  const [selected, setSelected] = useState<Set<Bucket>>(new Set())
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [acq, setAcq] = useState('') // 선택된 획득방법(원문 from)
  const [sortBy, setSortBy] = useState<'default' | 'name'>('default')
  const [checks, setChecks] = useState<Set<Check>>(new Set())
  const [detail, setDetail] = useState<ItemRow | null>(null)
  const canSave = useCanSave()
  const { toggle } = useItemCollection()
  const store = useItemsStore()
  const ko = useKoNamesMulti(KO_CATS)

  const itemKo = (r: ItemRow) => r.__ko ?? ko(r.name, r.__cat)
  const has = (c: Check) => checks.has(c)
  const toggleCheck = (c: Check) =>
    setChecks((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })

  // 선택 버킷의 행(숨김 보기 여부는 아래에서 처리)
  const bucketRows = useMemo(() => {
    if (selected.size === 0) return store.rows
    return store.rows.filter((r) => selected.has(r.__bucket))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.rows, [...selected].join(',')])

  // 획득방법 드롭다운 옵션(현재 버킷의 고유 from)
  const acqOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of bucketRows) for (const a of r.availability ?? []) if (a.from) set.add(a.from)
    return [...set].sort((a, b) => tSource(a).localeCompare(tSource(b), 'ko'))
  }, [bucketRows])

  const map = store.itemMap

  const filtered = useMemo(() => {
    let rows = bucketRows
    rows = has('hidden')
      ? rows.filter((r) => map[r.name]?.hidden)
      : rows.filter((r) => !map[r.name]?.hidden)
    if (q.trim()) {
      const l = q.trim().toLowerCase()
      rows = rows.filter((r) => r.name.toLowerCase().includes(l) || itemKo(r).toLowerCase().includes(l))
    }
    if (acq) rows = rows.filter((r) => (r.availability ?? []).some((a) => a.from === acq))
    if (has('reform')) rows = rows.filter((r) => r.__reformable)
    if (has('catalog')) rows = rows.filter((r) => r.__catalogable)
    if (has('recipe')) rows = rows.filter((r) => r.__hasRecipe)
    if (has('variation')) rows = rows.filter((r) => r.__hasVariation)
    if (has('owned')) rows = rows.filter((r) => map[r.name]?.owned)
    if (has('unowned')) rows = rows.filter((r) => !map[r.name]?.owned)
    if (has('wishlist')) rows = rows.filter((r) => map[r.name]?.wishlist)
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucketRows, q, acq, [...checks].join(','), map, ko])

  const sorted = useMemo(() => {
    if (sortBy !== 'name') return filtered
    return [...filtered].sort((a, b) => itemKo(a).localeCompare(itemKo(b), 'ko'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortBy, ko])

  const shown = sorted.slice(0, limit)
  const rate = store.rate(filtered)

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">아이템 컬렉션</h1>

      <CategoryTabs
        tabs={TABS}
        selected={selected}
        onToggle={(c) => {
          setSelected((prev) => {
            const next = new Set(prev)
            next.has(c) ? next.delete(c) : next.add(c)
            return next
          })
          setLimit(PAGE)
          setAcq('')
        }}
        onClear={() => {
          setSelected(new Set())
          setLimit(PAGE)
          setAcq('')
        }}
      />

      <div className="card mb-4 space-y-3 p-4">
        <ProgressBar value={rate.owned} total={rate.total} label="보유율(숨김 제외)" />
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={q} onChange={setQ} />
          <select
            value={acq}
            onChange={(e) => setAcq(e.target.value)}
            className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
          >
            <option value="">획득방법 전체</option>
            {acqOptions.map((a) => (
              <option key={a} value={a}>
                {tSource(a)}
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
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm">
          {([
            ['owned', ui.owned],
            ['unowned', '미보유'],
            ['wishlist', ui.wishlist],
            ['reform', ui.reformable],
            ['catalog', '카탈로그'],
            ['recipe', '레시피 있음'],
            ['variation', '변형 있음'],
            ['hidden', '숨김'],
          ] as [Check, string][]).map(([c, label]) => (
            <label key={c} className="flex items-center gap-1.5">
              <input type="checkbox" checked={has(c)} onChange={() => toggleCheck(c)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {store.anyError && store.rows.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          일부 카테고리를 일시적으로 불러오지 못했어요(Nookipedia 서버 상태). 잠시 후 새로고침해 보세요.
        </div>
      )}
      {store.isLoading ? (
        <Spinner />
      ) : store.allError && store.rows.length === 0 ? (
        <ErrorState error={new Error('Nookipedia 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도하세요.')} />
      ) : shown.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((r) => {
              const st = map[r.name] ?? { owned: false, wishlist: false, hidden: false }
              const acqText = (r.availability ?? []).map((a) => tSource(a.from)).join(', ')
              return (
                <div key={`${r.__cat}:${r.name}`} className="card relative flex flex-col p-3">
                  <button
                    onClick={() => toggle.mutate({ itemId: r.name, category: r.__cat, field: 'hidden' })}
                    disabled={!canSave}
                    title={st.hidden ? '숨김 해제' : '숨기기'}
                    className="absolute right-1.5 top-1.5 z-10 rounded-full border border-leaf-200 bg-white/80 px-1.5 py-0.5 text-xs leading-none text-leaf-500 backdrop-blur hover:bg-leaf-100 disabled:opacity-40 dark:border-leaf-700 dark:bg-leaf-800/80 dark:hover:bg-leaf-700"
                  >
                    {st.hidden ? '↩︎' : '🙈'}
                  </button>
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
                  <div className="mt-1 space-y-0.5 text-xs text-leaf-500">
                    <div>🛒 {ui.buyPrice} {fmtBuy(r.buy)}</div>
                    <div>💰 {ui.sellPrice} {fmtBells(r.sell)} 벨</div>
                    <div className="flex flex-wrap gap-1">
                      {r.__reformable && <span className="text-amber-600">🎨 {ui.reform}</span>}
                      {!r.__reformable && r.__hasVariation && (
                        <span className="text-sky-600">🔀 {ui.variations} {r.variations!.length}종</span>
                      )}
                      {r.__hasRecipe && <span className="text-leaf-500">🔨 레시피</span>}
                    </div>
                  </div>
                  {acqText && (
                    <div className="mt-0.5 truncate text-[11px] text-leaf-400" title={acqText}>
                      📦 {acqText}
                    </div>
                  )}
                  <div className="mt-0.5">
                    {r.__catalogable ? (
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
                      label="wish"
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
