export function ProgressBar({
  value,
  total,
  label,
}: {
  value: number
  total: number
  label?: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-leaf-500">
          {value} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-700">
        <div
          className="h-full rounded-full bg-leaf-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
