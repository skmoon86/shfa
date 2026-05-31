import type { Furniture, Recipe } from '../lib/nookipedia'
import { ui, tSource, tNote } from '../i18n/ko'
import {
  tr,
  trList,
  itemCategoryName,
  style as styleKo,
  theme as themeKo,
  color as colorKo,
} from '../i18n/terms'
import { fmtBells, fmtBuy, buyDetail } from '../lib/format'
import { useKoNames } from '../hooks/useKoNames'
import { Sheet } from './Sheet'
import type { DetailItem } from './ItemDetailModal'

// 레시피 상세 카드 — 아이템 상세 카드와 동일한 레이아웃/정보(헤더·가격·획득방법·리폼·변형·메타) + 레시피 재료.
// `item`은 이 레시피로 제작되는 아이템(이름으로 매칭). 리폼·변형·테마 등은 레시피가 아닌 결과물 아이템의 정보다.
export function RecipeDetailModal({
  recipe,
  item,
  title,
  onClose,
}: {
  recipe: Recipe | null
  item?: DetailItem | null
  title?: string
  onClose: () => void
}) {
  const koItem = useKoNames('items')
  const f = (item ?? {}) as Furniture
  const inCatalog =
    (recipe?.availability ?? []).some((a) => /Nook|catalog|Shopping/i.test(a.from)) ||
    (item?.availability ?? []).some((a) => /Nook|catalog|Shopping/i.test(a.from)) ||
    (item?.buy ?? []).some((b) => b.price > 0)

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
                <span className="text-xs text-leaf-400">
                  DIY 레시피
                  {item?.category ? ` · ${tr(itemCategoryName, item.category)}` : ''}
                </span>
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

          {/* 재료 (레시피 전용) */}
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
            {recipe.recipes_to_unlock ? (
              <div className="mt-2 text-xs text-leaf-400">
                선행 습득 필요 레시피: {recipe.recipes_to_unlock}개
              </div>
            ) : null}
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
            <div className="mt-2">
              {inCatalog ? (
                <span className="chip">🗂 카탈로그 등록 가능</span>
              ) : (
                <span className="text-xs text-leaf-400">🗂 카탈로그 미등록(재구매 불가)</span>
              )}
            </div>
          </div>

          {/* 아래는 이 레시피로 제작되는 아이템의 정보 */}
          {item && (
            <>
              {/* 리폼 정보 */}
              {(f.customizable !== undefined || f.variation_total) && (
                <div className="mb-4 rounded-xl border border-leaf-100 p-3 dark:border-leaf-700">
                  <div className="mb-1 text-sm font-bold">🎨 {ui.reform} 정보</div>
                  {f.customizable ? (
                    <ul className="space-y-0.5 text-sm text-leaf-600 dark:text-sand-50">
                      <li>✅ {ui.reformable}</li>
                      {f.custom_kits !== undefined && (
                        <li>
                          {ui.customKits}: {f.custom_kits}개
                          {f.custom_kit_type ? ` (${f.custom_kit_type})` : ''}
                        </li>
                      )}
                      {f.variation_total ? <li>색상 변형: {f.variation_total}종</li> : null}
                      {f.pattern_total ? <li>패턴 변형: {f.pattern_total}종</li> : null}
                    </ul>
                  ) : (
                    <p className="text-sm text-leaf-400">{ui.notReformable}</p>
                  )}
                </div>
              )}

              {/* 변형 갤러리 */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-sm font-bold">{ui.variations}</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {item.variations.map((v, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-leaf-100 p-2 text-center dark:border-leaf-700"
                      >
                        <img
                          src={v.image_url}
                          alt={v.variation}
                          loading="lazy"
                          className="mx-auto h-16 object-contain"
                        />
                        <div className="mt-1 truncate text-[11px]" title={v.variation}>
                          {tr(colorKo, v.variation) || '기본'}
                        </div>
                        {v.pattern && (
                          <div className="truncate text-[10px] text-leaf-400">{v.pattern}</div>
                        )}
                        {v.colors && v.colors.length > 0 && (
                          <div className="text-[10px] text-leaf-400">{trList(colorKo, v.colors)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 메타 */}
              <div className="space-y-1 text-sm text-leaf-500">
                {item.themes && item.themes.length > 0 && (
                  <div>테마: {trList(themeKo, item.themes)}</div>
                )}
                {item.styles && item.styles.length > 0 && (
                  <div>스타일: {trList(styleKo, item.styles)}</div>
                )}
                {f.item_series && <div>시리즈: {f.item_series}</div>}
                {f.function && <div>기능: {f.function}</div>}
                {f.grid_width && f.grid_length && (
                  <div>
                    크기: {f.grid_width} × {f.grid_length}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Sheet>
  )
}
