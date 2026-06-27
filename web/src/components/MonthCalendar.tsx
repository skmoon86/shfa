import { useSelectedDate, toISODate } from '../context/DateContext'

export interface DayMark {
  birthday?: boolean // 거주 주민 생일
  eventIcon?: string // 시즌 이벤트(종류·시작/종료별 이모지)
  critter?: boolean // 채집 가능 생물 변동(이 달 신규 등)
  recipe?: boolean // 시즌 레시피
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

// 월 달력. 셀 배지(생일/이벤트/채집/레시피), 선택일 강조, 실제 오늘 별도 표시.
export function MonthCalendar({
  year,
  month, // 0-based
  marks,
  onSelectDay,
}: {
  year: number
  month: number
  marks: Record<string, DayMark>
  onSelectDay?: (iso: string) => void
}) {
  const { date: selected, setDate } = useSelectedDate()
  const todayIso = toISODate(new Date())
  const selIso = toISODate(selected)

  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-leaf-400">
        {WEEKDAY.map((w, i) => (
          <div key={w} className={i === 0 ? 'text-red-400' : i === 6 ? 'text-sky-400' : ''}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const iso = toISODate(new Date(year, month, d))
          const m = marks[iso]
          const isSel = iso === selIso
          const isToday = iso === todayIso
          return (
            <button
              key={i}
              onClick={() => {
                setDate(new Date(year, month, d))
                onSelectDay?.(iso)
              }}
              className={
                'flex aspect-square flex-col items-center justify-start rounded-lg border p-1 text-xs transition ' +
                (isSel
                  ? 'border-leaf-500 bg-leaf-500 text-white'
                  : isToday
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950'
                    : 'border-leaf-100 hover:bg-leaf-50 dark:border-leaf-700 dark:hover:bg-leaf-700')
              }
            >
              <span className={isToday && !isSel ? 'font-bold text-amber-600' : ''}>{d}</span>
              {m && (
                <span className="mt-auto flex flex-wrap justify-center gap-0.5 text-[8px] leading-none">
                  {m.birthday && <span title="생일">🎂</span>}
                  {m.eventIcon && <span title="이벤트">{m.eventIcon}</span>}
                  {m.recipe && <span title="시즌 레시피">🔨</span>}
                  {m.critter && <span title="채집">🐟</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
