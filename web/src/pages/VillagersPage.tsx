import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nookipedia, type Villager } from '../lib/nookipedia'
import { useFavoriteVillagers, useVillagerPhotos } from '../hooks/useProgress'
import { useKoNames } from '../hooks/useKoNames'
import { useCanSave } from '../components/Toggle'
import { Spinner, ErrorState, EmptyState } from '../components/states'
import { SearchBar } from '../components/SearchBar'
import { VillagerDetailModal } from '../components/VillagerDetailModal'
import { tPersonality, personality as personalityKo, ui } from '../i18n/ko'
import { tr, species as speciesKo } from '../i18n/terms'

const PAGE = 60

export function VillagersPage() {
  const [q, setQ] = useState('')
  const [species, setSpecies] = useState('')
  const [pers, setPers] = useState('')
  const [favOnly, setFavOnly] = useState(true)
  const [photoOnly, setPhotoOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [detail, setDetail] = useState<Villager | null>(null)
  const canSave = useCanSave()
  const { favorites, toggle } = useFavoriteVillagers()
  const { photos, toggle: togglePhoto } = useVillagerPhotos()
  const ko = useKoNames('villagers')

  const query = useQuery({
    queryKey: ['nook', 'villagers'],
    queryFn: () => nookipedia.villagers({ nhdetails: true }),
  })
  const data = query.data ?? []

  const speciesList = useMemo(
    () => [...new Set(data.map((v) => v.species))].sort(),
    [data],
  )

  const filtered = useMemo(() => {
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
    if (favOnly) rows = rows.filter((v) => favorites.has(v.name))
    if (photoOnly) rows = rows.filter((v) => photos.has(v.name))
    return rows
  }, [data, q, species, pers, favOnly, favorites, photoOnly, photos])

  const shown = filtered.slice(0, limit)
  // 조회조건이 적용된 결과 기준 액자 획득 수량
  const photoCount = filtered.filter((v) => photos.has(v.name)).length

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">주민</h1>

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
          <input
            type="checkbox"
            checked={favOnly}
            onChange={(e) => setFavOnly(e.target.checked)}
          />
          ❤️ 내 주민만
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={photoOnly}
            onChange={(e) => setPhotoOnly(e.target.checked)}
          />
          🖼️ 액자 획득만
        </label>
        <span className="ml-auto text-xs text-leaf-400">
          액자 {photoCount} / 전체 {filtered.length}명
        </span>
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : shown.length === 0 ? (
        favOnly && favorites.size === 0 ? (
          <div className="card p-8 text-center text-sm text-leaf-500">
            <p className="mb-1 text-base">❤️ 내 주민이 아직 없어요</p>
            <p className="text-leaf-400">
              주민 카드의 하트를 눌러 추가하거나, 위 '내 주민만' 체크를 해제하세요.
            </p>
            {!canSave && <p className="mt-1 text-leaf-400">{ui.loginRequiredToSave}</p>}
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((v) => {
              const isFav = favorites.has(v.name)
              const hasPhoto = photos.has(v.name)
              return (
                <div key={v.name} className="card relative flex flex-col items-center p-3">
                  <button
                    disabled={!canSave}
                    onClick={() => toggle.mutate(v.name)}
                    title={canSave ? '내 주민' : ui.loginRequiredToSave}
                    className="absolute right-2 top-2 text-lg disabled:opacity-30"
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>
                  <button
                    disabled={!canSave}
                    onClick={() => togglePhoto.mutate(v.name)}
                    title={canSave ? '액자 획득' : ui.loginRequiredToSave}
                    className={`absolute left-2 top-2 text-lg disabled:opacity-30 ${
                      hasPhoto ? '' : 'opacity-25 grayscale'
                    }`}
                  >
                    🖼️
                  </button>
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
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
