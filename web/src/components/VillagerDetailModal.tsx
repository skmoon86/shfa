import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  nookipedia,
  type Villager,
  type Clothing,
  type Recipe,
} from '../lib/nookipedia'
import { recipesForPersonality } from '../data/villagerRecipes'
import { ui, tPersonality } from '../i18n/ko'
import {
  tr,
  trList,
  species as speciesKo,
  gender as genderKo,
  sign as signKo,
  month as monthKo,
  hobby as hobbyKo,
  style as styleKo,
  color as colorKo,
} from '../i18n/terms'
import { useKoNames } from '../hooks/useKoNames'
import { Sheet } from './Sheet'

export function VillagerDetailModal({
  villager,
  koName,
  onClose,
}: {
  villager: Villager | null
  koName?: string
  onClose: () => void
}) {
  const open = !!villager
  const d = villager?.nh_details
  const koClothing = useKoNames('clothing')
  const koRecipe = useKoNames('recipes')

  // 호감 선물 추정용 의류 + 성격 레시피 매칭용 레시피(둘 다 캐시 공유)
  const clothingQ = useQuery({
    queryKey: ['nook', 'clothing'],
    queryFn: () => nookipedia.clothing(),
    enabled: open,
  })
  const recipesQ = useQuery({
    queryKey: ['nook', 'recipes'],
    queryFn: () => nookipedia.recipes(),
    enabled: open,
  })

  // 호감 선물 추정: fav_styles / fav_colors 와 의류 style·color 매칭
  const giftMatches = useMemo(() => {
    if (!d || !clothingQ.data) return []
    const favStyles = new Set((d.fav_styles ?? []).map((s) => s.toLowerCase()))
    const favColors = new Set((d.fav_colors ?? []).map((s) => s.toLowerCase()))
    if (favStyles.size === 0 && favColors.size === 0) return []
    const scored: { item: Clothing; score: number }[] = []
    for (const c of clothingQ.data) {
      let score = 0
      for (const s of c.styles ?? []) if (favStyles.has(s.toLowerCase())) score += 2
      // 색상은 변형 colors 에서 확인
      const colors = new Set<string>()
      for (const v of c.variations ?? [])
        for (const col of v.colors ?? []) colors.add(col.toLowerCase())
      for (const col of colors) if (favColors.has(col)) score += 1
      if (score > 0) scored.push({ item: c, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, 12).map((s) => s.item)
  }, [d, clothingQ.data])

  // 성격별 레시피 → 실제 레시피 데이터와 조인
  const personalityRecipes = useMemo(() => {
    if (!villager) return []
    const names = recipesForPersonality(villager.personality)
    const byName = new Map<string, Recipe>()
    for (const r of recipesQ.data ?? []) byName.set(r.name.toLowerCase(), r)
    // 실제 존재하는 레시피만(한글명으로 표시 가능) 남긴다
    return names
      .map((n) => byName.get(n.toLowerCase()))
      .filter((r): r is Recipe => !!r)
  }, [villager, recipesQ.data])

  if (!villager) return null

  return (
    <Sheet open={!!villager} onClose={onClose} maxWidth="max-w-3xl">
        <div className="sticky top-0 -mx-5 mb-4 flex items-start justify-between gap-3 border-b border-leaf-100 bg-white px-5 pb-3 pt-1 dark:border-leaf-700 dark:bg-leaf-800">
          <div className="flex items-center gap-3">
            <img
              src={villager.image_url}
              alt=""
              className="h-20 w-20 object-contain"
            />
            <div>
              <h2 className="text-xl font-bold">{koName || villager.name}</h2>
              <div className="text-sm text-leaf-500">
                {tr(speciesKo, villager.species)} · {tPersonality(villager.personality)} ·{' '}
                {tr(genderKo, villager.gender)}
              </div>
              {(villager.birthday_month || villager.sign) && (
                <div className="text-xs text-leaf-400">
                  🎂 {tr(monthKo, villager.birthday_month)} {villager.birthday_day}일 ·{' '}
                  {tr(signKo, villager.sign)}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost">
            {ui.close}
          </button>
        </div>

        {/* 취향 (대사·말버릇은 한국어 데이터가 없어 표시하지 않음) */}
        <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
          <Info label="취미" value={tr(hobbyKo, d?.hobby)} />
          <Info label="호감 스타일" value={trList(styleKo, d?.fav_styles)} />
          <Info label="호감 색상" value={trList(colorKo, d?.fav_colors)} />
        </div>

        {/* 집 (외관·내부) */}
        {(d?.house_exterior_url || d?.house_interior_url) && (
          <section className="mb-4">
            <h3 className="mb-2 text-sm font-bold">🏠 집</h3>
            <div className="grid grid-cols-2 gap-3">
              {d?.house_exterior_url && (
                <figure className="rounded-xl border border-leaf-100 p-2 text-center dark:border-leaf-700">
                  <img
                    src={d.house_exterior_url}
                    alt="집 외관"
                    loading="lazy"
                    className="mx-auto max-h-48 w-full object-contain"
                  />
                  <figcaption className="mt-1 text-xs text-leaf-400">외관</figcaption>
                </figure>
              )}
              {d?.house_interior_url && (
                <figure className="rounded-xl border border-leaf-100 p-2 text-center dark:border-leaf-700">
                  <img
                    src={d.house_interior_url}
                    alt="집 내부"
                    loading="lazy"
                    className="mx-auto max-h-48 w-full object-contain"
                  />
                  <figcaption className="mt-1 text-xs text-leaf-400">내부</figcaption>
                </figure>
              )}
            </div>
          </section>
        )}

        {/* 호감 선물 추정 */}
        <section className="mb-4">
          <h3 className="mb-2 text-sm font-bold">
            🎁 {ui.favGift}{' '}
            <span className="chip ml-1">{ui.estimated}</span>
          </h3>
          <p className="mb-2 text-xs text-leaf-400">
            호감 스타일·색상과 일치하는 의류를 추정한 목록입니다(실제 게임 선호와 다를 수 있어요).
          </p>
          {clothingQ.isLoading ? (
            <p className="text-sm text-leaf-400">{ui.loading}</p>
          ) : giftMatches.length === 0 ? (
            <p className="text-sm text-leaf-400">취향 정보가 없어 추정할 수 없어요.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {giftMatches.map((c) => (
                <div key={c.name} className="rounded-xl border border-leaf-100 p-2 text-center dark:border-leaf-700">
                  <img
                    src={c.image_url || c.variations?.[0]?.image_url}
                    alt={c.name}
                    loading="lazy"
                    className="mx-auto h-14 object-contain"
                  />
                  <div className="mt-1 truncate text-[11px]" title={c.name}>
                    {koClothing(c.name)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 성격별 레시피 */}
        <section className="mb-2">
          <h3 className="mb-2 text-sm font-bold">
            📘 {tPersonality(villager.personality)} 성격이 줄 수 있는 레시피
          </h3>
          <p className="mb-2 text-xs text-leaf-400">
            성격별 레시피 풀(대표 예시). 집에서 제작 중인 주민에게서 받을 수 있어요.
          </p>
          {personalityRecipes.length === 0 ? (
            <p className="text-xs text-leaf-400">표시할 레시피 정보가 없어요.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {personalityRecipes.map((recipe) => (
                <div
                  key={recipe.name}
                  className="flex items-center gap-1.5 rounded-xl border border-leaf-100 px-2 py-1 dark:border-leaf-700"
                >
                  {recipe.image_url && (
                    <img src={recipe.image_url} alt="" className="h-8 w-8 object-contain" />
                  )}
                  <span className="text-xs">{koRecipe(recipe.name)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
    </Sheet>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-leaf-50 p-2 dark:bg-leaf-700">
      <div className="text-[11px] text-leaf-400">{label}</div>
      <div className="text-sm font-medium">{value || '-'}</div>
    </div>
  )
}
