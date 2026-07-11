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

  return (
    <div className="site-page min-h-screen bg-app text-ink">
      <header className="site-nav sticky top-0 z-50 border-b border-edge bg-app/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1240px] items-center gap-5 px-5 lg:px-8">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5 no-underline">
            <img src="/brand-mark.svg?v=2" alt="" className="h-9 w-9 rounded-[10px]" />
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-faint">
                Anthony’s 2026 run
              </div>
              <div className="text-[15px] font-semibold text-ink">Charge Quest</div>
            </div>
          </NavLink>

          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'rounded-[9px] px-3 py-2 text-[12.5px] font-medium no-underline transition',
                    isActive ? 'bg-chip text-ink' : 'text-dim hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <NavLink
                    to="/admin"
                    className="hidden rounded-[9px] border border-accent/35 bg-accent/10 px-3 py-2 text-[11.5px] font-medium text-accent no-underline sm:block"
                  >
                    Anthony admin
                  </NavLink>
                ) : null}
                <NavLink
                  to={user.mustChangePassword ? '/change-password' : '/account'}
                  className="rounded-[9px] border border-edge bg-chip px-3 py-2 text-[11.5px] font-medium text-ink no-underline"
                >
                  {user.username}
                </NavLink>
                <button
                  type="button"
                  onClick={() => void logout().then(() => navigate('/'))}
                  className="hidden cursor-pointer rounded-[9px] border-0 bg-transparent px-2 py-2 text-[11px] text-faint hover:text-ink sm:block"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="hidden px-2 py-2 text-[12px] font-medium text-dim no-underline hover:text-ink sm:block"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/signup"
                  className="rounded-[9px] bg-accent px-3.5 py-2.5 text-[12px] font-semibold text-white no-underline"
                >
                  Create free account
                </NavLink>
              </>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-edge px-3 py-2 md:hidden" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex-none rounded-[8px] px-3 py-2 text-[11.5px] no-underline',
                  isActive ? 'bg-chip text-ink' : 'text-dim',
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
      <footer className="border-t border-edge px-5 py-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 text-[11.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <div>Charge Quest · Built in Chattanooga by Anthony, age 26, for the trip he’s actually going to drive.</div>
          <div className="flex gap-4">
            <NavLink to="/planner" className="text-faint no-underline hover:text-ink">Planner</NavLink>
            <NavLink to="/community" className="text-faint no-underline hover:text-ink">Community</NavLink>
            <NavLink to="/track-anthony" className="text-faint no-underline hover:text-ink">Track Anthony</NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
