import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  changePassword,
  createAchievement,
  fetchAccount,
} from '../api/siteClient'
import { useAuth } from './AuthContext'

interface AccountData {
  routeCount: number
  achievements: Array<Record<string, unknown>>
  suggestions: Array<Record<string, unknown>>
  meetups: Array<Record<string, unknown>>
  stateVotes: Array<Record<string, unknown>>
}

export function AccountPage() {
  const { user, refresh } = useAuth()
  const [data, setData] = useState<AccountData>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [achievement, setAchievement] = useState({ title: '', description: '', routeName: '' })

  const load = async () => {
    try {
      const result = await fetchAccount()
      setData(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load account.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

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

  const submitAchievement = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createAchievement({
        ...achievement,
        routeName: achievement.routeName || undefined,
      })
      setAchievement({ title: '', description: '', routeName: '' })
      setNotice('Achievement shared with the Charge Quest community.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to share achievement.')
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-14 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="site-kicker">Your Charge Quest account</div>
          <h1 className="mt-3 text-[clamp(38px,6vw,64px)] font-semibold leading-[1] tracking-[-0.05em]">
            Welcome back, {user?.username}.
          </h1>
          <p className="mt-4 text-[14px] text-dim">@{user?.username}</p>
        </div>
        <Link to="/planner" className="site-primary-button no-underline">Open your planner</Link>
      </div>

      {error ? <div className="site-alert mt-7 text-warn">{error}</div> : null}
      {notice ? <div className="site-alert mt-7 text-good">{notice}</div> : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AccountMetric label="Saved routes" value={data?.routeCount ?? 0} />
        <AccountMetric label="State votes" value={data?.stateVotes.length ?? 0} />
        <AccountMetric label="Suggestions" value={data?.suggestions.length ?? 0} />
        <AccountMetric label="Achievements" value={data?.achievements.length ?? 0} />
      </div>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <div className="site-card p-6 sm:p-7">
          <div className="site-kicker">Planner profile</div>
          <h2 className="mt-3 text-[26px] font-semibold">Routes and travel preferences</h2>
          <p className="mt-3 text-[13.5px] leading-[1.6] text-dim">
            Your vehicle, practical range, pace, drive-time caps, category preferences,
            and saved custom routes are now tied to this account.
          </p>
          <Link to="/planner" className="site-secondary-button mt-6 inline-flex no-underline">
            Manage routes and preferences
          </Link>
        </div>

        <div className="site-card p-6 sm:p-7">
          <div className="site-kicker">Account security</div>
          <h2 className="mt-3 text-[26px] font-semibold">Change password</h2>
          <form className="mt-5 flex flex-col gap-3" onSubmit={submitPassword}>
            <label className="site-field-label">
              Current password
              <input required type="password" className="site-input" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} autoComplete="current-password" />
            </label>
            <label className="site-field-label">
              New password
              <input required type="password" minLength={8} maxLength={128} className="site-input" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} autoComplete="new-password" placeholder="At least 8 characters" />
            </label>
            <button className="site-secondary-button" type="submit">Update password</button>
          </form>
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="site-card p-6">
          <div className="site-kicker">Share an achievement</div>
          <h2 className="mt-3 text-[24px] font-semibold">Add to the community wall</h2>
          <form className="mt-5 flex flex-col gap-3" onSubmit={submitAchievement}>
            <label className="site-field-label">
              Achievement
              <input required minLength={3} maxLength={100} className="site-input" value={achievement.title} onChange={(event) => setAchievement((current) => ({ ...current, title: event.target.value }))} placeholder="48-state loop completed" />
            </label>
            <label className="site-field-label">
              Route name (optional)
              <input maxLength={100} className="site-input" value={achievement.routeName} onChange={(event) => setAchievement((current) => ({ ...current, routeName: event.target.value }))} />
            </label>
            <label className="site-field-label">
              What made it count?
              <textarea required minLength={5} maxLength={500} rows={4} className="site-input resize-y" value={achievement.description} onChange={(event) => setAchievement((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <button className="site-primary-button" type="submit">Share achievement</button>
          </form>
        </div>

        <div>
          <div className="site-kicker">Your activity</div>
          <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.035em]">Community contributions</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ActivityCard label="Meetup invites" items={data?.meetups ?? []} empty="No meetup invites sent yet." />
            <ActivityCard label="Suggestions" items={data?.suggestions ?? []} empty="No trip suggestions shared yet." />
          </div>
        </div>
      </section>
    </div>
  )
}

export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="min-h-[60vh] p-10 text-faint">Checking your account…</div>
  if (!user) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/account" replace />
  return children
}

function AccountMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="site-card p-5">
      <div className="text-[30px] font-semibold">{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  )
}

function ActivityCard({ label, items, empty }: { label: string; items: Array<Record<string, unknown>>; empty: string }) {
  return (
    <div className="site-card p-5">
      <div className="text-[15px] font-semibold">{label}</div>
      <div className="mt-4 flex flex-col gap-2">
        {items.slice(0, 5).map((item, index) => (
          <div key={String(item.id ?? index)} className="rounded-[10px] border border-edge bg-chip p-3">
            <div className="truncate text-[12px] font-medium">{String(item.title ?? item.city ?? 'Community activity')}</div>
            <div className="mt-1 font-mono text-[8.5px] uppercase text-faint">{String(item.status ?? item.category ?? 'shared')}</div>
          </div>
        ))}
        {items.length === 0 ? <div className="text-[12px] leading-[1.5] text-faint">{empty}</div> : null}
      </div>
    </div>
  )
}
