import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to={user.mustChangePassword ? '/change-password' : '/account'} replace />
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      const next = mode === 'signup'
        ? await signup({ username, password })
        : await login({ username, password })
      if (next.mustChangePassword) {
        navigate('/change-password', { replace: true })
        return
      }
      const requested = params.get('returnTo')
      navigate(requested?.startsWith('/') ? requested : '/account', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to continue.')
    } finally {
      setBusy(false)
    }
  }

  const signupMode = mode === 'signup'

  return (
    <div className="mx-auto grid min-h-[calc(100svh-117px)] max-w-[1080px] items-center gap-8 px-4 py-8 sm:min-h-[calc(100vh-170px)] sm:px-5 sm:py-14 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
      <div className="hidden lg:block">
        <div className="site-kicker">Your competition starts here</div>
        <h1 className="mt-4 text-[56px] font-semibold leading-[.98] tracking-[-0.05em]">
          Get the same planner Anthony built for himself.
        </h1>
        <p className="mt-6 max-w-[480px] text-[16px] leading-[1.65] text-dim">
          Build a route that can challenge his, save every version, keep your Tesla
          and driving preferences, and join the community following the 2026 run.
        </p>
        <div className="mt-8 grid max-w-[480px] grid-cols-2 gap-3">
          {['Full route optimizer', 'Private route library', 'Competition community', 'No third-party login'].map((item) => (
            <div key={item} className="rounded-[12px] border border-edge bg-chip p-4 text-[12px] font-medium text-dim">{item}</div>
          ))}
        </div>
      </div>

      <div className="site-card mx-auto w-full max-w-[500px] p-5 sm:p-8">
        <div className="site-kicker">{signupMode ? 'Create your account' : 'Welcome back'}</div>
        <h1 className="mt-3 text-[30px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[34px]">
          {signupMode ? 'Build the route that beats his.' : 'Continue your quest.'}
        </h1>
        <p className="mt-3 text-[13px] leading-[1.6] text-dim">
          {signupMode
            ? 'Choose a unique username and password. No email address or external account provider is required.'
            : 'Sign in with your ChargeQuest username and password.'}
        </p>

        {error ? <div className="site-alert mt-5 text-warn">{error}</div> : null}

        <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
          <label className="site-field-label">
            Username
            <input
              required
              minLength={3}
              maxLength={32}
              pattern="[A-Za-z0-9_-]+"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              className="site-input"
              placeholder="roadtripper"
            />
          </label>
          <label className="site-field-label">
            Password
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={signupMode ? 'new-password' : 'current-password'}
              className="site-input"
              placeholder="At least 8 characters"
            />
          </label>
          <button type="submit" disabled={busy} className="site-primary-button mt-1 w-full disabled:opacity-60">
            {busy ? 'Working…' : signupMode ? 'Create free account' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-[11px] border border-edge bg-chip p-3 text-[10.5px] leading-[1.5] text-faint">
          ChargeQuest never asks for your email and has no automated password reset.
          Keep your username and password somewhere safe; Anthony can help manually if
          an account is locked out.
        </div>

        <div className="mt-6 text-center text-[12px] text-dim">
          {signupMode ? 'Already have an account?' : 'New to ChargeQuest?'}{' '}
          <Link
            to={signupMode ? '/login' : '/signup'}
            className="font-semibold text-accent no-underline"
          >
            {signupMode ? 'Sign in' : 'Create one'}
          </Link>
        </div>
      </div>
    </div>
  )
}
