import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AccountPage, ProtectedRoute } from './AccountPage'
import { AuthProvider, useAuth } from './AuthContext'
import { AuthPage } from './AuthPage'
import { CommunityPage } from './CommunityPage'
import { LandingPage } from './LandingPage'
import { PasswordChangePage } from './PasswordChangePage'
import { NoIndexPage, NotFoundPage } from './SearchBoundaryPages'
import { SeoPage } from './SeoPage'
import { SiteShell } from './SiteShell'
import { getSeoPageByPath } from '../seo/seoPages'

const PlannerApp = lazy(() => import('../App'))
const DashboardPage = lazy(() =>
  import('./DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const AdminPage = lazy(() =>
  import('./AdminPage').then((module) => ({ default: module.AdminPage })),
)
const TrackAnthonyPage = lazy(() =>
  import('./TrackAnthonyPage').then((module) => ({
    default: module.TrackAnthonyPage,
  })),
)
const AdminHotelsPage = lazy(() =>
  import('./AdminHotelsPage').then((module) => ({
    default: module.AdminHotelsPage,
  })),
)

export function ChargeQuestRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteShell />}>
            <Route index element={<HomeRoute />} />
            <Route path="community" element={<CommunityPage />} />
            <Route
              path="track-anthony"
              element={
                <Suspense fallback={<RouteLoadingFallback label="Loading the public route…" />}>
                  <TrackAnthonyPage />
                </Suspense>
              }
            />
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
              path="dashboard"
              element={
                <NoIndexPage title="Dashboard">
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoadingFallback label="Loading your dashboard…" />}>
                      <DashboardPage />
                    </Suspense>
                  </ProtectedRoute>
                </NoIndexPage>
              }
            />
            <Route
              path="account"
              element={
                <NoIndexPage title="Account settings">
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
                    <Suspense fallback={<RouteLoadingFallback label="Loading admin tools…" />}>
                      <AdminPage />
                    </Suspense>
                  </ProtectedRoute>
                </NoIndexPage>
              }
            />
            <Route
              path="admin/hotels"
              element={
                <NoIndexPage title="Admin Hotels">
                  <ProtectedRoute admin>
                    <Suspense fallback={<RouteLoadingFallback label="Loading hotel planner…" />}>
                      <AdminHotelsPage />
                    </Suspense>
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
                  <Suspense fallback={<RouteLoadingFallback label="Loading CORE route planner…" fullScreen />}>
                    <PlannerApp />
                  </Suspense>
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
  if (loading) return <div className="min-h-[calc(100svh-117px)] p-10 text-faint sm:min-h-[calc(100vh-78px)]">Checking your account…</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

export function RouteLoadingFallback({
  label,
  fullScreen = false,
}: {
  label: string
  fullScreen?: boolean
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${fullScreen ? 'min-h-screen' : 'min-h-[calc(100svh-117px)] sm:min-h-[calc(100vh-78px)]'} bg-app p-10 text-faint`}
    >
      {label}
    </div>
  )
}
