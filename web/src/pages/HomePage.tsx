import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { nookipedia, type Critter, type Fossil, type Art, type Villager } from '../lib/nookipedia'
import { useAuth } from '../context/AuthContext'
import { useCritterpedia, useRecipeProgress } from '../hooks/useProgress'
import { useItemsStore } from '../hooks/useItemsStore'
import { useVillagerState } from '../hooks/useVillagerState'
import { useEvents, eventsOn } from '../hooks/useEvents'
import { useSelectedDate } from '../context/DateContext'
import { useKoNames } from '../hooks/useKoNames'
import { ProgressBar } from '../components/ProgressBar'
import { DatePicker } from '../components/DatePicker'
import { TodoList } from '../components/TodoList'
import { VillagerDetailModal } from '../components/VillagerDetailModal'
import { critterCategory, tEvent, ui } from '../i18n/ko'
import { tr, species as speciesKo } from '../i18n/terms'

const CRITTER_CATS = ['fish', 'bugs', 'sea', 'fossils', 'art'] as const
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function HomePage() {
  const { user, signInWithGoogle } = useAuth()
  const { date, iso } = useSelectedDate()
  const { map } = useCritterpedia()
  const { learned } = useRecipeProgress()
  const store = useItemsStore()
  const { map: vmap } = useVillagerState()
  const { data: events } = useEvents(date.getFullYear())
  const koV = useKoNames('villagers')
  const [detail, setDetail] = useState<Villager | null>(null)

  const critterQueries = useQueries({
    queries: CRITTER_CATS.map((c) => ({
      queryKey: ['nook', c],
      queryFn: (): Promise<(Critter | Fossil | Art)[]> =>
        c === 'fossils' ? nookipedia.fossils() : c === 'art' ? nookipedia.art() : nookipedia[c](),
    })),
  })
  const recipesQ = useQueries({
    queries: [{ queryKey: ['nook', 'recipes'], queryFn: () => nookipedia.recipes() }],
  })[0]
  const villagersQ = useQueries({
    queries: [{ queryKey: ['nook', 'villagers'], queryFn: () => nookipedia.villagers({ nhdetails: true }) }],
  })[0]

  const itemRate = store.rate(store.rows)
  const todayEvents = eventsOn(events, iso)

  // 거주 주민
  const residents = useMemo(
    () => (villagersQ.data ?? []).filter((v) => vmap[v.name]?.resident),
    [villagersQ.data, vmap],
  )
  // 선택일 생일 주민(거주 우선 표시는 전체 대상으로 계산)
  const monthName = MONTHS[date.getMonth()]
  const birthdays = useMemo(
    () =>
      (villagersQ.data ?? []).filter(
        (v) => v.birthday_month === monthName && Number(v.birthday_day) === date.getDate(),
      ),
    [villagersQ.data, monthName, date],
  )

  return (
    <div className="space-y-6">
      {/* 날짜 + 이벤트 + 생일 + To-do */}
      <section className="card space-y-3 p-5">
        <DatePicker />
        <div className="flex flex-wrap gap-2 text-sm">
          {todayEvents.length > 0 ? (
            todayEvents.map((e, i) => (
              <span key={i} className="chip">🎉 {tEvent(e.event)}</span>
            ))
          ) : (
            <span className="text-leaf-400">오늘은 특별한 이벤트가 없어요.</span>
          )}
          {birthdays.map((v) => (
            <span key={v.name} className="chip">🎂 {koV(v.name)} 생일</span>
          ))}
        </div>
        {!user && (
          <button onClick={signInWithGoogle} className="btn-primary">
            {ui.loginWithGoogle}
          </button>
        )}
      </section>

      <TodoList />

      {/* 진행률 요약 */}
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-bold">📊 진행률 요약</h2>
        {!user && <p className="text-sm text-leaf-400">{ui.loginRequiredToSave}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {CRITTER_CATS.map((c, i) => {
            const list = critterQueries[i].data ?? []
            const donated = list.filter((r) => map[`${c}:${r.name}`]?.donated).length
            return <ProgressBar key={c} value={donated} total={list.length} label={`${critterCategory[c]} 기증`} />
          })}
          <ProgressBar
            value={(recipesQ.data ?? []).filter((r) => learned.has(r.name)).length}
            total={(recipesQ.data ?? []).length}
            label="DIY 레시피 습득"
          />
          <ProgressBar value={itemRate.owned} total={itemRate.total} label="아이템 보유(숨김 제외)" />
        </div>
      </section>

      {/* 우리 섬 주민 */}
      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-bold">🏝 우리 섬 주민 ({residents.length})</h2>
        {residents.length === 0 ? (
          <p className="text-sm text-leaf-400">
            주민 페이지에서 '내 주민'을 등록하면 여기에 표시돼요.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {residents.map((v) => {
              const hasPhoto = vmap[v.name]?.photo
              return (
                <button key={v.name} onClick={() => setDetail(v)} className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={v.nh_details?.icon_url || v.image_url}
                      alt={v.name}
                      loading="lazy"
                      className="h-14 w-14 object-contain"
                    />
                    <span className={'absolute -right-1 -top-1 text-xs ' + (hasPhoto ? '' : 'opacity-25 grayscale')}>
                      🖼️
                    </span>
                  </div>
                  <span className="mt-0.5 truncate text-[11px]">{koV(v.name)}</span>
                  <span className="text-[10px] text-leaf-400">{tr(speciesKo, v.species)}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <VillagerDetailModal
        villager={detail}
        koName={detail ? koV(detail.name) : undefined}
        photoOwned={detail ? !!vmap[detail.name]?.photo : false}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
