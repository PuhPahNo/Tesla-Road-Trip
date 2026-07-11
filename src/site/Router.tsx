import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from '../App'
import { AccountPage, ProtectedRoute } from './AccountPage'
import { AdminPage } from './AdminPage'
import { AuthProvider } from './AuthContext'
import { AuthPage } from './AuthPage'
import { CommunityPage } from './CommunityPage'
import { LandingPage } from './LandingPage'
import { PasswordChangePage } from './PasswordChangePage'
import { SiteShell } from './SiteShell'
import { TrackAnthonyPage } from './TrackAnthonyPage'

export function ChargeQuestRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteShell />}>
            <Route index element={<LandingPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="track-anthony" element={<TrackAnthonyPage />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="signup" element={<AuthPage mode="signup" />} />
            <Route path="change-password" element={<PasswordChangePage />} />
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute admin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route
            path="planner"
            element={
              <ProtectedRoute unauthenticatedTo="signup">
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
