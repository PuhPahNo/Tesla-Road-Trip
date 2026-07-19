import { useEffect, useState, type FormEvent } from 'react'
import {
  createAdminAccount,
  deleteAdminAccount,
  fetchAdminAccountDetail,
  fetchAdminAccounts,
  resetAdminAccountPassword,
  revokeAdminAccountSessions,
  updateAdminAccount,
  type AccountActivity,
  type AdminAccountDetail,
  type AdminAccountsSnapshot,
  type ManagedAccount,
} from '../api/siteClient'
import { useAuth } from './AuthContext'

export function AdminAccountsSection() {
  const { refresh } = useAuth()
  const [snapshot, setSnapshot] = useState<AdminAccountsSnapshot>()
  const [createInput, setCreateInput] = useState({
    username: '',
    password: '',
    role: 'member' as 'member' | 'admin',
  })
  const [busy, setBusy] = useState<string>()
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()

  const load = async () => {
    try {
      setSnapshot(await fetchAdminAccounts())
      setError(undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load accounts.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const run = async (
    key: string,
    action: () => Promise<AdminAccountsSnapshot>,
    success: string,
  ) => {
    setBusy(key)
    setError(undefined)
    try {
      setSnapshot(await action())
      setNotice(success)
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update the account.')
      return false
    } finally {
      setBusy(undefined)
    }
  }

  const create = async (event: FormEvent) => {
    event.preventDefault()
    const succeeded = await run(
      'create',
      () => createAdminAccount(createInput),
      `Created @${createInput.username.trim().toLowerCase()}. They must change the temporary password at sign-in.`,
    )
    if (succeeded) setCreateInput({ username: '', password: '', role: 'member' })
  }

  const accounts = snapshot?.accounts ?? []
  const adminCount = accounts.filter((account) => account.role === 'admin').length
  const activeSessions = accounts.reduce((total, account) => total + account.activeSessions, 0)
  const visibleAccounts = accounts.filter((account) =>
    account.username.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <section className="mt-10 border-t border-edge pt-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="site-kicker">Accounts & access</div>
          <h2 className="mt-2 text-[clamp(32px,4.2vw,48px)] font-semibold tracking-[-0.045em]">Manage every ChargeQuest account</h2>
          <p className="mt-3 max-w-[720px] text-[13.5px] leading-[1.65] text-dim">
            Create users, change usernames and access levels, reset passwords, revoke sessions, and remove accounts. Every sensitive action is recorded below.
          </p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-[13px] border border-edge bg-panel2">
          <AccountStat label="Accounts" value={accounts.length} />
          <AccountStat label="Admins" value={adminCount} />
          <AccountStat label="Sessions" value={activeSessions} />
        </div>
      </div>

      {error ? <div className="mt-6 rounded-[11px] border border-warn-bd bg-warn-bg px-4 py-3 text-[13px] text-warn">{error}</div> : null}
      {notice ? <div className="mt-6 rounded-[11px] border border-good-bd bg-good-bg px-4 py-3 text-[13px] text-good">{notice}</div> : null}

      <form className="admin-surface mt-7 grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_1fr_180px_auto] lg:items-end" onSubmit={(event) => void create(event)}>
        <label className="site-field-label">
          New username
          <input required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" className="site-input" value={createInput.username} onChange={(event) => setCreateInput((current) => ({ ...current, username: event.target.value }))} placeholder="new-roadtripper" />
        </label>
        <label className="site-field-label">
          Temporary password
          <input required type="password" minLength={8} maxLength={128} className="site-input" value={createInput.password} onChange={(event) => setCreateInput((current) => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" autoComplete="new-password" />
        </label>
        <label className="site-field-label">
          Access level
          <select className="site-input" value={createInput.role} onChange={(event) => setCreateInput((current) => ({ ...current, role: event.target.value as 'member' | 'admin' }))}>
            <option value="member">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={busy === 'create'} className="site-primary-button min-h-12 w-full disabled:opacity-55 lg:w-auto">
          {busy === 'create' ? 'Creating…' : 'Create account'}
        </button>
        <p className="m-0 text-[10.5px] leading-[1.5] text-faint sm:col-span-2 lg:col-span-4">
          Temporary passwords are never displayed or logged after submission. New accounts must choose a replacement at their first sign-in.
        </p>
      </form>

      <div className="mt-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <label className="site-field-label w-full sm:max-w-[380px]">
          Find a user
          <input className="site-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by username" />
        </label>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
          {visibleAccounts.length} of {accounts.length} accounts
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {visibleAccounts.map((account) => (
          <AccountEditor
            key={account.id}
            account={account}
            isSelf={account.id === snapshot?.viewerId}
            busy={busy}
            onUpdate={async (input) => {
              const succeeded = await run(
                `update:${account.id}`,
                () => updateAdminAccount(account.id, input),
                `Updated @${input.username ?? account.username}.`,
              )
              if (succeeded && account.id === snapshot?.viewerId) await refresh()
              return succeeded
            }}
            onReset={(password) => run(`reset:${account.id}`, () => resetAdminAccountPassword(account.id, password), `Reset @${account.username}’s password and revoked their sessions.`)}
            onRevoke={() => run(`revoke:${account.id}`, () => revokeAdminAccountSessions(account.id), `Revoked @${account.username}’s active sessions.`)}
            onDelete={() => run(`delete:${account.id}`, () => deleteAdminAccount(account.id), `Deleted @${account.username} and their account-owned data.`)}
          />
        ))}
        {snapshot && visibleAccounts.length === 0 ? <div className="admin-surface p-6 text-[13px] text-faint">No accounts match that search.</div> : null}
      </div>

      <div className="mt-10">
        <div className="flex items-end justify-between border-b border-edge pb-4">
          <div>
            <div className="site-kicker">Security audit</div>
            <h3 className="mt-2 text-[27px] font-semibold tracking-[-0.035em]">Recent account activity</h3>
          </div>
          <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">Latest 100 events</div>
        </div>
        <div>
          {(snapshot?.activity ?? []).map((activity) => <ActivityRow key={activity.id} activity={activity} />)}
          {snapshot && snapshot.activity.length === 0 ? <div className="border-b border-edge py-8 text-[13px] text-faint">Account activity will appear here.</div> : null}
        </div>
      </div>
    </section>
  )
}

function AccountEditor({
  account,
  isSelf,
  busy,
  onUpdate,
  onReset,
  onRevoke,
  onDelete,
}: {
  account: ManagedAccount
  isSelf: boolean
  busy?: string
  onUpdate: (input: { username: string; role: 'member' | 'admin' }) => Promise<boolean>
  onReset: (password: string) => Promise<boolean>
  onRevoke: () => Promise<boolean>
  onDelete: () => Promise<boolean>
}) {
  const [username, setUsername] = useState(account.username)
  const [role, setRole] = useState(account.role)
  const [password, setPassword] = useState('')
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detail, setDetail] = useState<AdminAccountDetail>()
  const [detailError, setDetailError] = useState<string>()
  const [detailLoading, setDetailLoading] = useState(false)
  const working = busy?.endsWith(account.id)

  useEffect(() => {
    setUsername(account.username)
    setRole(account.role)
  }, [account.role, account.username])

  const toggleDetails = async () => {
    if (detailsOpen) {
      setDetailsOpen(false)
      return
    }
    setDetailsOpen(true)
    if (detail) return
    setDetailLoading(true)
    try {
      setDetail(await fetchAdminAccountDetail(account.id))
      setDetailError(undefined)
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : 'Unable to load user details.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <article className="admin-surface overflow-hidden">
      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(180px,.7fr)_minmax(160px,.45fr)_minmax(300px,1.1fr)_auto] xl:items-end">
        <label className="site-field-label">
          Username
          <input className="site-input" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" value={username} onChange={(event) => setUsername(event.target.value)} aria-label={`Username for ${account.username}`} />
        </label>
        <label className="site-field-label">
          Access level
          <select className="site-input" value={role} disabled={isSelf} onChange={(event) => setRole(event.target.value as 'member' | 'admin')} aria-label={`Access level for ${account.username}`}>
            <option value="member">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <MiniMetric label="Sessions" value={account.activeSessions} />
          <MiniMetric label="Routes" value={account.routeCount} />
          <MiniMetric label="Ideas" value={account.suggestionCount} />
          <MiniMetric label="Meetups" value={account.meetupCount} />
          <MiniMetric label="Votes" value={account.stateVoteCount} />
          <MiniMetric label="Wins" value={account.achievementCount} />
        </div>
        <button type="button" disabled={working} onClick={() => void onUpdate({ username, role })} className="site-primary-button min-h-12 w-full disabled:opacity-55 xl:w-auto">Save account</button>
      </div>

      <div className="flex flex-col gap-4 border-t border-edge bg-chip/40 px-5 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[0.08em] text-faint">
          <span>{account.role === 'admin' ? 'Admin' : 'User'}</span>
          {isSelf ? <span className="text-accent2">Current account</span> : null}
          {account.mustChangePassword ? <span className="text-warn">Password change required</span> : null}
          <span>Created {formatDate(account.createdAt)}</span>
          <span>{account.lastLoginAt ? `Last sign-in ${formatDate(account.lastLoginAt)}` : 'No recorded sign-in'}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
          <button type="button" onClick={() => void toggleDetails()} className="site-secondary-button min-h-12">
            {detailsOpen ? 'Hide details' : 'View routes & activity'}
          </button>
          <label className="site-field-label min-w-[220px]">
            New temporary password
            <input type="password" minLength={8} maxLength={128} className="site-input" disabled={isSelf} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSelf ? 'Use your account page' : 'At least 8 characters'} aria-label={`New temporary password for ${account.username}`} autoComplete="new-password" />
          </label>
          <button type="button" disabled={isSelf || password.length < 8 || working} onClick={() => void onReset(password).then((succeeded) => { if (succeeded) setPassword('') })} className="site-secondary-button min-h-12 disabled:opacity-45">Reset password</button>
          <button type="button" disabled={isSelf || working} onClick={() => void onRevoke()} className="site-secondary-button min-h-12 disabled:opacity-45">Revoke sessions</button>
          <button
            type="button"
            disabled={isSelf || working}
            onClick={() => deleteArmed ? void onDelete() : setDeleteArmed(true)}
            onBlur={() => setDeleteArmed(false)}
            className={`min-h-12 rounded-full border px-5 text-[11px] font-semibold disabled:opacity-35 ${deleteArmed ? 'border-warn-bd bg-warn-bg text-warn' : 'border-edge bg-transparent text-faint'}`}
          >
            {deleteArmed ? 'Confirm delete' : 'Delete account'}
          </button>
        </div>
      </div>
      {detailsOpen ? (
        <div className="border-t border-edge p-5 sm:p-6">
          {detailLoading ? <div className="text-[13px] text-faint">Loading this user’s routes and activity…</div> : null}
          {detailError ? <div className="rounded-[10px] border border-warn-bd bg-warn-bg p-4 text-[12px] text-warn">{detailError}</div> : null}
          {detail ? <AccountDetailPanel detail={detail} /> : null}
        </div>
      ) : null}
    </article>
  )
}

function AccountDetailPanel({ detail }: { detail: AdminAccountDetail }) {
  const preferences = detail.preferences?.config
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
      <div>
        <div className="flex items-end justify-between border-b border-edge pb-3">
          <div>
            <div className="site-kicker">Private route library</div>
            <h4 className="mt-1 text-[22px] font-semibold">{detail.routes.length} saved route{detail.routes.length === 1 ? '' : 's'}</h4>
          </div>
          <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-faint">Admin read access</div>
        </div>
        <div className="mt-4 grid gap-3">
          {detail.routes.map((route) => (
            <article key={route.id} className="rounded-[12px] border border-edge bg-chip/45 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h5 className="text-[16px] font-semibold">{route.name}</h5>
                  <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.08em] text-faint">
                    Updated {formatDate(route.updatedAt, true)} · {route.waypoints.length} waypoint{route.waypoints.length === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: route.color }} aria-label={`Route color ${route.color}`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[7.5px] uppercase tracking-[0.06em] text-dim">
                {route.targetDays ? <span className="rounded-full border border-edge px-2.5 py-1">{route.targetDays} days</span> : null}
                <span className="rounded-full border border-edge px-2.5 py-1">{route.keepOrder ? 'Fixed order' : 'Optimized order'}</span>
                {route.startDate ? <span className="rounded-full border border-edge px-2.5 py-1">Starts {route.startDate}</span> : null}
                {route.directionPreference ? <span className="rounded-full border border-edge px-2.5 py-1">Heads {route.directionPreference}</span> : null}
              </div>
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {route.waypoints.map((waypoint, index) => (
                  <li key={waypoint.id} className="list-none text-[11.5px] text-dim">
                    <span className="mr-2 font-mono text-[8px] text-accent2">{String(index + 1).padStart(2, '0')}</span>
                    {waypoint.label} <span className="text-faint">· {waypoint.radiusMiles} mi radius</span>
                  </li>
                ))}
              </ol>
              {route.travelPreferences ? (
                <div className="mt-4 border-t border-edge pt-3 text-[10px] leading-[1.6] text-faint">
                  {route.travelPreferences.vehicleProfileId} · {route.travelPreferences.practicalRangeMiles} practical miles · {route.travelPreferences.tripPace} pace · {route.travelPreferences.dailyDriveTargetHours}–{route.travelPreferences.dailyDriveMaxHours} drive hours
                </div>
              ) : null}
            </article>
          ))}
          {detail.routes.length === 0 ? <div className="rounded-[12px] border border-dashed border-edge p-5 text-[12.5px] text-faint">This user has not saved a custom route yet.</div> : null}
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-[12px] border border-edge bg-chip/45 p-4">
          <div className="site-kicker">Planner preferences</div>
          {preferences ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
              <DetailFact label="Vehicle" value={String(preferences.vehicleProfileId ?? 'Default')} />
              <DetailFact label="Range" value={preferences.practicalRangeMiles ? `${preferences.practicalRangeMiles} mi` : 'Default'} />
              <DetailFact label="Pace" value={String(preferences.tripPace ?? 'Default')} />
              <DetailFact label="Trip mode" value={String(preferences.plannerMode ?? 'Default')} />
            </dl>
          ) : <div className="mt-3 text-[12px] text-faint">No saved planner preferences.</div>}
        </div>

        <div className="rounded-[12px] border border-edge bg-chip/45 p-4">
          <div className="site-kicker">Site activity</div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
            <DetailFact label="Suggestions" value={detail.suggestions.length} />
            <DetailFact label="Meetups" value={detail.meetups.length} />
            <DetailFact label="State votes" value={detail.stateVotes.length} />
            <DetailFact label="Achievements" value={detail.achievements.length} />
          </dl>
          {detail.suggestions.length ? (
            <div className="mt-4 border-t border-edge pt-3">
              {detail.suggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.id} className="border-b border-edge py-2 last:border-0">
                  <div className="text-[11.5px] font-semibold">{suggestion.title}</div>
                  <div className="mt-1 font-mono text-[7px] uppercase text-faint">{suggestion.category} · {suggestion.review_status}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-[12px] border border-edge bg-chip/45 p-4">
          <div className="site-kicker">Account events</div>
          <div className="mt-3 text-[12px] text-dim">{detail.activity.length} recent event{detail.activity.length === 1 ? '' : 's'} involving this account.</div>
        </div>
      </aside>
    </div>
  )
}

function DetailFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="font-mono text-[7px] uppercase tracking-[0.08em] text-faint">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  )
}

function ActivityRow({ activity }: { activity: AccountActivity }) {
  return (
    <div className="grid gap-2 border-b border-edge py-4 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-center">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">{formatDate(activity.createdAt, true)}</div>
      <div className="text-[12.5px] leading-[1.5] text-dim">
        <span className="font-semibold text-ink">@{activity.actorUsername}</span>{' '}
        {activityText(activity)}
        {activity.targetUsername && activity.targetUsername !== activity.actorUsername ? <span> <span className="text-faint">·</span> @{activity.targetUsername}</span> : null}
      </div>
      <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-faint">{activity.action.replaceAll('_', ' ')}</div>
    </div>
  )
}

function activityText(activity: AccountActivity) {
  const labels: Record<string, string> = {
    'auth.signup': 'created an account',
    'auth.login': 'signed in',
    'auth.logout': 'signed out',
    'auth.password_changed': 'changed their password',
    'admin.account_created': 'created',
    'admin.account_updated': 'updated',
    'admin.password_reset': 'reset the password for',
    'admin.sessions_revoked': 'revoked sessions for',
    'admin.account_deleted': 'deleted',
  }
  return labels[activity.action] ?? activity.action.replaceAll('_', ' ')
}

function AccountStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[88px] border-r border-edge px-4 py-3 last:border-r-0">
      <div className="text-[21px] font-semibold">{value}</div>
      <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[9px] border border-edge bg-panel2 px-2 py-2 text-center">
      <div className="text-[14px] font-semibold">{value}</div>
      <div className="mt-0.5 font-mono text-[6.5px] uppercase tracking-[0.06em] text-faint">{label}</div>
    </div>
  )
}

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value))
}
