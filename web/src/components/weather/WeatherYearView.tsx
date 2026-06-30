import type { MonthAggregate } from '../../lib/weather/forecast'
import { weatherLabel as L } from '../../i18n/ko'

// 연간 개요: 12개월 카드 + 별똥별·무지개·오로라 횟수. 클릭 → 월간.
export function WeatherYearView({
  months,
  onSelect,
}: {
  months: MonthAggregate[]
  onSelect: (month: number) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {months.map((mo) => (
        <button
          key={mo.month}
          onClick={() => onSelect(mo.month)}
          className="card p-3 text-left transition active:scale-[0.99]"
        >
          <div className="text-sm font-bold">{mo.month}월</div>
          <div className="mt-1.5 space-y-0.5 text-[11px] text-leaf-500">
            <div>✨ {L.cLight} {mo.lightShowerCount}</div>
            <div>🌠 {L.cHeavy} {mo.heavyShowerCount}</div>
            {mo.rainbowCount > 0 && (
              <div>
                🌈 {L.cRainbow} {mo.rainbowCount}
                {mo.doubleRainbowCount > 0 ? ` · ${L.cDouble} ${mo.doubleRainbowCount}` : ''}
              </div>
            )}
            {mo.auroraCount > 0 && <div>🌌 {L.cAurora} {mo.auroraCount}</div>}
          </div>
        </button>
      ))}
    </div>
  )
}
