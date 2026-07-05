import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nookipedia, type Villager } from '../lib/nookipedia'
import { useAuth } from '../context/AuthContext'
import { useVillagerState } from '../hooks/useVillagerState'
import { useKoNames } from '../hooks/useKoNames'
import { useCanSave, ToggleButton } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { VillagerDetailModal } from '../components/VillagerDetailModal'
import { tPersonality, personality as personalityKo, ui } from '../i18n/ko'
import { tr, species as speciesKo } from '../i18n/terms'

const PAGE = 60
const EMPTY = { resident: false, wish: false, photo: false }

export function VillagersPage() {
  const [q, setQ] = useState('')
  const [species, setSpecies] = useState('')
  const [pers, setPers] = useState('')
  const [residentOnly, setResidentOnly] = useState(true)
  const [noPhotoOnly, setNoPhotoOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [detail, setDetail] = useState<Villager | null>(null)
  const canSave = useCanSave()
  const { loading: authLoading } = useAuth()
  const { map, toggle, isLoading: stateLoading } = useVillagerState()
  const ko = useKoNames('villagers')

  const query = useQuery({
    queryKey: ['nook', 'villagers'],
    queryFn: () => nookipedia.villagers({ nhdetails: true }),
  })
  const data = query.data ?? []
  const stateOf = (name: string) => map[name] ?? EMPTY

  const speciesList = useMemo(() => [...new Set(data.map((v) => v.species))].sort(), [data])

  // 검색·종·성격까지만 적용된 목록 — 카운트 표기는 탭(내주민)·액자 필터와 무관하게 이 기준
  const baseRows = useMemo(() => {
    let rows = data
    if (q.trim()) {
      const l = q.toLowerCase()
      rows = rows.filter(
        (v) =>
          v.name.toLowerCase().includes(l) ||
          (v.alt_name ?? '').toLowerCase().includes(l) ||
          ko(v.name).toLowerCase().includes(l),
      )
    }
    if (species) rows = rows.filter((v) => v.species === species)
    if (pers) rows = rows.filter((v) => v.personality === pers)
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, q, species, pers, ko])

  const filtered = useMemo(() => {
    let rows = baseRows
    if (residentOnly) rows = rows.filter((v) => map[v.name]?.resident)
    if (noPhotoOnly) rows = rows.filter((v) => !map[v.name]?.photo)
    // 정렬: 위시 항상 상단, 그 다음 이름순
    return [...rows].sort((a, b) => {
      const wa = map[a.name]?.wish ? 1 : 0
      const wb = map[b.name]?.wish ? 1 : 0
      if (wa !== wb) return wb - wa
      return ko(a.name).localeCompare(ko(b.name), 'ko')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseRows, residentOnly, noPhotoOnly, map, ko])

  const shown = filtered.slice(0, limit)
  const residentCount = baseRows.filter((v) => map[v.name]?.resident).length

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">주민</h1>

      {/* 전체 / 내 주민 탭 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setResidentOnly(false)}
          className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (!residentOnly ? 'bg-leaf-500 text-white' : 'bg-leaf-100 text-leaf-600 dark:bg-leaf-700 dark:text-sand-50')}
        >
          전체
        </button>
        <button
          onClick={() => setResidentOnly(true)}
          className={'rounded-xl px-4 py-2 text-sm font-semibold ' + (residentOnly ? 'bg-leaf-500 text-white' : 'bg-leaf-100 text-leaf-600 dark:bg-leaf-700 dark:text-sand-50')}
        >
          🏝 내 주민
        </button>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <SearchBar value={q} onChange={setQ} />
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
        >
          <option value="">종: 전체</option>
          {speciesList.map((s) => (
            <option key={s} value={s}>
              {tr(speciesKo, s)}
            </option>
          ))}
        </select>
        <select
          value={pers}
          onChange={(e) => setPers(e.target.value)}
          className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm dark:border-leaf-700 dark:bg-leaf-800"
        >
          <option value="">성격: 전체</option>
          {Object.keys(personalityKo).map((p) => (
            <option key={p} value={p}>
              {personalityKo[p]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={noPhotoOnly} onChange={(e) => setNoPhotoOnly(e.target.checked)} />
          🖼️ 액자 미획득만
        </label>
        <span className="ml-auto text-xs text-leaf-400">
          내 주민 {residentCount} / 전체 {baseRows.length}명
        </span>
      </div>

      {query.isLoading || (residentOnly && (authLoading || stateLoading)) ? (
        // villager_state는 persist 미대상 + 세션 복원 전엔 쿼리 비활성(isLoading=false) —
        // 로그인 사용자의 새로고침/콜드스타트에서 기본탭(내 주민)에 빈 안내 카드가
        // 번쩍이지 않도록 인증 복원(authLoading)과 상태 로딩을 함께 가드
        <Spinner />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : shown.length === 0 ? (
        residentOnly && residentCount === 0 ? (
          <div className="card p-8 text-center text-sm text-leaf-500">
            <p className="mb-1 text-base">🏝 내 주민이 아직 없어요</p>
            <p className="text-leaf-400">주민 카드의 '내 주민'을 눌러 추가하거나, '전체' 탭을 보세요.</p>
            {!canSave && <p className="mt-1 text-leaf-400">{ui.loginRequiredToSave}</p>}
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((v) => {
              const st = stateOf(v.name)
              return (
                <div key={v.name} className="card relative flex flex-col items-center p-3">
                  <button
                    disabled={!canSave}
                    onClick={() => toggle.mutate({ villagerId: v.name, field: 'photo' })}
                    title={canSave ? '액자 획득' : ui.loginRequiredToSave}
                    className={`absolute left-2 top-2 text-lg disabled:opacity-30 ${st.photo ? '' : 'opacity-25 grayscale'}`}
                  >
                    🖼️
                  </button>
                  {st.wish && <span className="absolute right-2 top-2 text-lg" title="데려오고 싶은 주민">⭐</span>}
                  <button onClick={() => setDetail(v)} className="flex flex-col items-center">
                    <img
                      src={v.nh_details?.icon_url || v.image_url}
                      alt={v.name}
                      loading="lazy"
                      className="h-20 w-20 object-contain"
                    />
                    <div className="mt-1 text-sm font-semibold">{ko(v.name)}</div>
                  </button>
                  <div className="mt-0.5 text-xs text-leaf-400">
                    {tr(speciesKo, v.species)} · {tPersonality(v.personality)}
                  </div>
                  <div className="mt-2 flex w-full gap-1.5">
                    <ToggleButton
                      label="내 주민"
                      active={st.resident}
                      disabled={!canSave}
                      onClick={() => toggle.mutate({ villagerId: v.name, field: 'resident' })}
                    />
                    <ToggleButton
                      label="위시"
                      active={st.wish}
                      disabled={!canSave}
                      onClick={() => toggle.mutate({ villagerId: v.name, field: 'wish' })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {limit < filtered.length && (
            <div className="mt-6 text-center">
              <button onClick={() => setLimit((l) => l + PAGE)} className="btn-primary">
                더 보기 ({filtered.length - limit}명 남음)
              </button>
            </div>
          )}
        </>
      )}

      <VillagerDetailModal
        villager={detail}
        koName={detail ? ko(detail.name) : undefined}
        photoOwned={detail ? stateOf(detail.name).photo : false}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
