import { ui } from '../i18n/ko'

export function Spinner({ label = ui.loading }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-leaf-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-leaf-200 border-t-leaf-500" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error)
  return (
    <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <p className="font-semibold">{ui.error}</p>
      <p className="mt-1 break-all opacity-80">{msg}</p>
    </div>
  )
}

export function EmptyState({ label = ui.empty }: { label?: string }) {
  return (
    <div className="py-16 text-center text-sm text-leaf-400">{label}</div>
  )
}
