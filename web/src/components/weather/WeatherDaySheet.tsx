import { Sheet } from '../Sheet'
import type { DayForecast } from '../../lib/weather/forecast'
import { SnowLevel, SpecialDay, hasAuroraAtHour, patternKind } from '../../lib/weather/forecast'
import { tWeather, tWeatherEmoji, specialDayName, constellationName, patternKindName } from '../../i18n/terms'
import { weatherLabel as L } from '../../i18n/ko'
import { WeatherHourBar } from './WeatherHourBar'

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4]
const pad = (n: number) => String(n).padStart(2, '0')

// 일별 상세(바텀시트): 시간 막대 + 시간별 날씨/바람 + 별똥별·무지개·오로라·안개. MeteoNook DayModal 재현.
export function WeatherDaySheet({
  day,
  hemi,
  onClose,
}: {
  day: DayForecast | null
  hemi: 'north' | 'south'
  onClose: () => void
}) {
  const open = !!day
  const snow = day ? day.snowLevel !== SnowLevel.None : false

  // 별똥별: 시(hour)별로 "HH:MM - :ss, :ss" 문자열 묶기
  const starsByHour = new Map<number, string[]>()
  if (day) {
    for (const st of day.shootingStars) {
      const secs = st.seconds.filter((s) => s !== 99).map((s) => ':' + pad(s)).join(', ')
      const line = `${pad(st.hour)}:${pad(st.minute)}` + (secs ? ` — ${secs}` : '')
      const arr = starsByHour.get(st.hour) ?? []
      arr.push(line)
      starsByHour.set(st.hour, arr)
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      {day && (
        <div>
          <h2 className="text-lg font-bold">
            {day.month}월 {day.day}일 날씨
          </h2>
          <p className="mt-0.5 text-sm text-leaf-500">
            {L.pattern}: {patternKindName[patternKind(day.pattern)]} · {constellationName[day.constellation]}
          </p>
          {day.specialDay !== SpecialDay.None && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              🎉 {specialDayName[day.specialDay - 1]}
            </p>
          )}

          <div className="mt-3">
            <WeatherHourBar day={day} />
          </div>

          <ul className="mt-3 space-y-1 text-sm">
            {HOURS.map((h) => {
              const stars = starsByHour.get(h) ?? []
              return (
                <li key={h}>
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="w-12 shrink-0 font-semibold tabular-nums">{pad(h)}:00</span>
                    <span className="text-leaf-400" title={L.windPower}>🍃{day.windPower[h]}</span>
                    <span>
                      {tWeatherEmoji(day.weather[h], snow)} {tWeather(day.weather[h], snow)}
                    </span>
                    {h === 7 && day.heavyFog && <span className="text-leaf-500">🌫️ {L.heavyFog}</span>}
                    {h === 7 && day.waterFog && <span className="text-leaf-500">🌫️ {L.waterFog}</span>}
                    {h === day.rainbowHour && day.rainbowCount === 1 && (
                      <span className="font-medium text-sky-600 dark:text-sky-400">🌈 {L.rainbowSingle}</span>
                    )}
                    {h === day.rainbowHour && day.rainbowCount === 2 && (
                      <span className="font-medium text-sky-600 dark:text-sky-400">🌈🌈 {L.rainbowDouble}</span>
                    )}
                    {hasAuroraAtHour(day, h) && (
                      <span className="font-medium text-violet-600 dark:text-violet-400">
                        🌌 {hemi === 'north' ? L.auroraN : L.auroraS}
                      </span>
                    )}
                  </div>
                  {stars.map((s, i) => (
                    <div key={i} className="ml-12 text-xs text-amber-600 dark:text-amber-400">
                      🌠 {s}
                    </div>
                  ))}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Sheet>
  )
}
