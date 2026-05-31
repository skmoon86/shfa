type Tab<T extends string> = { code: T; label: string }

const BASE = 'shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition '
const ON = 'bg-leaf-500 text-white'
const OFF = 'bg-leaf-100 text-leaf-600 hover:bg-leaf-200 dark:bg-leaf-700 dark:text-sand-50'

/**
 * 카테고리 다중선택 탭. 아무것도 선택하지 않으면(전체) 전체 표시.
 * '전체' 버튼은 선택을 모두 해제한다.
 */
export function CategoryTabs<T extends string>({
  tabs,
  selected,
  onToggle,
  onClear,
  allLabel = '전체',
}: {
  tabs: Tab<T>[]
  selected: Set<T>
  onToggle: (code: T) => void
  onClear: () => void
  allLabel?: string
}) {
  return (
    <div className="no-scrollbar mb-4 -mx-4 flex gap-2 overflow-x-auto px-4">
      <button onClick={onClear} className={BASE + (selected.size === 0 ? ON : OFF)}>
        {allLabel}
      </button>
      {tabs.map((t) => (
        <button
          key={t.code}
          onClick={() => onToggle(t.code)}
          className={BASE + (selected.has(t.code) ? ON : OFF)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
