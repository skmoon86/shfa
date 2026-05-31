import type { Recipe } from '../lib/nookipedia'
import { ui, tSource, tNote } from '../i18n/ko'
import { fmtBells, fmtBuy, buyDetail } from '../lib/format'
import { useKoNames } from '../hooks/useKoNames'
import { Sheet } from './Sheet'

// 레시피 상세 카드 — 아이템 상세 카드와 동일한 레이아웃(헤더·가격·획득방법) + 재료 표시
export function RecipeDetailModal({
  recipe,
  title,
  onClose,
}: {
  recipe: Recipe | null
  title?: string
  onClose: () => void
}) {
  const koItem = useKoNames('items')
  return (
    <Sheet open={!!recipe} onClose={onClose} maxWidth="max-w-2xl">
      {recipe && (
        <>
          <div className="sticky top-0 -mx-5 mb-4 flex items-start justify-between gap-3 border-b border-leaf-100 bg-white px-5 pb-3 pt-1 dark:border-leaf-700 dark:bg-leaf-800">
            <div className="flex items-center gap-3">
              {recipe.image_url && (
                <img src={recipe.image_url} alt="" className="h-16 w-16 object-contain" />
              )}
              <div>
                <h2 className="text-lg font-bold">{title || recipe.name}</h2>
                <span className="text-xs text-leaf-400">DIY 레시피</span>
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost">
              {ui.close}
            </button>
          </div>

          {/* 가격 */}
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-leaf-50 p-3 dark:bg-leaf-700">
              <div className="text-xs text-leaf-400">{ui.buyPrice}</div>
              <div className="font-semibold">{fmtBuy(recipe.buy)}</div>
            </div>
            <div className="rounded-xl bg-leaf-50 p-3 dark:bg-leaf-700">
              <div className="text-xs text-leaf-400">{ui.sellPrice}</div>
              <div className="font-semibold">{fmtBells(recipe.sell)} 벨</div>
            </div>
          </div>

          {/* 재료 */}
          <div className="mb-4 rounded-xl border border-leaf-100 p-3 dark:border-leaf-700">
            <div className="mb-2 text-sm font-bold">🧱 {ui.materials}</div>
            {recipe.materials && recipe.materials.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {recipe.materials.map((m) => (
                  <span key={m.name} className="chip">
                    {koItem(m.name)} ×{m.count}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-leaf-400">정보 없음</p>
            )}
          </div>

          {/* 획득방법 */}
          <div className="mb-4 rounded-xl border border-leaf-100 p-3 dark:border-leaf-700">
            <div className="mb-1 text-sm font-bold">📦 획득방법</div>
            {recipe.availability && recipe.availability.length > 0 ? (
              <ul className="space-y-0.5 text-sm text-leaf-600 dark:text-sand-50">
                {recipe.availability.map((a, i) => (
                  <li key={i}>
                    • {tSource(a.from)}
                    {a.note ? <span className="text-leaf-400"> — {tNote(a.note)}</span> : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-leaf-400">정보 없음</p>
            )}
            {/* 상세 획득 방법: 구매 통화별 실제 구매처 + 가격 */}
            {buyDetail(recipe.buy).length > 0 && (
              <div className="mt-2 space-y-0.5 border-t border-leaf-100 pt-2 dark:border-leaf-700">
                <div className="text-xs font-semibold text-leaf-500">상세 획득 방법</div>
                {buyDetail(recipe.buy).map((d, i) => (
                  <div key={i} className="text-sm text-leaf-600 dark:text-sand-50">
                    🛒 {d.label} — {d.price}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 선행 레시피 */}
          {recipe.recipes_to_unlock ? (
            <div className="text-sm text-leaf-500">
              선행 습득 필요 레시피: {recipe.recipes_to_unlock}개
            </div>
          ) : null}
        </>
      )}
    </Sheet>
  )
}
