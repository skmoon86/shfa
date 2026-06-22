import { useEffect, useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { nookipedia, type Critter, type Fossil, type Art } from '../lib/nookipedia'
import { useCritterpedia } from '../hooks/useProgress'
import { useUserPrefs } from '../hooks/useUserPrefs'
import { useSelectedDate } from '../context/DateContext'
import { useKoNamesMulti } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { ProgressBar } from '../components/ProgressBar'
import { CategoryTabs } from '../components/CategoryTabs'
import { critterCategory, ui } from '../i18n/ko'
import { tr, fishLocation, bugLocation, fmtMonths, fmtTime } from '../i18n/terms'
import { fmtBells } from '../lib/format'

type DataCat = 'fish' | 'bugs' | 'sea' | 'fossils' | 'art'
const DATA_CATS: DataCat[] = ['fish', 'bugs', 'sea', 'fossils', 'art']
const TABS: { code: DataCat; label: string }[] = DATA_CATS.map((c) => ({
  code: c,
  label: critterCategory[c],
}))
const CRITTER_CATS: DataCat[] = ['fish', 'bugs', 'sea']
const MODEL_CATS: DataCat[] = ['fish', 'bugs'] // 모형 대상(저스틴/레온)

type Row = (Critter | Fossil | Art) & { __cat: DataCat }

function availArray(c: Critter, hemi: 'north' | 'south'): number[] {
  const arr = (hemi === 'north' ? c.n_availability_array : c.s_availability_array) ?? []
  return arr.map(Number)
}

// 채집장소 한글 라벨(곤충=bugLocation, 그 외=fishLocation). 해산물은 location 없음.
function tLoc(cat: DataCat, loc?: string): string {
  return cat === 'bugs' ? tr(bugLocation, loc) : tr(fishLocation, loc)
}

export function CritterpediaPage() {
  const [selected, setSelected] = useState<Set<DataCat>>(new Set())
  const [q, setQ] = useState('')
  const [hemi, setHemi] = useState<'north' | 'south'>('north')
  const [onlyNow, setOnlyNow] = useState(false)
  const [donateFilter, setDonateFilter] = useState<'all' | 'donated' | 'undonated'>('all')
  const [loc, setLoc] = useState('') // 선택된 채집장소(표시 라벨)
  const [sortBy, setSortBy] = useState<'default' | 'name'>('default')
  const [onlyNoModel, setOnlyNoModel] = useState(false)
  const canSave = useCanSave()
  const { map, toggle } = useCritterpedia()
  const { prefs, update: updatePrefs } = useUserPrefs()
  const { date } = useSelectedDate()
  const currentMonth = date.getMonth() + 1
  const ko = useKoNamesMulti(DATA_CATS)

  // 반구 기본값을 환경설정에서 동기화(로그인 시). 변경하면 저장.
  useEffect(() => {
    setHemi(prefs.hemisphere)
  }, [prefs.hemisphere])
  const changeHemi = (h: 'north' | 'south') => {
    setHemi(h)
    if (canSave) updatePrefs.mutate({ hemisphere: h })
  }

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

  const toggleCat = (c: DataCat) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })

  const data = selected.size === 0 ? allRows : allRows.filter((r) => selected.has(r.__cat))
  const catLabel =
    selected.size === 0 ? '전체' : [...selected].map((c) => critterCategory[c]).join(', ')

  // 채집장소 드롭다운 옵션(현재 카테고리의 fish/bugs location → 표시 라벨 distinct)
  const locOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of data) {
      if (!CRITTER_CATS.includes(r.__cat)) continue
      const label = tLoc(r.__cat, (r as Critter).location)
      if (label) set.add(label)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows, [...selected].join(',')])

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
    if (loc) {
      rows = rows.filter(
        (r) => CRITTER_CATS.includes(r.__cat) && tLoc(r.__cat, (r as Critter).location) === loc,
      )
    }
    if (donateFilter === 'donated') {
      rows = rows.filter((r) => map[`${r.__cat}:${r.name}`]?.donated)
    } else if (donateFilter === 'undonated') {
      rows = rows.filter((r) => !map[`${r.__cat}:${r.name}`]?.donated)
    }
    if (onlyNoModel) {
      rows = rows.filter(
        (r) => MODEL_CATS.includes(r.__cat) && !map[`${r.__cat}:${r.name}`]?.model,
      )
    }
    if (sortBy === 'name') {
      rows = [...rows].sort((a, b) => ko(a.name, a.__cat).localeCompare(ko(b.name, b.__cat), 'ko'))
    }
    return rows
  }, [data, q, onlyNow, donateFilter, loc, sortBy, onlyNoModel, hemi, currentMonth, ko, map])

  const total = data.length
  const donatedCount = data.filter((r) => map[`${r.__cat}:${r.name}`]?.donated).length
  const hasCritters = data.some((r) => CRITTER_CATS.includes(r.__cat))
  const hasModelCats = data.some((r) => MODEL_CATS.includes(r.__cat))
  // 모형 진행(물고기 80 + 곤충 80 = 160)
  const modelRows = useMemo(() => allRows.filter((r) => MODEL_CATS.includes(r.__cat)), [allRows])
  const modelTotal = modelRows.length
  const modelDone = modelRows.filter((r) => map[`${r.__cat}:${r.name}`]?.model).length

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{ui.appName} · 도감</h1>

      {/* 카테고리 탭 (다중선택) */}
      <CategoryTabs
        tabs={TABS}
        selected={selected}
        onToggle={toggleCat}
        onClear={() => setSelected(new Set())}
      />

      {/* 진행률 + 컨트롤 */}
      <div className="card mb-4 space-y-3 p-4">
        <ProgressBar
          value={donatedCount}
          total={total}
          label={`${catLabel} 기증 진행률`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar value={q} onChange={setQ} />
          {hasCritters && (
            <>
              <div className="flex overflow-hidden rounded-lg border border-leaf-200 text-xs dark:border-leaf-700">
                <button
                  onClick={() => changeHemi('north')}
                  className={hemi === 'north' ? 'bg-leaf-500 px-3 py-1.5 text-white' : 'px-3 py-1.5'}
                >
                  {ui.northern}
                </button>
                <button
                  onClick={() => changeHemi('south')}
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
          {locOptions.length > 0 && (
            <select
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
            >
              <option value="">채집장소 전체</option>
              {locOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
          >
            <option value="default">기본 정렬</option>
            <option value="name">가나다순</option>
          </select>
          <select
            value={donateFilter}
            onChange={(e) => setDonateFilter(e.target.value as typeof donateFilter)}
            className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
          >
            <option value="all">기증 전체</option>
            <option value="donated">기증만</option>
            <option value="undonated">미기증만</option>
          </select>
          {hasModelCats && (
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={onlyNoModel}
                onChange={(e) => setOnlyNoModel(e.target.checked)}
              />
              모형 미보유만
            </label>
          )}
        </div>
        {hasModelCats && (
          <div className="text-xs text-leaf-400">🐟 모형 {modelDone} / {modelTotal}</div>
        )}
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
            const isModelCat = MODEL_CATS.includes(rcat)
            const st = map[`${rcat}:${r.name}`] ?? { caught: false, donated: false, model: false }
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
                  {isModelCat && (
                    <ToggleButton
                      label="모형"
                      active={st.model}
                      disabled={!canSave}
                      onClick={() =>
                        toggle.mutate({ category: rcat, entryId: r.name, field: 'model' })
                      }
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
