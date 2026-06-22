import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nookipedia } from '../lib/nookipedia'
import { useVillagerState } from '../hooks/useVillagerState'
import { useEvents, eventsOn } from '../hooks/useEvents'
import { useSelectedDate, toISODate } from '../context/DateContext'
import { useKoNames } from '../hooks/useKoNames'
import { DatePicker } from '../components/DatePicker'
import { MonthCalendar, type DayMark } from '../components/MonthCalendar'
import { Spinner } from '../components/states'
import { tEvent } from '../i18n/ko'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function CalendarPage() {
  const { date, iso } = useSelectedDate()
  const year = date.getFullYear()
  const month = date.getMonth()
  const monthName = MONTHS[month]
  const { map: vmap } = useVillagerState()
  const { data: events, isLoading } = useEvents(year)
  const koV = useKoNames('villagers')

  const villagersQ = useQuery({
    queryKey: ['nook', 'villagers'],
    queryFn: () => nookipedia.villagers({ nhdetails: true }),
  })

  // 거주 주민 중 이번 달 생일자
  const monthBirthdays = useMemo(
    () =>
      (villagersQ.data ?? []).filter(
        (v) => vmap[v.name]?.resident && v.birthday_month === monthName,
      ),
    [villagersQ.data, vmap, monthName],
  )

  // 이번 달 이벤트
  const monthEvents = useMemo(
    () => (events ?? []).filter((e) => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)),
    [events, year, month],
  )

  // 달력 셀 배지
  const marks = useMemo(() => {
    const m: Record<string, DayMark> = {}
    const set = (k: string, f: keyof DayMark) => {
      m[k] = { ...(m[k] ?? {}), [f]: true }
    }
    for (const v of monthBirthdays) {
      if (!v.birthday_day) continue
      set(toISODate(new Date(year, month, Number(v.birthday_day))), 'birthday')
    }
    for (const e of monthEvents) set(e.date, 'event')
    return m
  }, [monthBirthdays, monthEvents, year, month])

  const selectedBirthdays = monthBirthdays.filter((v) => Number(v.birthday_day) === date.getDate())
  const selectedEvents = eventsOn(events, iso)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">캘린더</h1>

      <section className="card space-y-2 p-5">
        <DatePicker />
        <div className="flex flex-wrap gap-2 text-sm">
          {selectedEvents.map((e, i) => (
            <span key={i} className="chip">🎉 {tEvent(e.event)}</span>
          ))}
          {selectedBirthdays.map((v) => (
            <span key={v.name} className="chip">🎂 {koV(v.name)} 생일</span>
          ))}
          {selectedEvents.length === 0 && selectedBirthdays.length === 0 && (
            <span className="text-leaf-400">선택한 날짜에 거주 주민 생일·이벤트가 없어요.</span>
          )}
        </div>
        <p className="text-[11px] text-leaf-400">※ 이벤트는 북반구 기준입니다.</p>
      </section>

      <section className="card p-4">
        {isLoading ? <Spinner /> : <MonthCalendar year={year} month={month} marks={marks} />}
      </section>

      {/* 이번 달 이벤트 목록 */}
      <section className="card space-y-2 p-5">
        <h2 className="text-sm font-bold">📅 {month + 1}월 이벤트</h2>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-leaf-400">이번 달 등록된 이벤트가 없어요.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {monthEvents.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="tabular-nums text-leaf-400">{e.date.slice(8)}일</span>
                <span>🎉 {tEvent(e.event)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
