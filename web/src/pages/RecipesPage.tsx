import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nookipedia, type Recipe } from '../lib/nookipedia'
import { useRecipeProgress } from '../hooks/useProgress'
import { useKoNames } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { ProgressBar } from '../components/ProgressBar'
import { ui, tSource } from '../i18n/ko'
import { fmtBells } from '../lib/format'

export function RecipesPage() {
  const [q, setQ] = useState('')
  const [source, setSource] = useState<string>('')
  const [onlyTodo, setOnlyTodo] = useState(false)
  const [calc, setCalc] = useState<Set<string>>(new Set())
  const canSave = useCanSave()
  const { learned, toggle } = useRecipeProgress()
  const ko = useKoNames('recipes')
  const koItem = useKoNames('items')

  const query = useQuery({
    queryKey: ['nook', 'recipes'],
    queryFn: () => nookipedia.recipes(),
  })
  const data = query.data ?? []

  // 입수처 목록
  const sources = useMemo(() => {
    const set = new Set<string>()
    for (const r of data) for (const a of r.availability ?? []) if (a.from) set.add(a.from)
    return [...set].sort()
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
    if (onlyTodo) rows = rows.filter((r) => !learned.has(r.name))
    return rows
  }, [data, q, source, onlyTodo, learned, ko])

  const learnedCount = data.filter((r) => learned.has(r.name)).length

  // 재료 합산
  const calcSummary = useMemo(() => {
    const sum: Record<string, number> = {}
    for (const r of data) {
      if (!calc.has(r.name)) continue
      for (const m of r.materials ?? []) sum[m.name] = (sum[m.name] ?? 0) + m.count
    }
    return Object.entries(sum).sort((a, b) => b[1] - a[1])
  }, [data, calc])

  const toggleCalc = (name: string) =>
    setCalc((s) => {
      const n = new Set(s)
      n.has(name) ? n.delete(name) : n.add(name)
      return n
    })

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">DIY 레시피</h1>

      <div className="card mb-4 space-y-3 p-4">
        <ProgressBar value={learnedCount} total={data.length} label="레시피 습득률" />
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
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={onlyTodo}
              onChange={(e) => setOnlyTodo(e.target.checked)}
            />
            미습득만
          </label>
        </div>
        {!canSave && <p className="text-xs text-leaf-400">{ui.loginRequiredToSave}</p>}
      </div>

      {/* 재료 합산 패널 */}
      {calc.size > 0 && (
        <div className="card mb-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">🧮 재료 합산 ({calc.size}개 레시피)</h2>
            <button onClick={() => setCalc(new Set())} className="btn-ghost text-xs">
              비우기
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {calcSummary.map(([name, count]) => (
              <span key={name} className="chip">
                {koItem(name)} × {count}
              </span>
            ))}
          </div>
        </div>
      )}

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
            const inCalc = calc.has(r.name)
            return (
              <div key={r.name} className="card flex gap-3 p-3">
                <img
                  src={r.image_url}
                  alt={r.name}
                  loading="lazy"
                  className="h-16 w-16 flex-shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold">{ko(r.name)}</div>
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
                    <button
                      onClick={() => toggleCalc(r.name)}
                      className={
                        'rounded-lg px-2.5 py-1 text-xs font-semibold transition ' +
                        (inCalc
                          ? 'bg-amber-400 text-white'
                          : 'bg-leaf-100 text-leaf-600 hover:bg-leaf-200 dark:bg-leaf-700 dark:text-sand-50')
                      }
                    >
                      {inCalc ? '✓ 합산' : '+ 합산'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
