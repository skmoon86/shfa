import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useUserPrefs } from '../hooks/useUserPrefs'
import { useSelectedDate } from '../context/DateContext'
import {
  getYearAggregate,
  getMonthForecast,
  getDayForecast,
  toHemisphere,
  type DayForecast,
} from '../lib/weather/forecast'
import { WeatherYearView } from '../components/weather/WeatherYearView'
import { WeatherMonthView } from '../components/weather/WeatherMonthView'
import { WeatherDaySheet } from '../components/weather/WeatherDaySheet'
import { weatherLabel as L } from '../i18n/ko'

const MIN_YEAR = 2000
const MAX_YEAR = 2060

export function WeatherPage() {
  const { prefs } = useUserPrefs()
  const seed = prefs.weatherSeed
  const hemiStr = prefs.hemisphere
  const hemi = toHemisphere(hemiStr)
  const { date } = useSelectedDate()
  const hasSeed = seed != null

  // 홈 날씨 배지 딥링크(?day=1): 선택 날짜의 일별 시트를 바로 연다.
  // StrictMode 이중 실행·뒤로가기 재트리거를 피하려고 effect가 아닌 초기값에서 소비.
  const [searchParams, setSearchParams] = useSearchParams()
  const wantDay =
    searchParams.get('day') != null &&
    hasSeed &&
    date.getFullYear() >= MIN_YEAR &&
    date.getFullYear() <= MAX_YEAR

  const [view, setView] = useState<'year' | 'month'>(wantDay ? 'month' : 'year')
  const [year, setYear] = useState(() => Math.min(MAX_YEAR, Math.max(MIN_YEAR, date.getFullYear())))
  const [month, setMonth] = useState(() => date.getMonth() + 1)
  const [daySheet, setDaySheet] = useState<DayForecast | null>(() =>
    wantDay
      ? getDayForecast(hemi, seed!, date.getFullYear(), date.getMonth() + 1, date.getDate(), true)
      : null,
  )

  // URL의 day 파라미터는 소비 즉시 제거 — 새로고침 시 시트가 다시 열리지 않고,
  // 뒤로가기는 홈으로 정상 복귀한다.
  useEffect(() => {
    if (searchParams.has('day')) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const yearAgg = useMemo(
    () => (hasSeed && view === 'year' ? getYearAggregate(hemi, seed!, year) : []),
    [hasSeed, view, hemi, seed, year],
  )
  const monthDays = useMemo(
    () => (hasSeed && view === 'month' ? getMonthForecast(hemi, seed!, year, month) : []),
    [hasSeed, view, hemi, seed, year, month],
  )

  // 출처·소스 안내 (AGPL-3.0 §13: 네트워크 이용자에게 소스 제공 안내)
  const credit = (
    <p className="pt-1 text-center text-[11px] leading-relaxed text-leaf-400">
      날씨 예측 알고리즘:{' '}
      <a href="https://github.com/Treeki/MeteoNook" target="_blank" rel="noreferrer" className="underline">
        MeteoNook
      </a>{' '}
      © Ash Wolf, AGPL-3.0 ·{' '}
      <a href="https://github.com/skmoon86/shfa" target="_blank" rel="noreferrer" className="underline">
        소스 코드
      </a>
    </p>
  )

  // 빈 상태: 시드 미입력
  if (!hasSeed) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <div className="card space-y-3 p-6 text-center">
          <div className="text-4xl">🌤️</div>
          <h2 className="text-lg font-bold">{L.noSeedTitle}</h2>
          <p className="mx-auto max-w-md text-sm text-leaf-500">{L.noSeedBody}</p>
          <Link to="/settings" className="btn-primary inline-flex">
            {L.goSettings}
          </Link>
        </div>
        {credit}
      </div>
    )
  }

  function prevYear() {
    setYear((y) => Math.max(MIN_YEAR, y - 1))
  }
  function nextYear() {
    setYear((y) => Math.min(MAX_YEAR, y + 1))
  }
  function prevMonth() {
    if (month === 1) {
      if (year > MIN_YEAR) {
        setMonth(12)
        setYear((y) => y - 1)
      }
    } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 12) {
      if (year < MAX_YEAR) {
        setMonth(1)
        setYear((y) => y + 1)
      }
    } else setMonth((m) => m + 1)
  }

  function openDay(d: DayForecast) {
    setDaySheet(getDayForecast(hemi, seed!, d.year, d.month, d.day, true))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <span className="text-[11px] text-leaf-400">{L.hemiNote(hemiStr)}</span>
      </div>

      {view === 'year' ? (
        <>
          {/* 연도 네비 */}
          <div className="flex items-center gap-2">
            <button onClick={prevYear} disabled={year <= MIN_YEAR} className="btn-ghost disabled:opacity-30">
              «
            </button>
            <span className="flex-1 text-center text-lg font-bold tabular-nums">{year}</span>
            <button onClick={nextYear} disabled={year >= MAX_YEAR} className="btn-ghost disabled:opacity-30">
              »
            </button>
          </div>
          <WeatherYearView
            months={yearAgg}
            onSelect={(m) => {
              setMonth(m)
              setView('month')
            }}
          />
        </>
      ) : (
        <>
          {/* 월 네비 + 연간 복귀 */}
          <div className="flex items-center gap-2">
            <button onClick={() => setView('year')} className="btn-ghost text-sm">
              ← {L.year}
            </button>
            <button onClick={prevMonth} className="btn-ghost">
              «
            </button>
            <span className="flex-1 text-center text-base font-bold tabular-nums">
              {year}년 {month}월
            </span>
            <button onClick={nextMonth} className="btn-ghost">
              »
            </button>
          </div>
          <section className="card p-3">
            <WeatherMonthView days={monthDays} onSelectDay={openDay} />
          </section>
        </>
      )}

      <WeatherDaySheet day={daySheet} hemi={hemiStr} onClose={() => setDaySheet(null)} />
      {credit}
    </div>
  )
}
