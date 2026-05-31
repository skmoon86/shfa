import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { nookipedia, type Critter, type Fossil, type Art } from '../lib/nookipedia'
import { useCritterpedia } from '../hooks/useProgress'
import { useKoNamesMulti } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { ProgressBar } from '../components/ProgressBar'
import { critterCategory, ui } from '../i18n/ko'
import { tr, fishLocation, bugLocation, fmtMonths, fmtTime } from '../i18n/terms'
import { fmtBells } from '../lib/format'

type DataCat = 'fish' | 'bugs' | 'sea' | 'fossils' | 'art'
type Cat = 'all' | DataCat
const DATA_CATS: DataCat[] = ['fish', 'bugs', 'sea', 'fossils', 'art']
const TABS: { code: Cat; label: string }[] = [
  { code: 'all', label: ui.all },
  ...DATA_CATS.map((c) => ({ code: c as Cat, label: critterCategory[c] })),
]
const CRITTER_CATS: DataCat[] = ['fish', 'bugs', 'sea']

const currentMonth = new Date().getMonth() + 1

type Row = (Critter | Fossil | Art) & { __cat: DataCat }

function availArray(c: Critter, hemi: 'north' | 'south'): number[] {
  const arr = (hemi === 'north' ? c.n_availability_array : c.s_availability_array) ?? []
  return arr.map(Number)
}

export function CritterpediaPage() {
  const [cat, setCat] = useState<Cat>('all')
  const [q, setQ] = useState('')
  const [hemi, setHemi] = useState<'north' | 'south'>('north')
  const [onlyNow, setOnlyNow] = useState(false)
  const canSave = useCanSave()
  const { map, toggle } = useCritterpedia()
  const ko = useKoNamesMulti(DATA_CATS)

  // 5개 카테고리를 모두 불러와(작은 데이터셋) 탭 전환을 즉시 처리
  const queries = useQueries({
    queries: DATA_CATS.map((c) => ({
      queryKey: ['nook', c],
      queryFn: (): Promise<(Critter | Fossil | Art)[]> =>
        c === 'fossils'
          ? nookipedia.fossils()
          : c === 'art'
            ? nookipedia.art()
            : nookipedia[c](),
    })),
  })
  const isLoading = queries.some((qr) => qr.isLoading)
  const anyError = queries.some((qr) => qr.isError)
  const allError = queries.length > 0 && queries.every((qr) => qr.isError)

  // __cat 태그 부여 후 병합
  const allRows = useMemo<Row[]>(() => {
    const out: Row[] = []
    DATA_CATS.forEach((c, i) => {
      for (const r of (queries[i].data ?? []) as (Critter | Fossil | Art)[]) {
        out.push(Object.assign({ __cat: c }, r) as Row)
      }
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.map((qr) => qr.data).join(',')])

  const data = cat === 'all' ? allRows : allRows.filter((r) => r.__cat === cat)

  const filtered = useMemo(() => {
    let rows = data
    if (q.trim()) {
      const lower = q.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          ko(r.name, r.__cat).toLowerCase().includes(lower),
      )
    }
    if (onlyNow) {
      rows = rows.filter((r) =>
        CRITTER_CATS.includes(r.__cat)
          ? availArray(r as Critter, hemi).includes(currentMonth)
          : true,
      )
    }
    return rows
  }, [data, q, onlyNow, hemi, ko])

  const total = data.length
  const donatedCount = data.filter((r) => map[`${r.__cat}:${r.name}`]?.donated).length
  const hasCritters = data.some((r) => CRITTER_CATS.includes(r.__cat))

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{ui.appName} · 도감</h1>

      {/* 카테고리 탭 */}
      <div className="no-scrollbar mb-4 -mx-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t.code}
            onClick={() => setCat(t.code)}
            className={
              'shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ' +
              (cat === t.code
                ? 'bg-leaf-500 text-white'
                : 'bg-leaf-100 text-leaf-600 hover:bg-leaf-200 dark:bg-leaf-700 dark:text-sand-50')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 진행률 + 컨트롤 */}
      <div className="card mb-4 space-y-3 p-4">
        <ProgressBar
          value={donatedCount}
          total={total}
          label={`${cat === 'all' ? '전체' : critterCategory[cat]} 기증 진행률`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={q} onChange={setQ} />
          {hasCritters && (
            <>
              <div className="flex overflow-hidden rounded-lg border border-leaf-200 text-xs dark:border-leaf-700">
                <button
                  onClick={() => setHemi('north')}
                  className={hemi === 'north' ? 'bg-leaf-500 px-3 py-1.5 text-white' : 'px-3 py-1.5'}
                >
                  {ui.northern}
                </button>
                <button
                  onClick={() => setHemi('south')}
                  className={hemi === 'south' ? 'bg-leaf-500 px-3 py-1.5 text-white' : 'px-3 py-1.5'}
                >
                  {ui.southern}
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={onlyNow}
                  onChange={(e) => setOnlyNow(e.target.checked)}
                />
                지금 잡을 수 있는 것만 ({currentMonth}월)
              </label>
            </>
          )}
        </div>
        {!canSave && <p className="text-xs text-leaf-400">{ui.loginRequiredToSave}</p>}
      </div>

      {anyError && data.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          일부 항목을 일시적으로 불러오지 못했어요(Nookipedia 서버 상태). 잠시 후 새로고침해 보세요.
        </div>
      )}
      {isLoading && data.length === 0 ? (
        <Spinner />
      ) : allError && data.length === 0 ? (
        <ErrorState error={new Error('Nookipedia 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도하세요.')} />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((r) => {
            const rcat = r.__cat
            const isCritter = CRITTER_CATS.includes(rcat)
            const st = map[`${rcat}:${r.name}`] ?? { caught: false, donated: false }
            const av = isCritter
              ? hemi === 'north'
                ? (r as Critter).availability_north
                : (r as Critter).availability_south
              : undefined
            return (
              <div key={`${rcat}:${r.name}`} className="card flex flex-col p-3">
                <div className="flex h-24 items-center justify-center">
                  <img
                    src={r.image_url || (r as Critter).render_url}
                    alt={r.name}
                    loading="lazy"
                    className="max-h-24 object-contain"
                  />
                </div>
                <div className="mt-2 text-sm font-semibold">{ko(r.name, rcat)}</div>

                {isCritter && (
                  <div className="mt-1 space-y-0.5 text-xs text-leaf-500">
                    {(r as Critter).location && (
                      <div>
                        📍{' '}
                        {rcat === 'bugs'
                          ? tr(bugLocation, (r as Critter).location)
                          : tr(fishLocation, (r as Critter).location)}
                      </div>
                    )}
                    <div>
                      💰 {fmtBells((r as Critter).sell_nook)}
                      {(r as Critter).sell_cj ? ` · CJ ${fmtBells((r as Critter).sell_cj)}` : ''}
                      {(r as Critter).sell_flick
                        ? ` · 플릭 ${fmtBells((r as Critter).sell_flick)}`
                        : ''}
                    </div>
                    {av && av.length > 0 ? (
                      av.map((a, i) => (
                        <div key={i}>
                          🗓 {fmtMonths(a.months)} · ⏰ {fmtTime(a.time)}
                        </div>
                      ))
                    ) : (
                      <div>🗓 연중 · ⏰ 하루 종일</div>
                    )}
                  </div>
                )}
                {rcat === 'fossils' && (
                  <div className="mt-1 text-xs text-leaf-500">
                    💰 {fmtBells((r as Fossil).sell)}
                    {(r as Fossil).fossil_group && (
                      <div className="opacity-70">{ko((r as Fossil).fossil_group!, 'fossils')}</div>
                    )}
                  </div>
                )}
                {rcat === 'art' && (
                  <div className="mt-1 space-y-0.5 text-xs text-leaf-500">
                    <div>💰 판매 {fmtBells((r as Art).sell)}</div>
                    <div>
                      {(r as Art).has_fake ? (
                        <span className="text-amber-600">⚠️ 위작 존재</span>
                      ) : (
                        <span className="text-leaf-500">진품만 존재</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex gap-1.5 pt-2">
                  {isCritter && (
                    <ToggleButton
                      label={ui.caught}
                      active={st.caught}
                      disabled={!canSave}
                      onClick={() =>
                        toggle.mutate({ category: rcat, entryId: r.name, field: 'caught' })
                      }
                    />
                  )}
                  <ToggleButton
                    label={ui.donated}
                    active={st.donated}
                    disabled={!canSave}
                    onClick={() =>
                      toggle.mutate({ category: rcat, entryId: r.name, field: 'donated' })
                    }
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
