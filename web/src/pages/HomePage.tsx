import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { nookipedia } from '../lib/nookipedia'
import { useAuth } from '../context/AuthContext'
import { useCritterpedia, useRecipeProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ProgressBar'
import { critterCategory, nav, ui } from '../i18n/ko'

const CRITTER_CATS = ['fish', 'bugs', 'sea', 'fossils', 'art'] as const

export function HomePage() {
  const { user, signInWithGoogle } = useAuth()
  const { map } = useCritterpedia()
  const { learned } = useRecipeProgress()

  const critterQueries = useQueries({
    queries: CRITTER_CATS.map((c) => ({
      queryKey: ['nook', c],
      queryFn: () =>
        c === 'fossils'
          ? nookipedia.fossils()
          : c === 'art'
            ? nookipedia.art()
            : nookipedia[c](),
    })),
  })
  const recipesQ = useQuery({ queryKey: ['nook', 'recipes'], queryFn: () => nookipedia.recipes() })

  return (
    <div className="space-y-6">
      <section className="card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
        <span className="text-5xl">🏝️</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{ui.appName}</h1>
          <p className="mt-1 text-sm text-leaf-500">
            모여봐요 동물의 숲 도감·컬렉션·주민 정보를 한 곳에서. 로그인하면 진행상황이 저장돼요.
          </p>
        </div>
        {!user && (
          <button onClick={signInWithGoogle} className="btn-primary">
            {ui.loginWithGoogle}
          </button>
        )}
      </section>

      {/* 진행률 요약 */}
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-bold">📊 진행률 요약</h2>
        {!user && (
          <p className="text-sm text-leaf-400">{ui.loginRequiredToSave}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {CRITTER_CATS.map((c, i) => {
            const list = critterQueries[i].data ?? []
            const donated = list.filter((r) => map[`${c}:${r.name}`]?.donated).length
            return (
              <ProgressBar
                key={c}
                value={donated}
                total={list.length}
                label={`${critterCategory[c]} 기증`}
              />
            )
          })}
          <ProgressBar
            value={(recipesQ.data ?? []).filter((r) => learned.has(r.name)).length}
            total={(recipesQ.data ?? []).length}
            label="DIY 레시피 습득"
          />
        </div>
      </section>

      {/* 바로가기 */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NavCard to="/critterpedia" emoji="🐟" label={nav.critterpedia} desc="물고기·곤충·해산물·화석·미술품" />
        <NavCard to="/items" emoji="🪑" label={nav.items} desc="가구·의류·리폼·가격" />
        <NavCard to="/recipes" emoji="🔨" label={nav.recipes} desc="재료·습득·입수처" />
        <NavCard to="/villagers" emoji="🐾" label={nav.villagers} desc="취향·호감 선물·성격 레시피" />
      </section>
    </div>
  )
}

function NavCard({
  to,
  emoji,
  label,
  desc,
}: {
  to: string
  emoji: string
  label: string
  desc: string
}) {
  return (
    <Link to={to} className="card flex flex-col gap-1 p-5 hover:-translate-y-0.5">
      <span className="text-3xl">{emoji}</span>
      <span className="mt-1 font-bold">{label}</span>
      <span className="text-xs text-leaf-400">{desc}</span>
    </Link>
  )
}
