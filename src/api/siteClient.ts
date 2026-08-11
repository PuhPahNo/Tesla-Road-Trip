import type {
  Coordinate,
  PlannerConfig,
  RoutePlan,
  SavedCustomRoute,
  StationAddress,
} from '../domain/types'

export interface AuthUser {
  id: string
  username: string
  role: 'member' | 'admin'
  mustChangePassword: boolean
  createdAt: string
}

export interface AccountSnapshot {
  user: AuthUser
  routes: SavedCustomRoute[]
  routeCount: number
  achievements: Array<Record<string, unknown>>
  suggestions: Array<Record<string, unknown>>
  meetups: Array<Record<string, unknown>>
  stateVotes: Array<Record<string, unknown>>
}

export interface AnthonyTrip {
  active: boolean
  title: string
  selectedRouteId?: string | null
  routeName?: string | null
  dayNumber?: number | null
  totalDays?: number | null
  currentLocation?: string | null
  headline?: string | null
  body?: string | null
  latitude?: number | null
  longitude?: number | null
  startedAt?: string | null
  departureDate?: string | null
  updatedAt: string
}

export type AnthonyUpdatePhase =
  | 'planning'
  | 'route-decision'
  | 'build-note'
  | 'milestone'
  | 'on-the-road'

export interface AnthonyUpdate {
  id: string
  phase: AnthonyUpdatePhase
  day_number?: number | null
  location: string
  title: string
  body: string
  visiting?: string | null
  artifact_url?: string | null
  artifact_label?: string | null
  artifact_type?: 'image' | 'video' | 'link' | null
  created_at: string
  updated_at?: string | null
}

export interface CommunitySnapshot {
  trip: AnthonyTrip
  updates: AnthonyUpdate[]
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

export interface PublishedAnthonyRoute {
  savedRoute: {
    id: string
    name: string
    color: string
    startDate?: string
    targetDays?: number
    waypointCount: number
    updatedAt: string
  }
  route: RoutePlan
  road: {
    provider: string
    line: Coordinate[]
    degraded: boolean
    warnings: string[]
    requestCount: number
  } | null
}

export interface AdminHotelRecommendation {
  sourceKey: string
  name: string
  brand?: string
  tier:
    | 'luxury'
    | 'upscale'
    | 'premium'
    | 'unique'
    | 'reputable'
    | 'independent'
    | 'basic'
  tierLabel: string
  isUnique: boolean
  curatorNote?: string
  position: Coordinate
  address: string
  distanceFromSuperchargerMiles: number
  routeDetourMiles: number
  evCharging: {
    status: 'nearby' | 'unverified'
    distanceMiles?: number
    label?: string
  }
  officialUrl?: string
  bookingUrl: string
  mapsUrl: string
  photoUrl?: string
  photoSource?: string
  rateSnapshot: {
    provider: 'Booking.com'
    availability: 'available' | 'unavailable' | 'not_found'
    nightlyUsd: number | null
    observedAt: string | null
  }
}

export interface AdminHotelDay {
  day: number
  date: string
  checkOut: string
  station: {
    sourceId: string
    name: string
    address: StationAddress
    position: Coordinate
  } | null
  nextStation: {
    name: string
    city: string
    state: string
    position: Coordinate
  } | null
  recommendations: AdminHotelRecommendation[]
  researchStatus: 'current' | 'needs_refresh'
}

export interface AdminHotelPlan {
  route: {
    id: string
    name: string
    startDate?: string
    totalDays: number
    uniqueStations: number
  }
  research: {
    routeName: string
    capturedAt: string
    researchedAt: string
    bookingResearchedAt?: string
    sources: Record<string, string>
  }
  stats: {
    researchedDays: number
    totalRecommendations: number
    pricedOptions: number
    withPhotos: number
    nearbyCharging: number
    higherEnd: number
    uniqueStays: number
  }
  days: AdminHotelDay[]
}

export interface ManagedAccount {
  id: string
  username: string
  role: 'member' | 'admin'
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
  activeSessions: number
  routeCount: number
  suggestionCount: number
  meetupCount: number
  stateVoteCount: number
  achievementCount: number
}

export interface AccountActivity {
  id: string
  actorUserId?: string | null
  actorUsername: string
  targetUserId?: string | null
  targetUsername?: string | null
  action: string
  details?: Record<string, unknown> | null
  createdAt: string
}

export interface AdminAccountsSnapshot {
  viewerId: string
  accounts: ManagedAccount[]
  activity: AccountActivity[]
}

export interface AdminAccountDetail {
  account: ManagedAccount
  routes: SavedCustomRoute[]
  preferences: {
    config: Partial<PlannerConfig>
    updatedAt: string
  } | null
  suggestions: Array<{
    id: string
    category: string
    title: string
    body: string
    state_code?: string | null
    review_status: 'pending' | 'reviewed' | 'archived'
    created_at: string
    updated_at: string
  }>
  meetups: Array<Record<string, unknown>>
  stateVotes: Array<Record<string, unknown>>
  achievements: Array<Record<string, unknown>>
  activity: AccountActivity[]
}

export interface SuggestionInboxItem {
  id: string
  category: string
  title: string
  body: string
  state_code?: string | null
  review_status: 'pending' | 'reviewed' | 'archived'
  display_name: string
  created_at: string
  updated_at: string
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

export async function fetchAnthonyRoute() {
  return request<{
    selectedRouteId: string | null
    route: PublishedAnthonyRoute | null
  }>('/api/community/anthony-route')
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
  return request<AccountSnapshot>('/api/account')
}

export async function fetchAdminCommunity() {
  return request<{
    community: CommunitySnapshot
    savedRoutes: SavedCustomRoute[]
    pendingMeetups: Array<Record<string, unknown>>
    suggestionInbox: SuggestionInboxItem[]
  }>('/api/admin/community')
}

export async function fetchAdminAnthonyRoute(routeId: string) {
  return request<{
    selectedRouteId: string
    route: PublishedAnthonyRoute
  }>(`/api/admin/trip-route/${encodeURIComponent(routeId)}`)
}

export async function fetchAdminHotels(routeId: string) {
  return request<AdminHotelPlan>(
    `/api/admin/hotels/${encodeURIComponent(routeId)}`,
  )
}

export async function fetchAdminAccounts() {
  return request<AdminAccountsSnapshot>('/api/admin/accounts')
}

export async function fetchAdminAccountDetail(id: string) {
  return request<AdminAccountDetail>(`/api/admin/accounts/${encodeURIComponent(id)}`)
}

export async function createAdminAccount(input: {
  username: string
  password: string
  role: 'member' | 'admin'
}) {
  return request<AdminAccountsSnapshot>('/api/admin/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateAdminAccount(
  id: string,
  input: { username?: string; role?: 'member' | 'admin' },
) {
  return request<AdminAccountsSnapshot>(
    `/api/admin/accounts/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  )
}

export async function resetAdminAccountPassword(id: string, password: string) {
  return request<AdminAccountsSnapshot>(
    `/api/admin/accounts/${encodeURIComponent(id)}/reset-password`,
    { method: 'POST', body: JSON.stringify({ password }) },
  )
}

export async function revokeAdminAccountSessions(id: string) {
  return request<AdminAccountsSnapshot>(
    `/api/admin/accounts/${encodeURIComponent(id)}/revoke-sessions`,
    { method: 'POST' },
  )
}

export async function deleteAdminAccount(id: string) {
  return request<AdminAccountsSnapshot>(
    `/api/admin/accounts/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )
}

export async function saveAnthonyTrip(input: Omit<AnthonyTrip, 'updatedAt'>) {
  return request<{ ok: true; community: CommunitySnapshot }>('/api/admin/trip', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function publishAnthonyUpdate(input: {
  phase: AnthonyUpdatePhase
  dayNumber?: number
  location?: string
  title: string
  body: string
  visiting?: string
  artifactUrl?: string
  artifactLabel?: string
  artifactType?: 'image' | 'video' | 'link'
}) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    '/api/admin/trip-updates',
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export async function updateAnthonyUpdate(
  id: string,
  input: {
    phase: AnthonyUpdatePhase
    dayNumber?: number
    location?: string
    title: string
    body: string
    visiting?: string
    artifactUrl?: string
    artifactLabel?: string
    artifactType?: 'image' | 'video' | 'link'
  },
) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    `/api/admin/trip-updates/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  )
}

export async function deleteAnthonyUpdate(id: string) {
  return request<{ ok: true; community: CommunitySnapshot }>(
    `/api/admin/trip-updates/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  )
}

export async function reviewSuggestion(
  id: string,
  status: 'pending' | 'reviewed' | 'archived',
) {
  return request<{ ok: true }>(`/api/admin/suggestions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteSuggestion(id: string) {
  return request<{ ok: true }>(`/api/admin/suggestions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
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
