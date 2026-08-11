import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, KeyRound, Route, UserRound } from 'lucide-react'
import { changePassword } from '../api/siteClient'
import { useAuth } from './AuthContext'
import { ANTHONY_EMAIL_HREF } from './contact'

export function AccountPage() {
  const { user, refresh } = useAuth()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await changePassword(passwords)
      await refresh()
      setPasswords({ currentPassword: '', newPassword: '' })
      setNotice('Your password was changed and other sessions were signed out.')
      setError(undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to change password.')
    }
  }

  return (
    <div className="min-h-[calc(100svh-117px)] bg-[#050506] text-white sm:min-h-[calc(100vh-78px)]">
      <section className="relative isolate min-h-[520px] overflow-hidden border-b border-white/10 px-4 py-10 sm:px-7 sm:py-14 lg:px-12">
        <img
          src="/landing/golden-gate-1280.webp"
          alt="The Golden Gate Bridge at dusk"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          width={1280}
          height={1920}
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,3,4,.98)_0%,rgba(3,3,4,.88)_48%,rgba(3,3,4,.28)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#050506_0%,transparent_55%)]" />
        <div className="mx-auto flex min-h-[440px] max-w-[1280px] flex-col justify-between">
          <div className="flex justify-end">
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/18 bg-black/30 px-5 py-3 text-[11px] font-semibold text-white no-underline backdrop-blur-xl"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to dashboard
            </Link>
          </div>
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#ff5149]">
              ChargeQuest / Identity and security
            </div>
            <h1 className="mt-5 max-w-[960px] text-[clamp(62px,11vw,128px)] font-semibold leading-[0.8] tracking-[-0.075em]">
              Account settings
            </h1>
            <p className="mt-7 max-w-[610px] text-[15px] leading-[1.72] text-white/58 sm:text-[17px]">
              Your identity and security live here. Your routes, field notes, and
              next moves belong on the dashboard.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1280px] px-4 py-16 sm:px-7 sm:py-24 lg:px-12 lg:py-32">
        {error ? <div className="site-alert mb-7 text-warn">{error}</div> : null}
        {notice ? <div className="site-alert mb-7 text-good">{notice}</div> : null}

        <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
          <section className="rounded-[22px] border border-white/12 bg-[radial-gradient(circle_at_80%_5%,rgba(232,33,39,.16),transparent_38%),#0b0c0f] p-6 sm:p-9" aria-labelledby="account-profile-heading">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[.04]">
              <UserRound size={23} strokeWidth={1.5} className="text-[#ff5149]" aria-hidden="true" />
            </div>
            <div className="mt-9 font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40">
              ChargeQuest identity
            </div>
            <h2 id="account-profile-heading" className="mt-3 text-[clamp(35px,4vw,52px)] font-semibold tracking-[-0.055em]">
              @{user?.username}
            </h2>
            <dl className="mt-9 divide-y divide-white/10 border-y border-white/10">
              <AccountDetail label="Username" value={user?.username ?? '—'} />
              <AccountDetail label="Access" value={user?.role === 'admin' ? 'Administrator' : 'Member'} />
              <AccountDetail label="Joined" value={user?.createdAt ? readableAccountDate(user.createdAt) : '—'} />
            </dl>
            <p className="mt-7 text-[12px] leading-[1.7] text-white/38">
              ChargeQuest does not collect an email address. Usernames cannot currently
              be changed through the site.
            </p>
          </section>

          <section className="rounded-[22px] border border-white/12 bg-[#0b0c0f] p-6 sm:p-9" aria-labelledby="account-security-heading">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[.04]">
              <KeyRound size={23} strokeWidth={1.5} className="text-[#23d7d1]" aria-hidden="true" />
            </div>
            <div className="mt-9 font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-white/40">
              Account security
            </div>
            <h2 id="account-security-heading" className="mt-3 text-[clamp(35px,4vw,52px)] font-semibold tracking-[-0.055em]">
              Change password
            </h2>
            <p className="mt-4 max-w-[560px] text-[13px] leading-[1.7] text-white/42">
              Changing your password signs out every other active session on this account.
            </p>
            <form className="mt-7 flex flex-col gap-4" onSubmit={submitPassword}>
              <label className="site-field-label">
                Current password
                <input required type="password" className="site-input" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} autoComplete="current-password" />
              </label>
              <label className="site-field-label">
                New password
                <input required type="password" minLength={8} maxLength={128} className="site-input" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} autoComplete="new-password" placeholder="At least 8 characters" />
              </label>
              <button className="mt-2 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[#e82127] bg-[#e82127] px-6 py-3 text-[12px] font-semibold text-white transition hover:bg-white hover:text-black sm:w-fit" type="submit">
                Update password
              </button>
            </form>
          </section>
        </div>

        <section className="group relative isolate mt-5 min-h-[360px] overflow-hidden rounded-[22px] border border-white/12">
          <img
            src="/landing/desert-road-1280.webp"
            alt="An open highway through the painted desert"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
            width={1280}
            height={1600}
            loading="lazy"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,3,4,.97)_0%,rgba(3,3,4,.74)_58%,rgba(3,3,4,.2)_100%)]" />
          <div className="flex min-h-[360px] flex-col justify-between p-6 sm:p-9 lg:flex-row lg:items-end">
            <div className="max-w-[750px]">
              <Route size={26} strokeWidth={1.5} className="text-[#23d7d1]" aria-hidden="true" />
              <div className="mt-8 font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-white/55">Your private route workspace</div>
              <h2 className="mt-3 text-[clamp(38px,6vw,72px)] font-semibold leading-[0.88] tracking-[-0.065em]">Routes and travel preferences</h2>
              <p className="mt-5 max-w-[650px] text-[13px] leading-[1.7] text-white/52">
                Your Tesla profile, practical range, pace, drive-time caps, and saved routes remain private to this account and are managed inside CORE.
              </p>
            </div>
            <Link
              to="/planner"
              className="mt-8 inline-flex min-h-12 flex-none items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[12px] font-semibold text-black no-underline lg:mt-0"
            >
              Open CORE
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <p className="mt-8 text-[11px] leading-[1.7] text-white/34">
          There is no automated password-recovery email. If you lose access,{' '}
          <a href={`${ANTHONY_EMAIL_HREF}?subject=ChargeQuest%20account%20help`} className="font-semibold text-white underline decoration-white/25 underline-offset-3">
            contact Anthony
          </a>.
        </p>
      </main>
    </div>
  )
}

export function ProtectedRoute({
  children,
  admin = false,
  unauthenticatedTo = 'login',
}: {
  children: ReactNode
  admin?: boolean
  unauthenticatedTo?: 'login' | 'signup'
}) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="min-h-[60vh] p-10 text-faint">Checking your account…</div>
  if (!user) return <Navigate to={`/${unauthenticatedTo}?returnTo=${encodeURIComponent(location.pathname)}`} replace />
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/account" replace />
  return children
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-[12px]">
      <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/36">{label}</dt>
      <dd className="font-semibold text-white/82">{value}</dd>
    </div>
  )
}

function readableAccountDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
