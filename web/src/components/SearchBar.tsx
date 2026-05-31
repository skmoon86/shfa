import { ui } from '../i18n/ko'

export function SearchBar({
  value,
  onChange,
  placeholder = ui.search,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full max-w-md">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-leaf-200 bg-white px-4 py-2 text-sm outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-200 dark:border-leaf-700 dark:bg-leaf-800"
      />
    </div>
  )
}
