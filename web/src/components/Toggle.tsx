import { useAuth } from '../context/AuthContext'
import { ui } from '../i18n/ko'

// 채집/기증/습득 등 상태 토글 버튼(2~3개). 로그인 안 했으면 비활성.
export function ToggleButton({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean
  onClick: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? ui.loginRequiredToSave : undefined}
      className={
        'min-h-[36px] flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ' +
        (active
          ? 'bg-leaf-500 text-white'
          : 'bg-leaf-100 text-leaf-600 hover:bg-leaf-200 dark:bg-leaf-700 dark:text-sand-50')
      }
    >
      {active ? '✓ ' : ''}
      {label}
    </button>
  )
}

// 로그인 여부에 따라 disabled를 자동으로 처리하는 래퍼
export function useCanSave() {
  const { user } = useAuth()
  return !!user
}
