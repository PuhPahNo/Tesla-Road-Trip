import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Compass, Info, Map as MapIcon } from 'lucide-react'
import { useAuth } from './AuthContext'
import { cx } from '../ui/primitives'
import { useTheme } from '../theme/theme'
import { MoonIcon, SunIcon } from '../ui/icons'
import { ANTHONY_EMAIL, ANTHONY_EMAIL_HREF } from './contact'
import { LEGAL_OPERATOR_DISCLOSURE } from './business'

export const PUBLIC_NAV_ITEMS = [
  { to: '/', label: 'Tracker', icon: Compass },
  { to: '/route', label: 'Route', icon: MapIcon },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/about', label: 'About', icon: Info },
]

export function SiteShell() {
  return (
    <div className="site-page flex min-h-screen flex-col bg-app text-ink">
      <SiteHeader />
      <main className="flex-1 pb-[76px] md:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileNav />
    </div>
  )
}

function SiteHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-app/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 sm:px-6">
        <NavLink to="/" className="flex flex-none items-center no-underline" aria-label="ChargeQuest tracker home">
          <img
            src="/chargequest-logo.png?v=4"
            alt="ChargeQuest"
            width={1000}
            height={158}
            className="h-[26px] w-auto object-contain sm:h-[30px]"
          />
        </NavLink>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cx(
                  'rounded-full px-3.5 py-2 text-[13.5px] font-medium no-underline transition',
                  isActive ? 'bg-chip text-ink' : 'text-dim hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {isAdmin ? (
            <>
              <NavLink
                to="/planner"
                className="rounded-full border border-edge2 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent2 no-underline hover:bg-chip"
              >
                CORE
              </NavLink>
              <NavLink
                to="/admin"
                className="rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-on-accent no-underline hover:brightness-110"
              >
                Admin
              </NavLink>
              <button
                type="button"
                onClick={() => void logout().then(() => navigate('/'))}
                className="hidden cursor-pointer rounded-full border-0 bg-transparent px-2 py-1.5 text-[12px] text-faint hover:text-ink sm:block"
              >
                Sign out
              </button>
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cx(
        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-edge bg-transparent text-dim transition hover:text-ink',
        className,
      )}
    >
      {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
    </button>
  )
}

function MobileNav() {
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-edge bg-app/92 px-2 pt-1.5 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      {PUBLIC_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cx(
                'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium no-underline',
                isActive ? 'text-accent' : 'text-faint',
              )
            }
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-edge px-4 pb-24 pt-10 sm:px-6 md:pb-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
        <FooterText>
          {LEGAL_OPERATOR_DISCLOSURE} Independent from and not endorsed by Tesla.
        </FooterText>
        <a href={ANTHONY_EMAIL_HREF} className="text-dim no-underline hover:text-ink">
          {ANTHONY_EMAIL}
        </a>
      </div>
    </footer>
  )
}

function FooterText({ children }: { children: ReactNode }) {
  return <p className="m-0 max-w-[560px] leading-[1.6]">{children}</p>
}
