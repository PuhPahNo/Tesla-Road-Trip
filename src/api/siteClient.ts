import type { PlannerConfig } from '../domain/types'

export interface AuthUser {
  id: string
  username: string
  role: 'member' | 'admin'
  mustChangePassword: boolean
  createdAt: string
}

export interface AnthonyTrip {
  active: boolean
  title: string
  routeName?: string | null
  dayNumber?: number | null
  totalDays?: number | null
  currentLocation?: string | null
  headline?: string | null
  body?: string | null
  latitude?: number | null
  longitude?: number | null
  startedAt?: string | null
  updatedAt: string
}

export interface CommunitySnapshot {
  trip: AnthonyTrip
  updates: Array<{
    id: string
    day_number?: number | null
    location: string
    title: string
    body: string
    visiting?: string | null
    created_at: string
  }>
  stateVotes: Array<{ state_code: string; votes: number }>
  meetups: Array<{
    id: string
    state_code: string
    city: string
    proposed_day?: number | null
    message: string
    display_name: string
    created_at: string
  }>
  suggestions: Array<{
    id: string
    category: string
    title: string
    body: string
    state_code?: string | null
    display_name: string
    votes: number
    viewer_voted: number
    created_at: string
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    route_name?: string | null
    display_name: string
    created_at: string
  }>
}

export async function fetchSession() {
  return request<{ user?: AuthUser }>('/api/auth/session')
}

export async function signup(input: {
  username: string
  password: string
}) {
  return request<{ user: AuthUser }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function login(input: { username: string; password: string }) {
  return request<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function logout() {
  return request<{ ok: true }>('/api/auth/logout', { method: 'POST' })
}

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
}) {
  return request<{ ok: true; user: AuthUser }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchPreferences() {
  return request<{ authenticated: boolean; config: PlannerConfig }>(
    '/api/account/preferences',
  )
}

export async function savePreferences(config: PlannerConfig) {
  return request<{ ok: true; config: PlannerConfig }>('/api/account/preferences', {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

export async function fetchCommunity() {
  return request<CommunitySnapshot>('/api/community')
}

export async function saveStateVote(input: { stateCode: string; note?: string }) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    '/api/community/state-votes',
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export async function removeStateVote(stateCode: string) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    `/api/community/state-votes/${encodeURIComponent(stateCode)}`,
    { method: 'DELETE' },
  )
}

export async function sendMeetupInvite(input: {
  stateCode: string
  city: string
  proposedDay?: number
  message: string
}) {
  return request<{ ok: true; message: string }>('/api/community/meetups', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function createSuggestion(input: {
  category: string
  title: string
  body: string
  stateCode?: string
}) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    '/api/community/suggestions',
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export async function toggleSuggestionVote(id: string) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    `/api/community/suggestions/${encodeURIComponent(id)}/vote`,
    { method: 'POST' },
  )
}

export async function createAchievement(input: {
  title: string
  description: string
  routeName?: string
}) {
  return request<{ ok: true }>('/api/community/achievements', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchAccount() {
  return request<{
    user: AuthUser
    routeCount: number
    achievements: Array<Record<string, unknown>>
    suggestions: Array<Record<string, unknown>>
    meetups: Array<Record<string, unknown>>
    stateVotes: Array<Record<string, unknown>>
  }>('/api/account')
}

export async function fetchAdminCommunity() {
  return request<{
    community: CommunitySnapshot
    pendingMeetups: Array<Record<string, unknown>>
  }>('/api/admin/community')
}

export async function saveAnthonyTrip(input: Omit<AnthonyTrip, 'updatedAt'>) {
  return request<{ ok: true; community: CommunitySnapshot }>('/api/admin/trip', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function publishAnthonyUpdate(input: {
  dayNumber?: number
  location: string
  title: string
  body: string
  visiting?: string
}) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    '/api/admin/trip-updates',
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export async function moderateMeetup(id: string, status: 'approved' | 'declined') {
  return request<{ ok: true }>(`/api/admin/meetups/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

async function request<T>(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload?.message ?? 'Request failed.')
  return payload as T
}
