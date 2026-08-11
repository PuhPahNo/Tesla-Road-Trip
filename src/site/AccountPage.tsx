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
    <div className="bg-[#f1eee6] text-[#0a0b0d]">
      <section className="bg-[#090a0c] px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#23d7d1]">
              Account and security
            </div>
            <h1 className="mt-4 text-[clamp(46px,8vw,82px)] font-semibold leading-[0.9] tracking-[-0.06em]">
              Account settings
            </h1>
            <p className="mt-6 max-w-[640px] text-[15px] leading-[1.7] text-white/58">
              Keep identity and security here. Routes, field notes, and community
              activity now live on your dashboard where they belong.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/22 px-5 py-3 text-[12px] font-semibold text-white no-underline"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {error ? <div className="site-alert mb-7 text-warn">{error}</div> : null}
        {notice ? <div className="site-alert mb-7 text-good">{notice}</div> : null}

        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <section className="border border-black/14 bg-white/55 p-6 sm:p-8" aria-labelledby="account-profile-heading">
            <UserRound size={25} strokeWidth={1.5} className="text-[#e82127]" aria-hidden="true" />
            <div className="mt-7 font-mono text-[8px] font-semibold uppercase tracking-[0.13em] text-black/45">
              ChargeQuest identity
            </div>
            <h2 id="account-profile-heading" className="mt-3 text-[30px] font-semibold tracking-[-0.04em]">
              @{user?.username}
            </h2>
            <dl className="mt-7 divide-y divide-black/12 border-y border-black/12">
              <AccountDetail label="Username" value={user?.username ?? '—'} />
              <AccountDetail label="Access" value={user?.role === 'admin' ? 'Administrator' : 'Member'} />
              <AccountDetail label="Joined" value={user?.createdAt ? readableAccountDate(user.createdAt) : '—'} />
            </dl>
            <p className="mt-6 text-[12.5px] leading-[1.65] text-black/55">
              ChargeQuest does not collect an email address. Usernames cannot currently
              be changed through the site.
            </p>
          </section>

          <section className="border border-black/14 bg-white/55 p-6 sm:p-8" aria-labelledby="account-security-heading">
            <KeyRound size={25} strokeWidth={1.5} className="text-[#e82127]" aria-hidden="true" />
            <div className="mt-7 font-mono text-[8px] font-semibold uppercase tracking-[0.13em] text-black/45">
              Account security
            </div>
            <h2 id="account-security-heading" className="mt-3 text-[30px] font-semibold tracking-[-0.04em]">
              Change password
            </h2>
            <p className="mt-3 max-w-[560px] text-[13px] leading-[1.65] text-black/55">
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
              <button className="site-primary-button w-full sm:w-fit" type="submit">Update password</button>
            </form>
          </section>
        </div>

        <section className="mt-5 grid gap-5 border border-black/14 bg-[#0a0b0d] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-4">
            <Route size={24} strokeWidth={1.5} className="mt-1 flex-none text-[#23d7d1]" aria-hidden="true" />
            <div>
              <h2 className="text-[23px] font-semibold tracking-[-0.035em]">Routes and travel preferences</h2>
              <p className="mt-2 max-w-[650px] text-[13px] leading-[1.65] text-white/55">
                Your Tesla profile, practical range, pace, drive-time caps, and saved
                routes remain private to this account and are managed inside CORE.
              </p>
            </div>
          </div>
          <Link
            to="/planner"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[12px] font-semibold text-black no-underline"
          >
            Open CORE
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </section>

        <p className="mt-7 text-[11px] leading-[1.65] text-black/45">
          There is no automated password-recovery email. If you lose access,{' '}
          <a href={`${ANTHONY_EMAIL_HREF}?subject=ChargeQuest%20account%20help`} className="font-semibold text-black underline decoration-black/25 underline-offset-3">
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
      <dt className="font-mono text-[8px] uppercase tracking-[0.1em] text-black/42">{label}</dt>
      <dd className="font-semibold">{value}</dd>
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
