import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { changePassword } from '../api/siteClient'
import { useAuth } from './AuthContext'

export function PasswordChangePage() {
  const { user, loading, refresh } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (loading) {
    return <div className="min-h-[60vh] p-10 text-faint">Checking your account…</div>
  }
  if (!user) return <Navigate to="/login" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      const result = await changePassword({ currentPassword, newPassword })
      await refresh()
      navigate(result.user.role === 'admin' ? '/admin' : '/account', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to change password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-170px)] max-w-[720px] items-center px-5 py-14 lg:px-8">
      <div className="site-card w-full p-6 sm:p-9">
        <div className="site-kicker">Account security</div>
        <h1 className="mt-3 text-[clamp(34px,6vw,52px)] font-semibold leading-[1] tracking-[-0.05em]">
          {user.mustChangePassword ? 'Replace your temporary password.' : 'Choose a new password.'}
        </h1>
        <p className="mt-5 max-w-[580px] text-[14px] leading-[1.65] text-dim">
          {user.mustChangePassword
            ? 'This account was seeded with a temporary password. Planner, community, and admin actions stay locked until you replace it.'
            : 'Changing your password signs out every other active session on this account.'}
        </p>

        {error ? <div className="site-alert mt-6 text-warn">{error}</div> : null}

        <form className="mt-7 flex flex-col gap-4" onSubmit={submit}>
          <label className="site-field-label">
            Current password
            <input
              required
              type="password"
              maxLength={128}
              className="site-input"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="site-field-label">
            New password
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              className="site-input"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </label>
          <button type="submit" disabled={busy} className="site-primary-button disabled:opacity-60">
            {busy ? 'Updating…' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  )
}
