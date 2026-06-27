import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── 직접 추가 미션(To-do) ─────────────────────────────────
export interface Todo {
  id: string
  title: string
  sort_order: number
}

// 직접추가 미션은 추가한 '그 날짜'(the_date)에만 노출. 프리셋(자동등록)은 날짜무관.
export function useTodos(iso: string) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['todos', uid, iso]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<Todo[]> => {
      const { data, error } = await supabase
        .from('todos')
        .select('id, title, sort_order')
        .eq('active', true)
        .eq('the_date', iso)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Todo[]
    },
  })

  const add = useMutation({
    mutationFn: async (title: string) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const cur = qc.getQueryData<Todo[]>(key) ?? []
      const { error } = await supabase.from('todos').insert({
        user_id: uid,
        title,
        sort_order: cur.length,
        the_date: iso,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const { error } = await supabase.from('todos').update({ active: false }).eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (id) =>
      qc.setQueryData<Todo[]>(key, (old) => (old ?? []).filter((t) => t.id !== id)),
  })

  return { todos: query.data ?? [], isLoading: query.isLoading, add, remove }
}

// ── 날짜별 완료 기록 ──────────────────────────────────────
// task_key = 'preset:<명>' | 'todo:<uuid>'. 날짜별 행 → 날짜 전환 시 빈 셋.
export function useTodoCompletions(iso: string) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const uid = user?.id
  const key = ['todo-completions', uid, iso]

  const query = useQuery({
    queryKey: key,
    enabled: !!uid,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('todo_completions')
        .select('task_key, done')
        .eq('the_date', iso)
      if (error) throw error
      return new Set((data ?? []).filter((r) => r.done).map((r) => r.task_key))
    },
  })

  const toggle = useMutation({
    mutationFn: async (taskKey: string) => {
      if (!uid) throw new Error('로그인이 필요합니다.')
      const done = !(qc.getQueryData<Set<string>>(key) ?? new Set()).has(taskKey)
      const { error } = await supabase.from('todo_completions').upsert({
        user_id: uid,
        the_date: iso,
        task_key: taskKey,
        done,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return { taskKey, done }
    },
    onSuccess: ({ taskKey, done }) => {
      qc.setQueryData<Set<string>>(key, (old) => {
        const next = new Set(old ?? [])
        if (done) next.add(taskKey)
        else next.delete(taskKey)
        return next
      })
    },
  })

  return { done: query.data ?? new Set<string>(), isLoading: query.isLoading, toggle }
}
