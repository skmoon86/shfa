import type { DayForecast } from '../../lib/weather/forecast'
import { SnowLevel, Weather } from '../../lib/weather/forecast'

// 게임일 순서(05시 시작 → 익일 04시까지). MeteoNook DayVisualisationBar 재현.
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4]

function glyph(w: Weather, snow: boolean): string {
  switch (w) {
    case Weather.Sunny:
      return '🌤️'
    case Weather.Cloudy:
      return '🌥️'
    case Weather.RainClouds:
      return '☁️'
    case Weather.Rain:
      return snow ? '❄️' : '💧'
    case Weather.HeavyRain:
      return snow ? '❄️' : '💦'
    default:
      return '' // Clear = 맑은 하늘(파란 칸, 글리프 없음)
  }
}
const isGrey = (w: Weather) => w === Weather.RainClouds || w === Weather.Rain || w === Weather.HeavyRain

export function WeatherHourBar({ day }: { day: DayForecast }) {
  const snow = day.snowLevel !== SnowLevel.None
  return (
    <div className="flex w-full select-none overflow-hidden rounded-md">
      {HOURS.map((h) => {
        const w = day.weather[h]
        return (
          <div
            key={h}
            title={`${String(h).padStart(2, '0')}시`}
            className={
              'flex h-6 flex-1 items-center justify-center text-[9px] leading-none ' +
              (isGrey(w)
                ? 'bg-gradient-to-b from-[#657ca1] to-[#bfdbe6] '
                : 'bg-gradient-to-b from-[#5b9bff] to-[#8ee1ff] ') +
              (h === 11 || h === 23 ? 'border-r border-black/40' : '')
            }
          >
            {glyph(w, snow)}
          </div>
        )
      })}
    </div>
  )
}
