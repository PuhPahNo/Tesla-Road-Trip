import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { cx } from '../ui/primitives'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/planner', label: 'Plan a trip' },
  { to: '/community', label: 'Community' },
  { to: '/track-anthony', label: 'Track Anthony' },
]

export function SiteShell() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_ITEMS
    .filter((item) => !user || item.to !== '/')
    .map((item) =>
      item.to === '/planner' && !user
        ? { to: '/signup?returnTo=%2Fplanner', label: 'Get the planner' }
        : item,
    )

  if (loading) {
    return <div className="min-h-screen bg-app p-10 text-faint">Checking your account…</div>
  }

  return (
    <div className="site-page min-h-screen bg-app text-ink">
      <header className="site-nav sticky top-0 z-50 border-b border-white/10 bg-[#090a0c]/95 text-white backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-2 px-3 sm:h-[78px] sm:gap-6 sm:px-5 lg:px-12">
          <NavLink to={user ? '/planner' : '/'} className="group flex min-w-0 items-center gap-2 no-underline sm:gap-3">
            <img src="/brand-mark.svg?v=2" alt="" className="h-9 w-9 flex-none rounded-[10px] ring-1 ring-white/10 sm:h-10 sm:w-10 sm:rounded-[11px]" />
            <div className="min-w-0">
              <div className="hidden font-mono text-[7.5px] uppercase tracking-[0.17em] text-white/40 transition group-hover:text-white/60 sm:block">
                2026 competition
              </div>
              <div className="truncate text-[14px] font-semibold tracking-[-0.02em] text-white sm:mt-0.5 sm:text-[16px]">ChargeQuest</div>
            </div>
          </NavLink>

          <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'relative py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.11em] no-underline transition after:absolute after:inset-x-0 after:-bottom-1 after:h-[2px] after:origin-left after:bg-[#e82127] after:transition-transform',
                    isActive
                      ? 'text-white after:scale-x-100'
                      : 'text-white/48 after:scale-x-0 hover:text-white hover:after:scale-x-100',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 border-l border-white/10 pl-2 sm:gap-2.5 sm:pl-4 md:ml-2">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <NavLink
                    to="/admin"
                    className="hidden rounded-full border border-[#e82127]/50 bg-[#e82127]/12 px-4 py-2.5 text-[10.5px] font-semibold text-[#ff6b66] no-underline transition hover:bg-[#e82127] hover:text-white sm:block"
                  >
                    Admin
                  </NavLink>
                ) : null}
                <NavLink
                  to={user.mustChangePassword ? '/change-password' : '/account'}
                  className="max-w-[116px] truncate rounded-full border border-white/18 bg-white/[.06] px-3 py-2.5 text-[10px] font-semibold text-white no-underline transition hover:border-white/40 sm:max-w-none sm:px-4 sm:text-[10.5px]"
                >
                  {user.username}
                </NavLink>
                <button
                  type="button"
                  onClick={() => void logout().then(() => navigate('/'))}
                  className="hidden cursor-pointer border-0 bg-transparent px-1 py-2 font-mono text-[8.5px] uppercase tracking-[0.08em] text-white/35 hover:text-white sm:block"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="hidden px-1 py-2 text-[11px] font-medium text-white/55 no-underline hover:text-white sm:block"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="whitespace-nowrap rounded-full bg-[#e82127] px-3.5 py-2.5 text-[10px] font-semibold text-white no-underline shadow-[0_8px_28px_rgba(232,33,39,.3)] transition hover:bg-white hover:text-black sm:px-5 sm:py-3 sm:text-[11px]"
                >
                  Start planning
                </NavLink>
              </>
            )}
          </div>
        </div>
        <nav className={cx('grid gap-1 border-t border-white/10 bg-black/35 px-2 py-2 md:hidden', user ? 'grid-cols-3' : 'grid-cols-4')} aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'min-w-0 truncate rounded-full px-1.5 py-2 text-center font-mono text-[7.5px] font-semibold uppercase tracking-[0.04em] no-underline sm:px-3.5 sm:text-[8.5px] sm:tracking-[0.08em]',
                  isActive ? 'bg-white text-black' : 'text-white/50',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-white/10 bg-[#090a0c] px-5 py-10 text-white">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 text-[11.5px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <div>ChargeQuest · Route ideas for the 2026 Tesla Supercharging Competition</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <NavLink to={user ? '/planner' : '/signup?returnTo=%2Fplanner'} className="text-white/35 no-underline hover:text-white">
              {user ? 'Planner' : 'Get the planner'}
            </NavLink>
            <NavLink to="/community" className="text-white/35 no-underline hover:text-white">Community</NavLink>
            <NavLink to="/track-anthony" className="text-white/35 no-underline hover:text-white">Track Anthony</NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
