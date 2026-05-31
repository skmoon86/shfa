import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nookipedia, type Critter, type Fossil, type Art } from '../lib/nookipedia'
import { useCritterpedia } from '../hooks/useProgress'
import { useKoNames } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { ProgressBar } from '../components/ProgressBar'
import { critterCategory, ui } from '../i18n/ko'
import { tr, fishLocation, bugLocation } from '../i18n/terms'
import { fmtBells } from '../lib/format'

type Cat = 'fish' | 'bugs' | 'sea' | 'fossils' | 'art'
const CATS: Cat[] = ['fish', 'bugs', 'sea', 'fossils', 'art']
const CRITTER_CATS: Cat[] = ['fish', 'bugs', 'sea']

const currentMonth = new Date().getMonth() + 1

function isAvailableNow(c: Critter, hemi: 'north' | 'south'): boolean {
  const arr = c[hemi]?.months_array ?? []
  return arr.includes(currentMonth)
}

export function CritterpediaPage() {
  const [cat, setCat] = useState<Cat>('fish')
  const [q, setQ] = useState('')
  const [hemi, setHemi] = useState<'north' | 'south'>('north')
  const [onlyNow, setOnlyNow] = useState(false)
  const canSave = useCanSave()
  const { map, toggle } = useCritterpedia()
  const ko = useKoNames(cat)

  const query = useQuery({
    queryKey: ['nook', cat],
    queryFn: (): Promise<(Critter | Fossil | Art)[]> => {
      if (cat === 'fossils') return nookipedia.fossils()
      if (cat === 'art') return nookipedia.art()
      return nookipedia[cat]()
    },
  })

  const isCritter = CRITTER_CATS.includes(cat)

  const data = (query.data ?? []) as (Critter | Fossil | Art)[]

  const filtered = useMemo(() => {
    let rows = data
    if (q.trim()) {
      const lower = q.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          ko(r.name).toLowerCase().includes(lower),
      )
    }
    if (isCritter && onlyNow) {
      rows = (rows as Critter[]).filter((r) => isAvailableNow(r, hemi))
    }
    return rows
  }, [data, q, onlyNow, hemi, isCritter, ko])

  // 진행률(현재 카테고리)
  const total = data.length
  const donatedCount = data.filter(
    (r) => map[`${cat}:${r.name}`]?.donated,
  ).length

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{ui.appName} · 도감</h1>

      {/* 카테고리 탭 */}
      <div className="no-scrollbar mb-4 -mx-4 flex gap-2 overflow-x-auto px-4">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={
              'shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ' +
              (cat === c
                ? 'bg-leaf-500 text-white'
                : 'bg-leaf-100 text-leaf-600 hover:bg-leaf-200 dark:bg-leaf-700 dark:text-sand-50')
            }
          >
            {critterCategory[c]}
          </button>
        ))}
      </div>

      {/* 진행률 + 컨트롤 */}
      <div className="card mb-4 space-y-3 p-4">
        <ProgressBar
          value={donatedCount}
          total={total}
          label={`${critterCategory[cat]} 기증 진행률`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={q} onChange={setQ} />
          {isCritter && (
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
        {!canSave && (
          <p className="text-xs text-leaf-400">{ui.loginRequiredToSave}</p>
        )}
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((r) => {
            const st = map[`${cat}:${r.name}`] ?? { caught: false, donated: false }
            return (
              <div key={r.name} className="card flex flex-col p-3">
                <div className="flex h-24 items-center justify-center">
                  <img
                    src={r.image_url || (r as Critter).render_url}
                    alt={r.name}
                    loading="lazy"
                    className="max-h-24 object-contain"
                  />
                </div>
                <div className="mt-2 text-sm font-semibold">{ko(r.name)}</div>

                {/* 카테고리별 메타 */}
                {isCritter && (
                  <div className="mt-1 space-y-0.5 text-xs text-leaf-500">
                    {(r as Critter).location && (
                      <div>
                        📍{' '}
                        {cat === 'bugs'
                          ? tr(bugLocation, (r as Critter).location)
                          : tr(fishLocation, (r as Critter).location)}
                      </div>
                    )}
                    <div>
                      💰 너굴: {fmtBells((r as Critter).sell_nook)}
                      {(r as Critter).sell_cj
                        ? ` · CJ: ${fmtBells((r as Critter).sell_cj)}`
                        : ''}
                      {(r as Critter).sell_flick
                        ? ` · 플릭: ${fmtBells((r as Critter).sell_flick)}`
                        : ''}
                    </div>
                    <div>
                      🗓 {(r as Critter)[hemi]?.months || '연중'}
                    </div>
                  </div>
                )}
                {cat === 'fossils' && (
                  <div className="mt-1 text-xs text-leaf-500">
                    💰 {fmtBells((r as Fossil).sell)}
                    {(r as Fossil).fossil_group && (
                      <div className="opacity-70">{(r as Fossil).fossil_group}</div>
                    )}
                  </div>
                )}
                {cat === 'art' && (
                  <div className="mt-1 space-y-0.5 text-xs text-leaf-500">
                    {(r as Art).art_name && <div className="italic">{(r as Art).art_name}</div>}
                    <div>💰 판매 {fmtBells((r as Art).sell)}</div>
                    <div>
                      {(r as Art).has_fake ? (
                        <span className="text-amber-600">⚠️ 위작 존재</span>
                      ) : (
                        <span className="text-leaf-500">진품만 존재</span>
                      )}
                    </div>
                    {(r as Art).authenticity && (
                      <div className="opacity-70" title={(r as Art).authenticity}>
                        식별: {(r as Art).authenticity!.slice(0, 40)}…
                      </div>
                    )}
                  </div>
                )}

                {/* 토글 */}
                <div className="mt-auto flex gap-1.5 pt-2">
                  {isCritter && (
                    <ToggleButton
                      label={ui.caught}
                      active={st.caught}
                      disabled={!canSave}
                      onClick={() =>
                        toggle.mutate({ category: cat, entryId: r.name, field: 'caught' })
                      }
                    />
                  )}
                  <ToggleButton
                    label={ui.donated}
                    active={st.donated}
                    disabled={!canSave}
                    onClick={() =>
                      toggle.mutate({ category: cat, entryId: r.name, field: 'donated' })
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
