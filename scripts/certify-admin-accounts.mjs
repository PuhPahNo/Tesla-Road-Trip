const apiUrl = process.env.API_URL ?? 'http://localhost:4191'
const admin = session()
const member = session()
const resetMember = session()
const adminPassword = 'admin123'
const replacementAdminPassword = 'AnthonyAdmin-2026!'
const memberPassword = 'RoadTrip-2026!'
const resetPassword = 'ResetRoad-2026!'
const finalPassword = 'FinalRoad-2026!'

await anonymousRequest('/api/admin/accounts', { expectedStatus: 401 })

await admin.request('/api/auth/login', {
  method: 'POST',
  body: { username: 'anthony', password: adminPassword },
})
await admin.request('/api/admin/accounts', { expectedStatus: 403 })
await admin.request('/api/auth/change-password', {
  method: 'POST',
  body: { currentPassword: adminPassword, newPassword: replacementAdminPassword },
})

let snapshot = await admin.request('/api/admin/accounts')
const anthony = snapshot.accounts.find((account) => account.username === 'anthony')
assert(anthony?.role === 'admin', 'The seeded Anthony account was not an admin.')

await admin.request(`/api/admin/accounts/${anthony.id}`, {
  method: 'PATCH',
  body: { role: 'member' },
  expectedStatus: 400,
})
await admin.request(`/api/admin/accounts/${anthony.id}`, {
  method: 'DELETE',
  expectedStatus: 400,
})
await admin.request(`/api/admin/accounts/${anthony.id}/reset-password`, {
  method: 'POST',
  body: { password: resetPassword },
  expectedStatus: 400,
})

snapshot = await admin.request('/api/admin/accounts', {
  method: 'POST',
  expectedStatus: 201,
  body: { username: 'roadtripper', password: memberPassword, role: 'member' },
})
let roadtripper = snapshot.accounts.find((account) => account.username === 'roadtripper')
assert(roadtripper?.mustChangePassword, 'A new account was not forced to change its temporary password.')

await member.request('/api/auth/login', {
  method: 'POST',
  body: { username: 'roadtripper', password: memberPassword },
})
await member.request('/api/account', { expectedStatus: 403 })
await member.request('/api/auth/change-password', {
  method: 'POST',
  body: { currentPassword: memberPassword, newPassword: finalPassword },
})
await member.request('/api/account')
await member.request('/api/admin/accounts', { expectedStatus: 403 })

snapshot = await admin.request(`/api/admin/accounts/${roadtripper.id}`, {
  method: 'PATCH',
  body: { username: 'routebuilder', role: 'admin' },
})
roadtripper = snapshot.accounts.find((account) => account.id === roadtripper.id)
assert(roadtripper?.username === 'routebuilder', 'Username change did not persist.')
assert(roadtripper?.role === 'admin', 'Admin upgrade did not persist.')

snapshot = await admin.request(`/api/admin/accounts/${roadtripper.id}`, {
  method: 'PATCH',
  body: { role: 'member' },
})
roadtripper = snapshot.accounts.find((account) => account.id === roadtripper.id)
assert(roadtripper?.role === 'member', 'Admin downgrade did not persist.')

await admin.request(`/api/admin/accounts/${roadtripper.id}/reset-password`, {
  method: 'POST',
  body: { password: resetPassword },
})
await member.request('/api/account', { expectedStatus: 401 })
await resetMember.request('/api/auth/login', {
  method: 'POST',
  body: { username: 'routebuilder', password: resetPassword },
})
await resetMember.request('/api/account', { expectedStatus: 403 })
await resetMember.request('/api/auth/change-password', {
  method: 'POST',
  body: { currentPassword: resetPassword, newPassword: finalPassword },
})

await admin.request(`/api/admin/accounts/${roadtripper.id}/revoke-sessions`, {
  method: 'POST',
})
await resetMember.request('/api/account', { expectedStatus: 401 })

snapshot = await admin.request(`/api/admin/accounts/${roadtripper.id}`, {
  method: 'DELETE',
})
assert(
  !snapshot.accounts.some((account) => account.id === roadtripper.id),
  'Deleted account remained in account management.',
)

const actions = new Set(snapshot.activity.map((item) => item.action))
for (const action of [
  'admin.account_created',
  'admin.account_updated',
  'admin.password_reset',
  'admin.sessions_revoked',
  'admin.account_deleted',
]) {
  assert(actions.has(action), `Audit activity is missing ${action}.`)
}
const deletedAudit = snapshot.activity.find((item) => item.action === 'admin.account_deleted')
assert(deletedAudit?.targetUsername === 'routebuilder', 'Deleted-account audit snapshot was not retained.')

snapshot = await admin.request(`/api/admin/accounts/${anthony.id}`, {
  method: 'PATCH',
  body: { username: 'captainanthony' },
})
assert(
  snapshot.accounts.some((account) => account.id === anthony.id && account.username === 'captainanthony'),
  'The active admin could not change their own username.',
)

console.log(JSON.stringify({
  adminRouteProtected: true,
  forcedPasswordChange: true,
  accountCreated: true,
  usernameChanged: true,
  roleUpgradedAndDowngraded: true,
  passwordReset: true,
  resetRevokedSessions: true,
  sessionsRevoked: true,
  accountDeleted: true,
  selfProtectionEnforced: true,
  activeAdminRenamed: true,
  activityAuditRetained: true,
}))

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
      if (setCookie) cookie = setCookie.split(';')[0]
      const payload = await response.json()
      const expectedStatus = options.expectedStatus ?? 200
      if (response.status !== expectedStatus) {
        throw new Error(`${options.method ?? 'GET'} ${path} returned ${response.status}: ${JSON.stringify(payload)}`)
      }
      return payload
    },
  }
}

async function anonymousRequest(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`)
  const payload = await response.json()
  const expectedStatus = options.expectedStatus ?? 200
  if (response.status !== expectedStatus) {
    throw new Error(`GET ${path} returned ${response.status}: ${JSON.stringify(payload)}`)
  }
  return payload
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
