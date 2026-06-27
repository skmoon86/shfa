import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { settings, datasetLabel, ui } from '../i18n/ko'

// 갱신 대상(클라이언트 nookipedia.ts 키와 일치). events는 연도별로 따로 받는다.
const BASE_ENDPOINTS = [
  'fish', 'bugs', 'sea', 'fossils', 'art', 'recipes', 'villagers',
  'furniture', 'clothing', 'interior', 'items', 'tools', 'photos', 'gyroids',
]

interface DatasetMeta {
  endpoint: string
  count: number
  fetched_at: string
}
type Status = 'ok' | 'fail'

// Edge Function `nook-snapshot` 1회 호출
async function snapshotOne(query: string, token: string): Promise<DatasetMeta> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/nook-snapshot?${query}`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? `오류 ${res.status}`)
  return body as DatasetMeta
}

export function SettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ cur: number; total: number; label: string } | null>(null)
  const [results, setResults] = useState<Record<string, Status>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 갱신 작업 목록(올해·내년 행사 포함)
  const tasks = useMemo(() => {
    const year = new Date().getFullYear()
    const list = BASE_ENDPOINTS.map((e) => ({ key: e, query: `endpoint=${e}` }))
    list.push({ key: `events:${year}`, query: `endpoint=events&year=${year}` })
    list.push({ key: `events:${year + 1}`, query: `endpoint=events&year=${year + 1}` })
    return list
  }, [])

  // 저장본 메타(대용량 data 컬럼 제외)
  const metaQ = useQuery({
    queryKey: ['nook-dataset-meta'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nook_dataset')
        .select('endpoint,count,fetched_at')
      if (error) throw error
      return (data ?? []) as DatasetMeta[]
    },
  })
  const metaByKey = useMemo(() => {
    const m: Record<string, DatasetMeta> = {}
    for (const row of metaQ.data ?? []) m[row.endpoint] = row
    return m
  }, [metaQ.data])

  async function runAll() {
    setRunning(true)
    setErrorMsg(null)
    setResults({})
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      setErrorMsg(settings.loginRequired)
      setRunning(false)
      return
    }
    const total = tasks.length
    const res: Record<string, Status> = {}
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      setProgress({ cur: i + 1, total, label: datasetLabel(t.key) })
      try {
        await snapshotOne(t.query, token)
        res[t.key] = 'ok'
      } catch {
        res[t.key] = 'fail'
      }
      setResults({ ...res })
    }
    setProgress(null)
    setRunning(false)
    // 저장본·메타 갱신 반영
    await queryClient.invalidateQueries({ queryKey: ['nook'] })
    await metaQ.refetch()
  }

  if (!user) {
    return (
      <div className="py-16 text-center text-leaf-500">{settings.loginRequired}</div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-xl font-bold">{settings.title}</h1>
        <p className="mt-1 text-sm text-leaf-500">{settings.intro}</p>
      </header>

      <div className="rounded-2xl border border-leaf-100 bg-white p-4 dark:border-leaf-700 dark:bg-leaf-800">
        <button onClick={runAll} disabled={running} className="btn-primary w-full sm:w-auto">
          {running ? settings.refreshing : settings.refreshAll}
        </button>

        {progress && (
          <div className="mt-3">
            <div className="mb-1 text-sm text-leaf-500">
              {progress.label} 갱신 중 ({progress.cur}/{progress.total})
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-700">
              <div
                className="h-full rounded-full bg-leaf-500 transition-all"
                style={{ width: `${(progress.cur / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        {!running && Object.keys(results).length > 0 && (
          <div className="mt-3 text-sm text-leaf-500">{settings.doneAll}</div>
        )}
        {errorMsg && <div className="mt-3 text-sm text-rose-500">{errorMsg}</div>}
      </div>

      {/* 엔드포인트별 마지막 갱신 시각·개수 */}
      <div className="overflow-hidden rounded-2xl border border-leaf-100 dark:border-leaf-700">
        <table className="w-full text-sm">
          <thead className="bg-sand-50 text-left text-leaf-500 dark:bg-leaf-900">
            <tr>
              <th className="px-3 py-2 font-medium">{ui.detail}</th>
              <th className="px-3 py-2 text-right font-medium">{settings.countLabel}</th>
              <th className="px-3 py-2 text-right font-medium">{settings.lastFetched}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const meta = metaByKey[t.key]
              const status = results[t.key]
              return (
                <tr key={t.key} className="border-t border-leaf-100 dark:border-leaf-700">
                  <td className="px-3 py-2">
                    {datasetLabel(t.key)}
                    {status === 'fail' && (
                      <span className="ml-2 text-xs text-rose-500">{settings.failed}</span>
                    )}
                    {status === 'ok' && <span className="ml-2 text-xs text-leaf-500">✓</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {meta ? meta.count.toLocaleString('ko-KR') : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-leaf-400">
                    {meta ? new Date(meta.fetched_at).toLocaleString('ko-KR') : settings.never}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
