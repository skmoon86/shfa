import type { Furniture, Variation, PriceEntry, Availability } from '../lib/nookipedia'
import { ui, tSource, tNote } from '../i18n/ko'
import {
  tr,
  trList,
  itemCategoryName,
  style as styleKo,
  theme as themeKo,
  color as colorKo,
} from '../i18n/terms'
import { fmtBells, fmtBuy } from '../lib/format'
import { Sheet } from './Sheet'

// 여러 카테고리를 느슨하게 받기 위한 공통 형태
export interface DetailItem {
  name: string
  image_url?: string
  category?: string
  buy?: PriceEntry[]
  sell?: number
  availability?: Availability[]
  themes?: string[]
  styles?: string[]
  variations?: Variation[]
  // 리폼
  customizable?: boolean
  custom_kits?: number
  custom_kit_type?: string
  variation_total?: number
  pattern_total?: number
  // 가구 기타
  item_series?: string
  item_set?: string
  function?: string
  grid_width?: number
  grid_length?: number
}

export function ItemDetailModal({
  item,
  title,
  onClose,
}: {
  item: DetailItem | null
  title?: string
  onClose: () => void
}) {
  const f = (item ?? {}) as Furniture
  return (
    <Sheet open={!!item} onClose={onClose} maxWidth="max-w-2xl">
      {item && (
        <>
        <div className="sticky top-0 -mx-5 mb-4 flex items-start justify-between gap-3 border-b border-leaf-100 bg-white px-5 pb-3 pt-1 dark:border-leaf-700 dark:bg-leaf-800">
          <div className="flex items-center gap-3">
            {item.image_url && (
              <img src={item.image_url} alt="" className="h-16 w-16 object-contain" />
            )}
            <div>
              <h2 className="text-lg font-bold">{title || item.name}</h2>
              {item.category && (
                <span className="text-xs text-leaf-400">
                  {tr(itemCategoryName, item.category)}
                </span>
              )}
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
            <div className="font-semibold">{fmtBuy(item.buy)}</div>
          </div>
          <div className="rounded-xl bg-leaf-50 p-3 dark:bg-leaf-700">
            <div className="text-xs text-leaf-400">{ui.sellPrice}</div>
            <div className="font-semibold">{fmtBells(item.sell)} 벨</div>
          </div>
        </div>

        {/* 획득방법 / 카탈로그 */}
        <div className="mb-4 rounded-xl border border-leaf-100 p-3 dark:border-leaf-700">
          <div className="mb-1 text-sm font-bold">📦 획득방법</div>
          {item.availability && item.availability.length > 0 ? (
            <ul className="space-y-0.5 text-sm text-leaf-600 dark:text-sand-50">
              {item.availability.map((a, i) => (
                <li key={i}>
                  • {tSource(a.from)}
                  {a.note ? <span className="text-leaf-400"> — {tNote(a.note)}</span> : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-leaf-400">정보 없음</p>
          )}
          <div className="mt-2">
            {(item.availability ?? []).some((a) => /Nook|catalog|Shopping/i.test(a.from)) ||
            (item.buy ?? []).some((b) => b.price > 0) ? (
              <span className="chip">🗂 카탈로그 등록 가능</span>
            ) : (
              <span className="text-xs text-leaf-400">🗂 카탈로그 미등록(재구매 불가)</span>
            )}
          </div>
        </div>

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
                <div key={i} className="rounded-xl border border-leaf-100 p-2 text-center dark:border-leaf-700">
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
    </Sheet>
  )
}
