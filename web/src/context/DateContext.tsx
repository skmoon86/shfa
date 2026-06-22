import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// 앱 전역에서 공유하는 '선택 날짜' 하나. To-do · 캘린더 · 도감의 '현재 포획 가능'을
// 모두 이 날짜가 구동한다. localStorage에 영속하며 최초값은 실제 오늘.

const STORAGE_KEY = 'acnh.selectedDate'

// 로컬 타임존 기준 YYYY-MM-DD (UTC 변환으로 날짜가 밀리지 않게 직접 포맷)
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d.getTime()) ? null : d
}

interface DateState {
  date: Date // 선택된 날짜(자정 기준)
  iso: string // YYYY-MM-DD
  setDate: (d: Date) => void
  resetToday: () => void
  isToday: boolean // 선택일이 실제 오늘과 같은지
}

const DateContext = createContext<DateState | undefined>(undefined)

export function DateProvider({ children }: { children: ReactNode }) {
  const [date, setDateState] = useState<Date>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return (stored && fromISODate(stored)) || new Date()
  })

  const setDate = (d: Date) => {
    const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    setDateState(normalized)
  }
  const resetToday = () => setDate(new Date())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, toISODate(date))
  }, [date])

  const isToday = toISODate(date) === toISODate(new Date())

  return (
    <DateContext.Provider value={{ date, iso: toISODate(date), setDate, resetToday, isToday }}>
      {children}
    </DateContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSelectedDate() {
  const ctx = useContext(DateContext)
  if (!ctx) throw new Error('useSelectedDate must be used within DateProvider')
  return ctx
}
