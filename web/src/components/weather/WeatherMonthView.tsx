import type { DayForecast } from '../../lib/weather/forecast'
import { patternKind } from '../../lib/weather/forecast'
import { patternKindName } from '../../i18n/terms'
import { WeatherHourBar } from './WeatherHourBar'

const WD = ['일', '월', '화', '수', '목', '금', '토']

// 일별 요약 앞 이모지 (MeteoNook getDayPrefix 재현)
function prefix(d: DayForecast): string {
  const b: string[] = []
  if (d.heavyShower) b.push('🌠')
  if (d.lightShower) b.push('✨')
  if (d.rainbowCount === 1) b.push('🌈')
  if (d.rainbowCount === 2) b.push('🌈🌈')
  if (d.aurora) b.push('🌌')
  if (d.heavyFog || d.waterFog) b.push('🌫️')
  return b.join(' ')
}

// 월간: 일별 행(요일·날짜·이벤트·시간 막대). 클릭 → 일별 상세.
export function WeatherMonthView({
  days,
  onSelectDay,
}: {
  days: DayForecast[]
  onSelectDay: (d: DayForecast) => void
}) {
  return (
    <div className="divide-y divide-leaf-100 dark:divide-leaf-700">
      {days.map((d) => (
        <button
          key={d.day}
          onClick={() => onSelectDay(d)}
          className="block w-full py-2 text-left transition active:bg-leaf-50 dark:active:bg-leaf-700/40"
        >
          <div className="flex items-center gap-2 text-sm">
            <span
              className={
                'w-6 shrink-0 text-center text-xs ' +
                (d.weekday === 0 ? 'font-bold text-rose-500' : d.weekday === 6 ? 'font-bold text-sky-500' : 'text-leaf-400')
              }
            >
              {WD[d.weekday]}
            </span>
            <span className="w-7 shrink-0 text-right font-semibold tabular-nums">{d.day}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{prefix(d)}</span>
            <span className="shrink-0 text-[11px] text-leaf-400">{patternKindName[patternKind(d.pattern)]}</span>
          </div>
          <div className="mt-1">
            <WeatherHourBar day={d} />
          </div>
        </button>
      ))}
    </div>
  )
}
