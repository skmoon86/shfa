import { useState } from 'react'
import { useSelectedDate } from '../context/DateContext'
import { useTodos } from '../hooks/useTodos'
import { useTodoCompletions } from '../hooks/useTodos'
import { useUserPrefs } from '../hooks/useUserPrefs'
import { useCanSave } from './Toggle'
import { TODO_PRESETS, LEGACY_PRESETS, presetKey, todoKey } from '../data/todoPresets'

// 선택 날짜 기준 To-do 체크리스트(프리셋 8 + 직접 추가). 홈 상단에 표시.
export function TodoList() {
  const { iso } = useSelectedDate()
  const canSave = useCanSave()
  const { todos, add, remove } = useTodos(iso)
  const { done, toggle } = useTodoCompletions(iso)
  const { prefs, update } = useUserPrefs()
  const [newTitle, setNewTitle] = useState('')
  const [editPresets, setEditPresets] = useState(false)

  // 허용목록이 없으면 전체 노출. 있으면 허용된 레거시 프리셋 + 신규 프리셋(레거시 외)은 항상 노출.
  const visiblePresets = TODO_PRESETS.filter(
    (p) => !prefs.enabledPresets.length || prefs.enabledPresets.includes(p) || !LEGACY_PRESETS.includes(p),
  )

  const togglePresetVisible = (name: string) => {
    const base = prefs.enabledPresets.length ? prefs.enabledPresets : [...TODO_PRESETS]
    const next = base.includes(name) ? base.filter((p) => p !== name) : [...base, name]
    update.mutate({ enabledPresets: next })
  }

  const totalCount = visiblePresets.length + todos.length
  const doneCount =
    visiblePresets.filter((p) => done.has(presetKey(p))).length +
    todos.filter((t) => done.has(todoKey(t.id))).length

  const Row = ({ taskKey, label, onDelete }: { taskKey: string; label: string; onDelete?: () => void }) => {
    const checked = done.has(taskKey)
    return (
      <li className="flex items-center gap-2">
        <button
          onClick={() => toggle.mutate(taskKey)}
          disabled={!canSave}
          className={
            'flex h-6 w-6 items-center justify-center rounded-md border text-xs transition disabled:opacity-40 ' +
            (checked
              ? 'border-leaf-500 bg-leaf-500 text-white'
              : 'border-leaf-300 dark:border-leaf-600')
          }
        >
          {checked ? '✓' : ''}
        </button>
        <span className={'flex-1 text-sm ' + (checked ? 'text-leaf-400 line-through' : '')}>
          {label}
        </span>
        {onDelete && (
          <button onClick={onDelete} disabled={!canSave} className="text-xs text-leaf-300 hover:text-red-400">
            ✕
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold">✅ 오늘 할 일</h2>
        <span className="text-xs text-leaf-400">
          {doneCount} / {totalCount}
          <button
            onClick={() => setEditPresets((v) => !v)}
            className="ml-2 text-leaf-400 hover:text-leaf-500"
            title="프리셋 표시 설정"
          >
            ⚙️
          </button>
        </span>
      </div>

      {editPresets && (
        <div className="mb-2 flex flex-wrap gap-1.5 rounded-lg bg-leaf-50 p-2 dark:bg-leaf-700">
          {TODO_PRESETS.map((p) => {
            const on = visiblePresets.includes(p)
            return (
              <button
                key={p}
                onClick={() => togglePresetVisible(p)}
                disabled={!canSave}
                className={
                  'rounded-full px-2 py-0.5 text-[11px] transition disabled:opacity-40 ' +
                  (on ? 'bg-leaf-500 text-white' : 'bg-leaf-200 text-leaf-500 dark:bg-leaf-600')
                }
              >
                {on ? '✓ ' : ''}{p}
              </button>
            )
          })}
        </div>
      )}

      <ul className="space-y-1.5">
        {visiblePresets.map((p) => (
          <Row key={p} taskKey={presetKey(p)} label={p} />
        ))}
        {todos.map((t) => (
          <Row key={t.id} taskKey={todoKey(t.id)} label={t.title} onDelete={() => remove.mutate(t.id)} />
        ))}
      </ul>

      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault()
          const v = newTitle.trim()
          if (!v) return
          add.mutate(v)
          setNewTitle('')
        }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="할 일 추가"
          disabled={!canSave}
          className="flex-1 rounded-lg border border-leaf-200 bg-white px-2 py-1 text-sm disabled:opacity-40 dark:border-leaf-700 dark:bg-leaf-800"
        />
        <button type="submit" disabled={!canSave} className="btn-primary text-xs disabled:opacity-40">
          추가
        </button>
      </form>
      {!canSave && <p className="mt-2 text-xs text-leaf-400">로그인하면 체크·추가할 수 있어요.</p>}
    </div>
  )
}
