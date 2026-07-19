const apiUrl = process.env.API_URL ?? 'http://localhost:4188'
const suffix = Date.now()
const memberUsername = `community${suffix}`
const otherUsername = `other${suffix}`
const memberPassword = 'MemberPass-2026!'
const adminUsername = 'anthony'
const adminPassword = 'admin123'
const replacementAdminPassword = 'AnthonyPass-2026!'
let secureSessionCookie = false

const member = session()
const otherMember = session()
const admin = session()

await session().request('/api/auth/signup', {
  method: 'POST',
  body: { username: 'ab', password: memberPassword },
  expectedStatus: 400,
})

await member.request('/api/auth/signup', {
  method: 'POST',
  body: {
    username: memberUsername,
    password: memberPassword,
  },
  expectedStatus: 201,
})

const preferences = await member.request('/api/account/preferences')
const updatedPreferences = {
  ...preferences.config,
  vehicleProfileId: 'model-s-awd',
  practicalRangeMiles: 305,
  manualPracticalRange: false,
  tripPace: 'savor',
}
await member.request('/api/account/preferences', {
  method: 'PUT',
  body: updatedPreferences,
})
const savedPreferences = await member.request('/api/account/preferences')
assert(savedPreferences.config.vehicleProfileId === 'model-s-awd', 'Vehicle preferences did not persist.')
assert(savedPreferences.config.tripPace === 'savor', 'Trip pace did not persist.')

const createdRoute = await member.request('/api/custom-routes', {
  method: 'POST',
  expectedStatus: 201,
  body: {
    name: 'Community Certification Route',
    targetDays: 47,
    startMonth: 1,
    directionPreference: 'seasonal',
    waypoints: [
      {
        id: 'landmark-az-grand-canyon',
        label: 'Grand Canyon',
        position: { lat: 36.1069, lon: -112.1129 },
        radiusMiles: 95,
      },
    ],
  },
})
const memberRoutes = await member.request('/api/custom-routes')
assert(memberRoutes.routes.length === 1, 'Member route was not saved.')

await otherMember.request('/api/auth/signup', {
  method: 'POST',
  expectedStatus: 409,
  body: {
    username: memberUsername.toUpperCase(),
    password: memberPassword,
  },
})
await otherMember.request('/api/auth/signup', {
  method: 'POST',
  expectedStatus: 201,
  body: {
    username: otherUsername,
    password: memberPassword,
  },
})
const otherRoutes = await otherMember.request('/api/custom-routes')
assert(otherRoutes.routes.length === 0, 'A second member could see another member’s routes.')

await member.request('/api/community/state-votes', {
  method: 'POST',
  body: { stateCode: 'CO', note: 'Coffee near Denver.' },
})
const suggestion = await member.request('/api/community/suggestions', {
  method: 'POST',
  expectedStatus: 201,
  body: {
    category: 'stop',
    stateCode: 'CO',
    title: 'Red Rocks at sunrise',
    body: 'Go before the crowds and use the west overlook before heading into Denver.',
  },
})
await member.request('/api/community/meetups', {
  method: 'POST',
  expectedStatus: 201,
  body: {
    stateCode: 'CO',
    city: 'Denver',
    proposedDay: 47,
    message: 'I am local and would love to buy Anthony coffee near the route.',
  },
})

await admin.request('/api/auth/login', {
  method: 'POST',
  body: { username: adminUsername, password: adminPassword },
})
await admin.request('/api/admin/community', { expectedStatus: 403 })
const passwordChange = await admin.request('/api/auth/change-password', {
  method: 'POST',
  body: {
    currentPassword: adminPassword,
    newPassword: replacementAdminPassword,
  },
})
assert(passwordChange.user.mustChangePassword === false, 'Admin password-change requirement did not clear.')

await admin.request('/api/admin/trip', {
  method: 'PUT',
  body: {
    active: false,
    title: "Anthony's ChargeQuest",
    routeName: 'Three routes remain',
    totalDays: 60,
    departureDate: '2026-09-01',
    headline: 'The route is still being built',
    body: 'The tracker is in pre-trip mode while route decisions are published.',
  },
})
const planningUpdate = await admin.request('/api/admin/trip-updates', {
  method: 'POST',
  expectedStatus: 201,
  body: {
    phase: 'route-decision',
    title: 'Route 66 made the final three',
    body: 'The route survived the first comparison and now needs a full CORE stress test.',
    artifactUrl: 'https://example.com/route-map',
    artifactLabel: 'Open the route comparison',
    artifactType: 'link',
  },
})
const preTripCommunity = await anonymousRequest('/api/community')
assert(preTripCommunity.trip.active === false, 'Publishing a planning entry incorrectly activated the live trip.')
assert(preTripCommunity.updates[0].phase === 'route-decision', 'Planning entry phase was not public.')

await admin.request(`/api/admin/trip-updates/${planningUpdate.id}`, {
  method: 'PATCH',
  body: {
    phase: 'route-decision',
    title: 'Route 66 stayed in the final three',
    body: 'The route survived the first comparison and now needs a full CORE stress test.',
    artifactUrl: 'https://example.com/route-map',
    artifactLabel: 'Open the route comparison',
    artifactType: 'link',
  },
})

await admin.request('/api/admin/trip', {
  method: 'PUT',
  body: {
    active: true,
    title: "Anthony's ChargeQuest",
    routeName: 'Great American Icons',
    dayNumber: 1,
    totalDays: 60,
    currentLocation: 'Chattanooga, Tennessee',
    headline: 'The quest is underway',
    body: 'Day one is live and the first community meetup is already waiting.',
  },
})
await admin.request('/api/admin/trip-updates', {
  method: 'POST',
  expectedStatus: 201,
  body: {
    phase: 'on-the-road',
    dayNumber: 1,
    location: 'Chattanooga, Tennessee',
    title: 'Rolling out',
    body: 'The first Supercharger stop is logged and the public tracker is working.',
    visiting: 'Downtown Chattanooga',
  },
})
const adminCommunity = await admin.request('/api/admin/community')
assert(adminCommunity.pendingMeetups.length === 1, 'Pending meetup did not reach admin moderation.')
assert(adminCommunity.suggestionInbox.some((item) => item.id === suggestion.id && item.review_status === 'pending'), 'Private suggestion did not reach the admin inbox.')
await admin.request(`/api/admin/suggestions/${suggestion.id}`, {
  method: 'PATCH',
  body: { status: 'reviewed' },
})
await admin.request(`/api/admin/meetups/${adminCommunity.pendingMeetups[0].id}`, {
  method: 'PATCH',
  body: { status: 'approved' },
})

const publicCommunity = await anonymousRequest('/api/community')
assert(publicCommunity.trip.active === true, 'Public tracker was not activated.')
assert(publicCommunity.updates.length === 2, 'Planning and on-road updates were not published.')
assert(publicCommunity.stateVotes.some((item) => item.state_code === 'CO'), 'State vote was not aggregated.')
assert(publicCommunity.suggestions.length === 0, 'Private suggestions leaked into the public response.')
assert(publicCommunity.meetups.length === 1, 'Approved meetup was not public.')

await member.request(`/api/custom-routes/${createdRoute.route.id}`, { method: 'DELETE' })
await member.request('/api/auth/logout', { method: 'POST' })
await member.request('/api/account', { expectedStatus: 401 })
assert(secureSessionCookie, 'Session cookie was missing HttpOnly or SameSite=Lax.')

console.log(
  JSON.stringify({
    firstPartySignup: true,
    usernameOnlyAccounts: true,
    usernameMinimumEnforced: true,
    usernameUniquenessIsCaseInsensitive: true,
    forcedAdminPasswordChange: true,
    secureSessionCookie,
    preferencesPersisted: true,
    routeOwnershipIsolated: true,
    stateVoteAggregated: true,
    suggestionDeliveredPrivately: true,
    suggestionReviewedByAdmin: true,
    meetupModerated: true,
    preTripPublishingDoesNotActivateLiveTracker: true,
    journeyEntryUpdated: true,
    anthonyTrackerPublished: true,
    logoutProtectedAccount: true,
  }),
)

function session() {
  let cookie = ''
  return {
    async request(path, options = {}) {
      const response = await fetch(`${apiUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      const setCookie = response.headers.get('set-cookie')
      if (setCookie) {
        cookie = setCookie.split(';')[0]
        secureSessionCookie =
          secureSessionCookie ||
          (/HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie))
      }
      const payload = await response.json()
      const expectedStatus = options.expectedStatus ?? 200
      if (response.status !== expectedStatus) {
        throw new Error(`${options.method ?? 'GET'} ${path} returned ${response.status}: ${JSON.stringify(payload)}`)
      }
      return payload
    },
  }
}

async function anonymousRequest(path) {
  const response = await fetch(`${apiUrl}${path}`)
  if (!response.ok) throw new Error(`GET ${path} returned ${response.status}`)
  return response.json()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
