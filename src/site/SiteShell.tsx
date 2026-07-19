import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { cx } from '../ui/primitives'
import { ANTHONY_EMAIL, ANTHONY_EMAIL_HREF } from './contact'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/planner', label: 'CORE' },
  { to: '/community', label: 'Send an idea' },
  { to: '/track-anthony', label: 'Track Anthony' },
]

export function SiteShell() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_ITEMS
    .filter((item) => !user || item.to !== '/')
    .map((item) =>
      item.to === '/planner' && !user
        ? { to: '/signup?returnTo=%2Fplanner', label: 'Build a route' }
        : item,
    )

  if (loading) {
    return <div className="min-h-screen bg-app p-10 text-faint">Checking your account…</div>
  }

  return (
    <div className="site-page min-h-screen bg-app text-ink">
      <header className="site-nav sticky top-0 z-50 border-b border-white/10 bg-black text-white">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-2 px-3 sm:h-[78px] sm:gap-6 sm:px-5 lg:px-12">
          <NavLink to={user ? '/planner' : '/'} className="group flex min-w-0 items-center gap-2 no-underline sm:gap-3">
            <img
              src="/chargequest-logo.png?v=4"
              alt="ChargeQuest"
              className="h-[29px] w-auto max-w-[184px] flex-none object-contain transition-opacity group-hover:opacity-85 sm:h-[36px] sm:max-w-[228px] lg:h-[40px] lg:max-w-[253px]"
            />
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
                  Start building
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
      <footer className="border-t border-white/10 bg-[#090a0c] px-5 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-8">
            <div className="max-w-[360px]">
              <img src="/chargequest-logo.png?v=4" alt="ChargeQuest" className="h-8 w-auto object-contain" />
              <p className="mt-5 text-[12px] leading-[1.7] text-white/42">
                Competition-aware Tesla road trips built around places worth visiting.
                Independent from and not endorsed by Tesla.
              </p>
              <a href={ANTHONY_EMAIL_HREF} className="mt-5 inline-block text-[11.5px] font-semibold text-white/72 no-underline hover:text-white">
                {ANTHONY_EMAIL}
              </a>
            </div>

            <FooterGroup title="Explore">
              <FooterLink to={user ? '/planner' : '/signup?returnTo=%2Fplanner'}>{user ? 'CORE planner' : 'Build a route'}</FooterLink>
              <FooterLink to="/track-anthony">Track Anthony</FooterLink>
              <FooterLink to="/community">Send a route idea</FooterLink>
            </FooterGroup>

            <FooterGroup title="Field guides">
              <FooterLink to="/2026-tesla-supercharging-competition">2026 competition</FooterLink>
              <FooterLink to="/tesla-iconic-charger-badges">Iconic Charger badges</FooterLink>
              <FooterLink to="/tesla-road-trip-routes">Road-trip routes</FooterLink>
            </FooterGroup>

            <FooterGroup title="ChargeQuest">
              <FooterLink to="/about-anthony">About Anthony</FooterLink>
              <a href={ANTHONY_EMAIL_HREF} className="text-[11.5px] text-white/42 no-underline hover:text-white">Contact Anthony</a>
              {user ? <FooterLink to="/account">Your account</FooterLink> : <FooterLink to="/login">Sign in</FooterLink>}
              {user?.role === 'admin' ? <FooterLink to="/admin">Admin</FooterLink> : null}
            </FooterGroup>
          </div>

          <div className="flex flex-col gap-2 pt-6 font-mono text-[8px] uppercase tracking-[0.09em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} ChargeQuest · Built by Anthony Pappano</div>
            <div>Route estimates require current road, weather, and charging verification</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-white/28">{title}</div>
      <div className="mt-4 flex flex-col items-start gap-3">{children}</div>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return <NavLink to={to} className="text-[11.5px] text-white/42 no-underline hover:text-white">{children}</NavLink>
}
