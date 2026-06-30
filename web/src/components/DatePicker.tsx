import type { ReactNode } from 'react'
import { useSelectedDate, toISODate } from '../context/DateContext'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

// 전역 선택 날짜 표시 + 수정. 홈·캘린더 상단에서 사용.
// extra: 날짜 라벨과 날짜 선택 입력 사이에 끼워 넣을 내용(예: 그날 날씨 배지).
export function DatePicker({ compact = false, extra }: { compact?: boolean; extra?: ReactNode }) {
  const { date, setDate, resetToday, isToday } = useSelectedDate()
  const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY[date.getDay()]})`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={compact ? 'text-sm font-semibold' : 'text-lg font-bold'}>
        📅 {label}
      </span>
      {extra}
      <input
        type="date"
        value={toISODate(date)}
        onChange={(e) => {
          const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e.target.value)
          if (m) setDate(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
        }}
        className="rounded-xl border border-leaf-200 bg-white px-2 py-1 text-sm dark:border-leaf-700 dark:bg-leaf-800"
      />
      {!isToday && (
        <button onClick={resetToday} className="btn-ghost text-xs">
          오늘로
        </button>
      )}
    </div>
  )
}
