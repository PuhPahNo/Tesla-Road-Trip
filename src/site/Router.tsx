import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import App from '../App'
import { AccountPage, ProtectedRoute } from './AccountPage'
import { AdminPage } from './AdminPage'
import { AuthProvider, useAuth } from './AuthContext'
import { AuthPage } from './AuthPage'
import { CommunityPage } from './CommunityPage'
import { LandingPage } from './LandingPage'
import { PasswordChangePage } from './PasswordChangePage'
import { NoIndexPage, NotFoundPage } from './SearchBoundaryPages'
import { SeoPage } from './SeoPage'
import { SiteShell } from './SiteShell'
import { TrackAnthonyPage } from './TrackAnthonyPage'
import { getSeoPageByPath } from '../seo/seoPages'

export function ChargeQuestRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteShell />}>
            <Route index element={<HomeRoute />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="track-anthony" element={<TrackAnthonyPage />} />
            <Route path="2026-tesla-supercharging-competition" element={<SeoRoutePage />} />
            <Route path="competition/:slug" element={<SeoRoutePage />} />
            <Route path="tesla-iconic-charger-badges" element={<SeoRoutePage />} />
            <Route path="badges/:slug" element={<SeoRoutePage />} />
            <Route path="tesla-road-trip-routes" element={<SeoRoutePage />} />
            <Route path="routes/:slug" element={<SeoRoutePage />} />
            <Route path="about-anthony" element={<SeoRoutePage />} />
            <Route path="login" element={<NoIndexPage title="Sign in"><AuthPage mode="login" /></NoIndexPage>} />
            <Route path="signup" element={<NoIndexPage title="Create an account"><AuthPage mode="signup" /></NoIndexPage>} />
            <Route path="change-password" element={<NoIndexPage title="Change password"><PasswordChangePage /></NoIndexPage>} />
            <Route
              path="account"
              element={
                <NoIndexPage title="Account">
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                </NoIndexPage>
              }
            />
            <Route
              path="admin"
              element={
                <NoIndexPage title="Admin">
                  <ProtectedRoute admin>
                    <AdminPage />
                  </ProtectedRoute>
                </NoIndexPage>
              }
            />
          </Route>
          <Route
            path="planner"
            element={
              <NoIndexPage title="CORE Route Planner">
                <ProtectedRoute unauthenticatedTo="signup">
                  <App />
                </ProtectedRoute>
              </NoIndexPage>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function SeoRoutePage() {
  const location = useLocation()
  const page = getSeoPageByPath(location.pathname)
  return page ? <SeoPage page={page} /> : <NotFoundPage />
}

export function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-[60vh] p-10 text-faint">Checking your account…</div>
  if (user) return <Navigate to="/planner" replace />
  return <LandingPage />
}
