import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './AccountPage'
import { AuthProvider } from './AuthContext'
import { AuthPage } from './AuthPage'
import { PasswordChangePage } from './PasswordChangePage'
import { NoIndexPage, NotFoundPage } from './SearchBoundaryPages'
import { SiteShell } from './SiteShell'
import { legacyRedirectTarget } from './sitePages'
import { TripDataProvider } from './tracker/TripData'
import { TrackerHomePage } from './tracker/TrackerHomePage'
import { JournalPage, JournalPostPage } from './tracker/JournalPages'
import { AboutPage } from './tracker/AboutPage'

// Member-product pages (dashboard, account, community, signup) are kept in
// the codebase for a possible future product but are not routed: the public
// site is a read-only tracker and only Anthony signs in.

const PlannerApp = lazy(() => import('../App'))
const PublicRoutePage = lazy(() =>
  import('./tracker/PublicRoutePage').then((module) => ({ default: module.PublicRoutePage })),
)
const AdminPage = lazy(() =>
  import('./AdminPage').then((module) => ({ default: module.AdminPage })),
)
const AdminHotelsPage = lazy(() =>
  import('./AdminHotelsPage').then((module) => ({ default: module.AdminHotelsPage })),
)

export function ChargeQuestRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripDataProvider>
          <Routes>
            <Route element={<SiteShell />}>
              <Route index element={<TrackerHomePage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="journal/:postId" element={<JournalPostPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="login" element={<NoIndexPage title="Sign in"><AuthPage mode="login" /></NoIndexPage>} />
              <Route path="change-password" element={<NoIndexPage title="Change password"><PasswordChangePage /></NoIndexPage>} />
              <Route
                path="admin"
                element={
                  <AdminOnly title="Admin" label="Loading admin tools…">
                    <AdminPage />
                  </AdminOnly>
                }
              />
              <Route
                path="admin/hotels"
                element={
                  <AdminOnly title="Admin Hotels" label="Loading hotel planner…">
                    <AdminHotelsPage />
                  </AdminOnly>
                }
              />
            </Route>
            <Route
              path="route"
              element={
                <Suspense fallback={<RouteLoadingFallback label="Loading the route…" fullScreen />}>
                  <PublicRoutePage />
                </Suspense>
              }
            />
            <Route
              path="planner"
              element={
                <NoIndexPage title="CORE Route Planner">
                  <ProtectedRoute admin>
                    <Suspense fallback={<RouteLoadingFallback label="Loading CORE route planner…" fullScreen />}>
                      <PlannerApp />
                    </Suspense>
                  </ProtectedRoute>
                </NoIndexPage>
              }
            />
            <Route path="*" element={<LegacyOrNotFound />} />
          </Routes>
        </TripDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AdminOnly({ title, label, children }: { title: string; label: string; children: ReactNode }) {
  return (
    <NoIndexPage title={title}>
      <ProtectedRoute admin>
        <Suspense fallback={<RouteLoadingFallback label={label} />}>{children}</Suspense>
      </ProtectedRoute>
    </NoIndexPage>
  )
}

/** Old SEO and member URLs forward to the closest tracker page. */
function LegacyOrNotFound() {
  const location = useLocation()
  const target = legacyRedirectTarget(location.pathname)
  if (target) return <Navigate to={target} replace />
  return <NotFoundPage />
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
      className={`${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'} bg-app p-10 text-faint`}
    >
      {label}
    </div>
  )
}
