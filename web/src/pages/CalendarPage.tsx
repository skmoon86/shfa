import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nookipedia } from '../lib/nookipedia'
import { useVillagerState } from '../hooks/useVillagerState'
import { useEvents } from '../hooks/useEvents'
import { useUserPrefs } from '../hooks/useUserPrefs'
import { useSelectedDate, toISODate } from '../context/DateContext'
import { useKoNames } from '../hooks/useKoNames'
import { DatePicker } from '../components/DatePicker'
import { MonthCalendar, type DayMark } from '../components/MonthCalendar'
import { Spinner } from '../components/states'
import { tEvent, eventHemisphere } from '../i18n/ko'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function CalendarPage() {
  const { date } = useSelectedDate()
  const year = date.getFullYear()
  const month = date.getMonth()
  const monthName = MONTHS[month]
  const { map: vmap } = useVillagerState()
  const { prefs } = useUserPrefs()
  const hemi = prefs.hemisphere
  const { data: events, isLoading } = useEvents(year)
  const koV = useKoNames('villagers')

  const villagersQ = useQuery({
    queryKey: ['nook', 'villagers'],
    queryFn: () => nookipedia.villagers({ nhdetails: true }),
  })

  // 거주(내 섬) 주민 중 이번 달 생일 — 달력 배지·선택일 칩용(내 주민만)
  const residentBirthdays = useMemo(
    () =>
      (villagersQ.data ?? []).filter(
        (v) => vmap[v.name]?.resident && v.birthday_month === monthName && v.birthday_day,
      ),
    [villagersQ.data, vmap, monthName],
  )

  // 모든 주민 이번 달 생일 — 이벤트 목록용(전체 주민)
  const allBirthdays = useMemo(
    () =>
      (villagersQ.data ?? [])
        .filter((v) => v.birthday_month === monthName && v.birthday_day)
        .map((v) => ({ day: Number(v.birthday_day), name: v.name })),
    [villagersQ.data, monthName],
  )

  // 이번 달 이벤트(생일·노이즈 제외, 한글화, 반구 필터)
  const monthEvents = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return (events ?? [])
      .filter((e) => e.date.startsWith(prefix))
      .filter((e) => {
        const h = eventHemisphere(e.event)
        return !h || h === hemi
      })
      .map((e) => ({ day: Number(e.date.slice(8, 10)), label: tEvent(e.event) }))
      .filter((e) => e.label)
  }, [events, year, month, hemi])

  // 달력 셀 배지(거주 주민 생일 + 이벤트)
  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {}
    const set = (k: string, f: keyof DayMark) => {
      m[k] = { ...(m[k] ?? {}), [f]: true }
    }
    for (const v of residentBirthdays) {
      set(toISODate(new Date(year, month, Number(v.birthday_day))), 'birthday')
    }
    for (const e of monthEvents) set(toISODate(new Date(year, month, e.day)), 'event')
    return m
  }, [residentBirthdays, monthEvents, year, month])

  const day = date.getDate()
  const selectedEvents = monthEvents.filter((e) => e.day === day)
  const selectedBirthdays = residentBirthdays.filter((v) => Number(v.birthday_day) === day)

  // 이벤트 목록(이벤트 + 모든 주민 생일, 날짜순)
  const monthList = useMemo(() => {
    const items: { day: number; label: string; kind: 'event' | 'birthday' }[] = [
      ...monthEvents.map((e) => ({ day: e.day, label: e.label, kind: 'event' as const })),
      ...allBirthdays.map((b) => ({
        day: b.day,
        label: `${koV(b.name)} 생일`,
        kind: 'birthday' as const,
      })),
    ]
    return items.sort((a, b) => a.day - b.day || a.label.localeCompare(b.label, 'ko'))
  }, [monthEvents, allBirthdays, koV])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">캘린더</h1>

      <section className="card space-y-2 p-5">
        <DatePicker />
        <div className="flex flex-wrap gap-2 text-sm">
          {selectedEvents.map((e, i) => (
            <span key={`e${i}`} className="chip">🎉 {e.label}</span>
          ))}
          {selectedBirthdays.map((v) => (
            <span key={v.name} className="chip">🎂 {koV(v.name)} 생일</span>
          ))}
          {selectedEvents.length === 0 && selectedBirthdays.length === 0 && (
            <span className="text-leaf-400">선택한 날짜에 우리 섬 주민 생일·이벤트가 없어요.</span>
          )}
        </div>
        <p className="text-[11px] text-leaf-400">
          ※ 이벤트는 {hemi === 'north' ? '북반구' : '남반구'} 기준입니다.
        </p>
      </section>

      <section className="card p-4">
        {isLoading ? <Spinner /> : <MonthCalendar year={year} month={month} marks={marks} />}
      </section>

      {/* 이번 달 이벤트 + 모든 주민 생일 */}
      <section className="card space-y-2 p-5">
        <h2 className="text-sm font-bold">📅 {month + 1}월 이벤트 · 생일</h2>
        {monthList.length === 0 ? (
          <p className="text-sm text-leaf-400">이번 달 등록된 이벤트·생일이 없어요.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {monthList.map((it, i) => (
              <li key={i} className="flex gap-2">
                <span className="tabular-nums text-leaf-400">{it.day}일</span>
                <span>
                  {it.kind === 'birthday' ? '🎂' : '🎉'} {it.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
