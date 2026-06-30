import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useUserPrefs } from '../hooks/useUserPrefs'
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
  const { user, signOut } = useAuth()
  const queryClient = useQueryClient()

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ cur: number; total: number; label: string } | null>(null)
  const [results, setResults] = useState<Record<string, Status>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [cacheErr, setCacheErr] = useState<string | null>(null)

  // ── 반구 + 날씨 시드 ──
  const { prefs, update: updatePrefs } = useUserPrefs()
  const [seedInput, setSeedInput] = useState('')
  const [seedErr, setSeedErr] = useState<string | null>(null)
  const [seedSaved, setSeedSaved] = useState(false)
  // 로드된 시드를 입력칸에 동기화
  useEffect(() => {
    setSeedInput(prefs.weatherSeed == null ? '' : String(prefs.weatherSeed))
  }, [prefs.weatherSeed])

  function saveSeed() {
    setSeedErr(null)
    setSeedSaved(false)
    const t = seedInput.trim()
    if (t === '') {
      updatePrefs.mutate({ weatherSeed: null })
      setSeedSaved(true)
      return
    }
    const v = Number(t)
    if (!Number.isInteger(v) || v < 0 || v > 2147483647) {
      setSeedErr(settings.weatherSeedInvalid)
      return
    }
    updatePrefs.mutate({ weatherSeed: v })
    setSeedSaved(true)
  }

  // PWA 서비스워커·캐시스토리지·메모리 캐시를 비우고 새로고침.
  // (로그인 세션은 localStorage에 있으므로 건드리지 않아 유지된다.)
  async function clearCache() {
    setClearing(true)
    setCacheErr(null)
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
      queryClient.clear()
      // 캐시 우회 새로고침으로 최신 자산·데이터 재요청
      window.location.reload()
    } catch {
      setCacheErr(settings.cacheFail)
      setClearing(false)
    }
  }

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

      {/* 계정 정보 + 로그아웃 */}
      <div className="rounded-2xl border border-leaf-100 bg-white p-4 dark:border-leaf-700 dark:bg-leaf-800">
        <h2 className="text-sm font-semibold">{settings.account}</h2>
        <div className="mt-2 flex items-center gap-3">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url as string}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full"
            />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {(user.user_metadata?.full_name as string) ??
                (user.user_metadata?.name as string) ??
                settings.accountNoName}
            </div>
            <div className="truncate text-xs text-leaf-500">{user.email}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="btn mt-3 w-full border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/60 dark:text-rose-300 dark:hover:bg-rose-500/10 sm:w-auto"
        >
          {ui.logout}
        </button>
      </div>

      {/* 반구 */}
      <div className="rounded-2xl border border-leaf-100 bg-white p-4 dark:border-leaf-700 dark:bg-leaf-800">
        <h2 className="text-sm font-semibold">{settings.hemisphereTitle}</h2>
        <p className="mt-1 text-sm text-leaf-500">{settings.hemisphereIntro}</p>
        <div className="mt-3 flex gap-2">
          {(['north', 'south'] as const).map((h) => (
            <button
              key={h}
              onClick={() => updatePrefs.mutate({ hemisphere: h })}
              className={
                'btn flex-1 sm:flex-none ' +
                (prefs.hemisphere === h ? 'btn-primary' : 'border border-leaf-300 dark:border-leaf-600')
              }
            >
              {h === 'north' ? settings.north : settings.south}
            </button>
          ))}
        </div>
      </div>

      {/* 날씨 시드 */}
      <div className="rounded-2xl border border-leaf-100 bg-white p-4 dark:border-leaf-700 dark:bg-leaf-800">
        <h2 className="text-sm font-semibold">{settings.weatherSeedTitle}</h2>
        <p className="mt-1 text-sm text-leaf-500">{settings.weatherSeedIntro}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={seedInput}
            onChange={(e) => {
              setSeedInput(e.target.value.replace(/[^0-9]/g, ''))
              setSeedSaved(false)
              setSeedErr(null)
            }}
            placeholder={settings.weatherSeedPlaceholder}
            className="w-full rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm tabular-nums dark:border-leaf-600 dark:bg-leaf-900 sm:w-64"
          />
          <button onClick={saveSeed} className="btn-primary sm:w-auto">
            {settings.weatherSeedSave}
          </button>
        </div>
        {seedErr && <div className="mt-2 text-sm text-rose-500">{seedErr}</div>}
        {seedSaved && !seedErr && <div className="mt-2 text-sm text-leaf-500">{settings.weatherSeedSaved}</div>}
      </div>

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

      {/* 앱 캐시 삭제 */}
      <div className="rounded-2xl border border-leaf-100 bg-white p-4 dark:border-leaf-700 dark:bg-leaf-800">
        <h2 className="text-sm font-semibold">{settings.cacheTitle}</h2>
        <p className="mt-1 text-sm text-leaf-500">{settings.cacheIntro}</p>
        <button
          onClick={clearCache}
          disabled={clearing}
          className="btn mt-3 w-full border border-leaf-300 text-leaf-700 hover:bg-leaf-100 dark:border-leaf-600 dark:text-sand-50 dark:hover:bg-leaf-700 sm:w-auto"
        >
          {clearing ? settings.cacheClearing : settings.cacheBtn}
        </button>
        {cacheErr && <div className="mt-3 text-sm text-rose-500">{cacheErr}</div>}
      </div>
    </div>
  )
}
