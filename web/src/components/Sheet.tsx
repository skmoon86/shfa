import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

// 모바일: 하단에서 올라오는 바텀시트 / 데스크톱: 가운데 모달
export function Sheet({
  open,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}) {
  // popstate 콜백이 항상 최신 onClose를 부르도록 ref로 보관
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // 뒤로가기(안드로이드/브라우저) 시 페이지 이동 대신 시트만 닫기
  useEffect(() => {
    if (!open) return
    // 시트 전용 히스토리 항목을 하나 쌓아 둔다
    window.history.pushState({ sheet: true }, '')
    const onPop = () => onCloseRef.current()
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // 닫기 버튼·배경 클릭으로 닫힌 경우엔 우리가 쌓은 항목이 남아 있으므로 제거.
      // 뒤로가기로 닫힌 경우엔 브라우저가 이미 제거해 sheet 상태가 아니다.
      if (window.history.state?.sheet) window.history.back()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={
          'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-leaf-800 sm:max-h-[85vh] sm:rounded-2xl ' +
          maxWidth
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="flex justify-center py-2 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-leaf-200 dark:bg-leaf-600" />
        </div>
        <div className="safe-bottom overflow-y-auto px-5 pb-5 sm:pt-2">{children}</div>
      </div>
    </div>
  )
}
