import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  ChevronRight,
  KeyRound,
  Lightbulb,
  MapPinned,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
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

type RoleFilter = 'all' | 'member' | 'admin'

const EMPTY_CREATE = {
  username: '',
  password: '',
  role: 'member' as 'member' | 'admin',
}

export function AdminAccountsSection() {
  const { refresh } = useAuth()
  const [snapshot, setSnapshot] = useState<AdminAccountsSnapshot>()
  const [createInput, setCreateInput] = useState(EMPTY_CREATE)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>()
  const [busy, setBusy] = useState<string>()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
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
    setNotice(undefined)
    try {
      const nextSnapshot = await action()
      setSnapshot(nextSnapshot)
      setNotice(success)
      if (selectedAccountId && !nextSnapshot.accounts.some((item) => item.id === selectedAccountId)) {
        setSelectedAccountId(undefined)
      }
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
    const username = createInput.username.trim().toLowerCase()
    const succeeded = await run(
      'create',
      () => createAdminAccount(createInput),
      `Created @${username}. They must replace the temporary password at sign-in.`,
    )
    if (succeeded) {
      setCreateInput(EMPTY_CREATE)
      setCreateOpen(false)
    }
  }

  const accounts = snapshot?.accounts ?? []
  const adminCount = accounts.filter((account) => account.role === 'admin').length
  const activeUsers = accounts.filter((account) => account.activeSessions > 0).length
  const routeCount = accounts.reduce((total, account) => total + account.routeCount, 0)
  const normalizedQuery = query.trim().toLowerCase()
  const visibleAccounts = accounts.filter((account) => {
    const matchesQuery = !normalizedQuery || account.username.toLowerCase().includes(normalizedQuery)
    const matchesRole = roleFilter === 'all' || account.role === roleFilter
    return matchesQuery && matchesRole
  })
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId)

  return (
    <section className="mt-8 border-t border-edge pt-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="site-kicker">Accounts & access</div>
          <h2 className="mt-2 text-[32px] font-semibold tracking-[-0.035em] sm:text-[38px]">Users</h2>
          <p className="mt-2 max-w-[660px] text-[13px] leading-[1.6] text-dim">
            Manage access, review account status, and inspect the routes and activity connected to each user.
          </p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="site-primary-button gap-2 self-start lg:self-auto">
          <UserPlus size={16} aria-hidden="true" />
          Add user
        </button>
      </div>

      {error ? <div className="mt-5 rounded-[11px] border border-warn-bd bg-warn-bg px-4 py-3 text-[13px] text-warn">{error}</div> : null}
      {notice ? <div className="mt-5 rounded-[11px] border border-good-bd bg-good-bg px-4 py-3 text-[13px] text-good">{notice}</div> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AccountSummary icon={<Users size={17} />} label="Total users" value={accounts.length} />
        <AccountSummary icon={<ShieldCheck size={17} />} label="Administrators" value={adminCount} />
        <AccountSummary icon={<span className="h-2.5 w-2.5 rounded-full bg-good" />} label="Signed in now" value={activeUsers} />
        <AccountSummary icon={<MapPinned size={17} />} label="Saved routes" value={routeCount} />
      </div>

      <div className="admin-surface mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-edge p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-[380px]">
            <span className="sr-only">Search users</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} aria-hidden="true" />
            <input
              className="site-input pl-10"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username"
              aria-label="Search users"
            />
          </label>
          <div className="flex items-center gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-semibold text-dim sm:flex-none">
              <span className="whitespace-nowrap">Role</span>
              <select className="site-input min-w-[130px]" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)} aria-label="Filter users by role">
                <option value="all">All users</option>
                <option value="member">Users</option>
                <option value="admin">Admins</option>
              </select>
            </label>
            <span className="whitespace-nowrap text-[11px] text-faint">{visibleAccounts.length} shown</span>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-chip/55">
              <tr className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
                <th scope="col" className="px-5 py-3 font-semibold">User</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">Routes</th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">Ideas</th>
                <th scope="col" className="px-4 py-3 font-semibold">Last sign-in</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleAccounts.map((account) => (
                <AccountTableRow
                  key={account.id}
                  account={account}
                  isSelf={account.id === snapshot?.viewerId}
                  onOpen={() => setSelectedAccountId(account.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-edge md:hidden">
          {visibleAccounts.map((account) => (
            <MobileAccountRow
              key={account.id}
              account={account}
              isSelf={account.id === snapshot?.viewerId}
              onOpen={() => setSelectedAccountId(account.id)}
            />
          ))}
        </div>

        {snapshot && visibleAccounts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="mx-auto text-faint" size={24} aria-hidden="true" />
            <div className="mt-3 text-[13px] font-semibold">No users found</div>
            <div className="mt-1 text-[11px] text-faint">Try another search or role filter.</div>
          </div>
        ) : null}
      </div>

      <details className="mt-5 overflow-hidden rounded-[14px] border border-edge bg-panel">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 marker:hidden">
          <div>
            <h3 className="text-[14px] font-semibold">Recent account activity</h3>
            <p className="mt-1 text-[10.5px] text-faint">Security and account changes · latest 100 events</p>
          </div>
          <ChevronRight size={17} className="text-faint" aria-hidden="true" />
        </summary>
        <div className="border-t border-edge px-5">
          {(snapshot?.activity ?? []).map((activity) => <ActivityRow key={activity.id} activity={activity} />)}
          {snapshot && snapshot.activity.length === 0 ? <div className="py-8 text-[12px] text-faint">Account activity will appear here.</div> : null}
        </div>
      </details>

      {createOpen ? (
        <CreateAccountDialog
          input={createInput}
          busy={busy === 'create'}
          onChange={setCreateInput}
          onClose={() => setCreateOpen(false)}
          onSubmit={create}
        />
      ) : null}

      {selectedAccount ? (
        <AccountDrawer
          account={selectedAccount}
          isSelf={selectedAccount.id === snapshot?.viewerId}
          busy={busy}
          onClose={() => setSelectedAccountId(undefined)}
          onUpdate={async (input) => {
            const succeeded = await run(
              `update:${selectedAccount.id}`,
              () => updateAdminAccount(selectedAccount.id, input),
              `Updated @${input.username}.`,
            )
            if (succeeded && selectedAccount.id === snapshot?.viewerId) await refresh()
            return succeeded
          }}
          onReset={(password) => run(
            `reset:${selectedAccount.id}`,
            () => resetAdminAccountPassword(selectedAccount.id, password),
            `Reset @${selectedAccount.username}’s password and revoked their sessions.`,
          )}
          onRevoke={() => run(
            `revoke:${selectedAccount.id}`,
            () => revokeAdminAccountSessions(selectedAccount.id),
            `Revoked @${selectedAccount.username}’s active sessions.`,
          )}
          onDelete={() => run(
            `delete:${selectedAccount.id}`,
            () => deleteAdminAccount(selectedAccount.id),
            `Deleted @${selectedAccount.username} and their account-owned data.`,
          )}
        />
      ) : null}
    </section>
  )
}

function AccountSummary({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-edge bg-panel px-4 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-chip text-accent2">{icon}</div>
      <div>
        <div className="text-[20px] font-semibold leading-none">{value}</div>
        <div className="mt-1 text-[9.5px] text-faint">{label}</div>
      </div>
    </div>
  )
}

function AccountTableRow({ account, isSelf, onOpen }: { account: ManagedAccount; isSelf: boolean; onOpen: () => void }) {
  return (
    <tr className="border-t border-edge transition first:border-t-0 hover:bg-chip/35">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <AccountAvatar username={account.username} />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold">@{account.username}</div>
            <div className="mt-0.5 text-[9.5px] text-faint">Joined {formatDate(account.createdAt)}</div>
          </div>
          {isSelf ? <span className="rounded-full bg-accent2/10 px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.08em] text-accent2">You</span> : null}
        </div>
      </td>
      <td className="px-4 py-4"><RoleBadge role={account.role} /></td>
      <td className="px-4 py-4"><StatusBadge account={account} /></td>
      <td className="px-4 py-4 text-center text-[12px] font-semibold">{account.routeCount}</td>
      <td className="px-4 py-4 text-center text-[12px] font-semibold">{account.suggestionCount}</td>
      <td className="px-4 py-4 text-[11px] text-dim">{account.lastLoginAt ? formatDate(account.lastLoginAt, true) : 'Never'}</td>
      <td className="px-5 py-4 text-right">
        <button type="button" onClick={onOpen} className="inline-flex min-h-9 items-center gap-1 rounded-[9px] border border-edge bg-chip px-3 text-[10.5px] font-semibold text-dim hover:border-edge2 hover:text-ink" aria-label={`Open ${account.username}`}>
          View <ChevronRight size={14} aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}

function MobileAccountRow({ account, isSelf, onOpen }: { account: ManagedAccount; isSelf: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 border-0 bg-transparent px-4 py-4 text-left text-ink" aria-label={`Open ${account.username}`}>
      <AccountAvatar username={account.username} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[13px] font-semibold">@{account.username}</span>
          {isSelf ? <span className="text-[9px] text-accent2">You</span> : null}
          <RoleBadge role={account.role} />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-faint">
          <StatusBadge account={account} />
          <span>{account.routeCount} route{account.routeCount === 1 ? '' : 's'}</span>
          <span>{account.suggestionCount} idea{account.suggestionCount === 1 ? '' : 's'}</span>
        </div>
      </div>
      <ChevronRight size={17} className="flex-none text-faint" aria-hidden="true" />
    </button>
  )
}

function AccountAvatar({ username }: { username: string }) {
  return (
    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent2/10 text-[13px] font-semibold uppercase text-accent2">
      {username.charAt(0)}
    </div>
  )
}

function RoleBadge({ role }: { role: ManagedAccount['role'] }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.06em] ${role === 'admin' ? 'bg-accent2/10 text-accent2' : 'bg-chip text-dim'}`}>
      {role === 'admin' ? 'Admin' : 'User'}
    </span>
  )
}

function StatusBadge({ account }: { account: ManagedAccount }) {
  if (account.mustChangePassword) {
    return <span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold text-warn"><span className="h-1.5 w-1.5 rounded-full bg-warn" />Setup required</span>
  }
  if (account.activeSessions > 0) {
    return <span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold text-good"><span className="h-1.5 w-1.5 rounded-full bg-good" />Active</span>
  }
  return <span className="inline-flex items-center gap-1.5 text-[9.5px] text-faint"><span className="h-1.5 w-1.5 rounded-full bg-faint" />Signed out</span>
}

function CreateAccountDialog({
  input,
  busy,
  onChange,
  onClose,
  onSubmit,
}: {
  input: typeof EMPTY_CREATE
  busy: boolean
  onChange: (input: typeof EMPTY_CREATE) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}) {
  useDialogEscape(onClose)
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/68 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form className="w-full max-w-[500px] overflow-hidden rounded-[18px] border border-edge bg-panel shadow-2xl" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-user-title">
        <div className="flex items-start justify-between border-b border-edge px-5 py-5 sm:px-6">
          <div>
            <div className="site-kicker">New account</div>
            <h3 id="create-user-title" className="mt-1 text-[22px] font-semibold">Add a user</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-chip text-faint hover:text-ink" aria-label="Close add user dialog"><X size={17} /></button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <label className="site-field-label">
            Username
            <input autoFocus required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" className="site-input" value={input.username} onChange={(event) => onChange({ ...input, username: event.target.value })} placeholder="new-roadtripper" />
          </label>
          <label className="site-field-label">
            Temporary password
            <input required type="password" minLength={8} maxLength={128} className="site-input" value={input.password} onChange={(event) => onChange({ ...input, password: event.target.value })} placeholder="At least 8 characters" autoComplete="new-password" />
          </label>
          <label className="site-field-label">
            Access level
            <select className="site-input" value={input.role} onChange={(event) => onChange({ ...input, role: event.target.value as 'member' | 'admin' })}>
              <option value="member">User</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <div className="rounded-[10px] bg-chip px-4 py-3 text-[10.5px] leading-[1.55] text-faint">
            The temporary password is never shown again. The user must replace it the first time they sign in.
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-edge bg-chip/35 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="site-secondary-button">Cancel</button>
          <button type="submit" disabled={busy} className="site-primary-button gap-2 disabled:opacity-55"><UserPlus size={15} />{busy ? 'Creating…' : 'Create user'}</button>
        </div>
      </form>
    </div>
  )
}

function AccountDrawer({
  account,
  isSelf,
  busy,
  onClose,
  onUpdate,
  onReset,
  onRevoke,
  onDelete,
}: {
  account: ManagedAccount
  isSelf: boolean
  busy?: string
  onClose: () => void
  onUpdate: (input: { username: string; role: 'member' | 'admin' }) => Promise<boolean>
  onReset: (password: string) => Promise<boolean>
  onRevoke: () => Promise<boolean>
  onDelete: () => Promise<boolean>
}) {
  const [username, setUsername] = useState(account.username)
  const [role, setRole] = useState(account.role)
  const [password, setPassword] = useState('')
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [detail, setDetail] = useState<AdminAccountDetail>()
  const [detailError, setDetailError] = useState<string>()
  const working = Boolean(busy?.endsWith(account.id))

  useDialogEscape(onClose)

  useEffect(() => {
    setUsername(account.username)
    setRole(account.role)
  }, [account.role, account.username])

  useEffect(() => {
    let cancelled = false
    setDetail(undefined)
    setDetailError(undefined)
    void fetchAdminAccountDetail(account.id)
      .then((result) => { if (!cancelled) setDetail(result) })
      .catch((requestError) => {
        if (!cancelled) setDetailError(requestError instanceof Error ? requestError.message : 'Unable to load this user.')
      })
    return () => { cancelled = true }
  }, [account.id])

  const hasProfileChanges = username.trim() !== account.username || role !== account.role
  const profileValid = /^[A-Za-z0-9_-]{3,32}$/.test(username.trim())

  return (
    <div className="fixed inset-0 z-[80] bg-black/58 backdrop-blur-[2px]" onMouseDown={onClose}>
      <aside className="ml-auto flex h-full w-full max-w-[720px] flex-col border-l border-edge bg-app shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="account-drawer-title">
        <div className="flex items-start gap-3 border-b border-edge bg-panel px-5 py-5 sm:px-6">
          <AccountAvatar username={account.username} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="account-drawer-title" className="truncate text-[21px] font-semibold">@{account.username}</h3>
              <RoleBadge role={account.role} />
              {isSelf ? <span className="text-[9px] font-semibold text-accent2">Your account</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9.5px] text-faint">
              <StatusBadge account={account} />
              <span>Joined {formatDate(account.createdAt)}</span>
              <span>{account.lastLoginAt ? `Last sign-in ${formatDate(account.lastLoginAt, true)}` : 'Never signed in'}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-edge bg-chip text-faint hover:text-ink" aria-label="Close user details"><X size={17} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 border-b border-edge bg-panel2">
            <DrawerMetric label="Routes" value={account.routeCount} />
            <DrawerMetric label="Sessions" value={account.activeSessions} />
            <DrawerMetric label="Ideas" value={account.suggestionCount} />
            <DrawerMetric label="Meetups" value={account.meetupCount} />
          </div>

          <section className="border-b border-edge p-5 sm:p-6">
            <SectionHeading title="Profile and access" description="Change the username or permission level for this account." />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="site-field-label">
                Username
                <input className="site-input" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" value={username} onChange={(event) => setUsername(event.target.value)} aria-label={`Username for ${account.username}`} />
              </label>
              <label className="site-field-label">
                Access level
                <select className="site-input" value={role} disabled={isSelf} onChange={(event) => setRole(event.target.value as 'member' | 'admin')} aria-label={`Access level for ${account.username}`}>
                  <option value="member">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" disabled={!hasProfileChanges || !profileValid || working} onClick={() => void onUpdate({ username: username.trim(), role })} className="site-primary-button disabled:cursor-not-allowed disabled:opacity-45">Save changes</button>
            </div>
          </section>

          <section className="border-b border-edge p-5 sm:p-6">
            <SectionHeading title="Routes and account data" description="Read-only inspection of this user’s saved planner work." />
            {detailError ? <div className="mt-4 rounded-[10px] border border-warn-bd bg-warn-bg p-4 text-[12px] text-warn">{detailError}</div> : null}
            {!detail && !detailError ? <div className="mt-4 text-[12px] text-faint">Loading routes and activity…</div> : null}
            {detail ? <AccountData detail={detail} /> : null}
          </section>

          <section className="border-b border-edge p-5 sm:p-6">
            <SectionHeading title="Security" description={isSelf ? 'Use your account page to change your own password.' : 'Reset credentials or sign this user out everywhere.'} />
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="site-field-label">
                New temporary password
                <input type="password" minLength={8} maxLength={128} className="site-input" disabled={isSelf} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSelf ? 'Managed from your account page' : 'At least 8 characters'} aria-label={`New temporary password for ${account.username}`} autoComplete="new-password" />
              </label>
              <button type="button" disabled={isSelf || password.length < 8 || working} onClick={() => void onReset(password).then((succeeded) => { if (succeeded) setPassword('') })} className="site-secondary-button gap-2 disabled:opacity-45"><KeyRound size={15} />Reset password</button>
            </div>
            <button type="button" disabled={isSelf || working || account.activeSessions === 0} onClick={() => void onRevoke()} className="site-secondary-button mt-3 disabled:opacity-45">Revoke all active sessions</button>
          </section>

          <section className="p-5 sm:p-6">
            <SectionHeading title="Delete account" description="Permanently removes the user and all account-owned routes and preferences." />
            <button
              type="button"
              disabled={isSelf || working}
              onClick={() => deleteArmed ? void onDelete() : setDeleteArmed(true)}
              onBlur={() => setDeleteArmed(false)}
              className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-[10px] border px-4 text-[11.5px] font-semibold disabled:opacity-35 ${deleteArmed ? 'border-warn-bd bg-warn-bg text-warn' : 'border-edge bg-transparent text-faint'}`}
            >
              <Trash2 size={15} />{deleteArmed ? 'Click again to permanently delete' : 'Delete user'}
            </button>
          </section>
        </div>
      </aside>
    </div>
  )
}

function AccountData({ detail }: { detail: AdminAccountDetail }) {
  const preferences = detail.preferences?.config
  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <DetailFact label="Vehicle" value={String(preferences?.vehicleProfileId ?? 'Default')} />
        <DetailFact label="Range" value={preferences?.practicalRangeMiles ? `${preferences.practicalRangeMiles} mi` : 'Default'} />
        <DetailFact label="Pace" value={String(preferences?.tripPace ?? 'Default')} />
        <DetailFact label="Account events" value={detail.activity.length} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h5 className="text-[12px] font-semibold">Saved routes</h5>
          <span className="text-[9px] text-faint">Admin read access</span>
        </div>
        <div className="mt-3 space-y-3">
          {detail.routes.map((route) => (
            <article key={route.id} className="rounded-[12px] border border-edge bg-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold">{route.name}</div>
                  <div className="mt-1 text-[9px] text-faint">Updated {formatDate(route.updatedAt, true)} · {route.waypoints.length} waypoint{route.waypoints.length === 1 ? '' : 's'}</div>
                </div>
                <span className="h-3.5 w-3.5 flex-none rounded-full border border-edge" style={{ backgroundColor: route.color }} aria-label={`Route color ${route.color}`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[8px] font-semibold uppercase tracking-[0.05em] text-dim">
                {route.targetDays ? <span className="rounded-full bg-chip px-2.5 py-1">{route.targetDays} days</span> : null}
                <span className="rounded-full bg-chip px-2.5 py-1">{route.keepOrder ? 'Fixed order' : 'Optimized'}</span>
                {route.startDate ? <span className="rounded-full bg-chip px-2.5 py-1">Starts {route.startDate}</span> : null}
              </div>
              {route.waypoints.length ? (
                <ol className="mt-3 space-y-1.5 border-t border-edge pt-3">
                  {route.waypoints.map((waypoint, index) => (
                    <li key={waypoint.id} className="list-none text-[10.5px] text-dim"><span className="mr-2 text-accent2">{index + 1}.</span>{waypoint.label}<span className="text-faint"> · {waypoint.radiusMiles} mi</span></li>
                  ))}
                </ol>
              ) : null}
            </article>
          ))}
          {detail.routes.length === 0 ? <div className="rounded-[12px] border border-dashed border-edge px-4 py-6 text-center text-[11px] text-faint">No saved routes yet.</div> : null}
        </div>
      </div>

      {detail.suggestions.length ? (
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold"><Lightbulb size={14} className="text-accent2" />Recent ideas</div>
          <div className="mt-2 divide-y divide-edge rounded-[11px] border border-edge bg-panel px-4">
            {detail.suggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="py-3">
                <div className="text-[11px] font-semibold">{suggestion.title}</div>
                <div className="mt-1 text-[8px] uppercase tracking-[0.06em] text-faint">{suggestion.category} · {suggestion.review_status}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {detail.activity.length ? (
        <div>
          <h5 className="text-[12px] font-semibold">Recent activity</h5>
          <div className="mt-2 divide-y divide-edge rounded-[11px] border border-edge bg-panel px-4">
            {detail.activity.slice(0, 6).map((activity) => <ActivityRow key={activity.id} activity={activity} compact />)}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DrawerMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-edge px-3 py-3.5 text-center last:border-r-0">
      <div className="text-[17px] font-semibold">{value}</div>
      <div className="mt-0.5 text-[8px] uppercase tracking-[0.07em] text-faint">{label}</div>
    </div>
  )
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h4 className="text-[14px] font-semibold">{title}</h4>
      <p className="mt-1 text-[10.5px] leading-[1.5] text-faint">{description}</p>
    </div>
  )
}

function DetailFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[10px] bg-chip px-3 py-3">
      <div className="text-[7px] uppercase tracking-[0.08em] text-faint">{label}</div>
      <div className="mt-1 truncate text-[10.5px] font-semibold">{value}</div>
    </div>
  )
}

function ActivityRow({ activity, compact = false }: { activity: AccountActivity; compact?: boolean }) {
  return (
    <div className={`grid gap-1 ${compact ? 'py-3' : 'py-4 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center sm:gap-3'}`}>
      <div className="text-[8.5px] text-faint">{formatDate(activity.createdAt, true)}</div>
      <div className="text-[11px] leading-[1.45] text-dim">
        <span className="font-semibold text-ink">@{activity.actorUsername}</span>{' '}
        {activityText(activity)}
        {activity.targetUsername && activity.targetUsername !== activity.actorUsername ? <span> <span className="text-faint">·</span> @{activity.targetUsername}</span> : null}
      </div>
      {!compact ? <div className="font-mono text-[7px] uppercase tracking-[0.07em] text-faint">{activity.action.replaceAll('_', ' ')}</div> : null}
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

function useDialogEscape(onClose: () => void) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
}

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value))
}
