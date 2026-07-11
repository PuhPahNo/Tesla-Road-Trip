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
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_ITEMS.map((item) =>
    item.to === '/planner' && !user
      ? { to: '/signup?returnTo=%2Fplanner', label: 'Get the planner' }
      : item,
  )

  return (
    <div className="site-page min-h-screen bg-app text-ink">
      <header className="site-nav sticky top-0 z-50 border-b border-white/10 bg-[#090a0c]/95 text-white backdrop-blur-2xl">
        <div className="mx-auto flex h-[78px] max-w-[1440px] items-center gap-6 px-5 lg:px-12">
          <NavLink to="/" className="group flex min-w-0 items-center gap-3 no-underline">
            <img src="/brand-mark.svg?v=2" alt="" className="h-10 w-10 rounded-[11px] ring-1 ring-white/10" />
            <div className="min-w-0">
              <div className="font-mono text-[7.5px] uppercase tracking-[0.17em] text-white/40 transition group-hover:text-white/60">
                2026 competition
              </div>
              <div className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] text-white">Charge Quest</div>
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

          <div className="flex items-center gap-2.5 border-l border-white/10 pl-4 md:ml-2">
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
                  className="rounded-full border border-white/18 bg-white/[.06] px-4 py-2.5 text-[10.5px] font-semibold text-white no-underline transition hover:border-white/40"
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
                  className="rounded-full bg-[#e82127] px-5 py-3 text-[11px] font-semibold text-white no-underline shadow-[0_8px_28px_rgba(232,33,39,.3)] transition hover:bg-white hover:text-black"
                >
                  Join the challenge
                </NavLink>
              </>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/10 bg-black/35 px-3 py-2 md:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex-none rounded-full px-3.5 py-2 font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] no-underline',
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
          <div>Charge Quest · Built by Anthony for the 2026 Tesla Supercharging Competition</div>
          <div className="flex gap-4">
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
