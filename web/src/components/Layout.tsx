import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { nav, ui } from '../i18n/ko'

const links = [
  { to: '/', label: nav.home, emoji: '🏠', end: true },
  { to: '/critterpedia', label: nav.critterpedia, emoji: '🐟' },
  { to: '/items', label: nav.items, emoji: '🪑' },
  { to: '/recipes', label: nav.recipes, emoji: '🔨' },
  { to: '/villagers', label: nav.villagers, emoji: '🐾' },
]

function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark',
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark((d) => !d) }
}

export function Layout() {
  const { user, signInWithGoogle, signOut } = useAuth()
  const { dark, toggle } = useDarkMode()

  return (
    <div className="min-h-screen">
      {/* ── 상단 헤더 ── */}
      <header className="safe-top sticky top-0 z-20 border-b border-leaf-100 bg-sand-50/90 backdrop-blur dark:border-leaf-700 dark:bg-leaf-900/90">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍃</span>
            <div className="leading-tight">
              <div className="text-sm font-bold sm:text-base">{ui.appName}</div>
              <div className="hidden text-[10px] text-leaf-400 sm:block">
                {ui.appNameSub}
              </div>
            </div>
          </NavLink>

          {/* 데스크톱 상단 네비 */}
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
                  (isActive
                    ? 'bg-leaf-500 text-white'
                    : 'hover:bg-leaf-100 dark:hover:bg-leaf-700')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-leaf-100 dark:hover:bg-leaf-700"
              title="테마"
            >
              {dark ? '🌙' : '☀️'}
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-full"
                  />
                )}
                <button onClick={signOut} className="btn-ghost hidden sm:inline-flex">
                  {ui.logout}
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} className="btn-primary text-xs sm:text-sm">
                <span className="hidden sm:inline">{ui.loginWithGoogle}</span>
                <span className="sm:hidden">{ui.login}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 본문 (하단 탭바 높이만큼 패딩) ── */}
      <main className="mx-auto max-w-6xl px-4 py-5 pb-28 sm:pb-10">
        <Outlet />
      </main>

      <footer className="mx-auto hidden max-w-6xl px-4 py-8 text-center text-xs text-leaf-400 sm:block">
        데이터 제공: Nookipedia API · 비공식 팬 프로젝트
      </footer>

      {/* ── 모바일 하단 탭 바 ── */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-leaf-100 bg-white/95 backdrop-blur dark:border-leaf-700 dark:bg-leaf-800/95 sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ' +
                (isActive ? 'text-leaf-500' : 'text-leaf-400')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={
                      'text-xl transition ' + (isActive ? 'scale-110' : 'opacity-70')
                    }
                  >
                    {l.emoji}
                  </span>
                  {l.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
