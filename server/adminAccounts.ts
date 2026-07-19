import { randomUUID } from 'node:crypto'
import type { Express, Response } from 'express'
import { z } from 'zod'
import { logAccountActivity } from './accountActivity'
import {
  hashPassword,
  normalizeUsername,
  requireAdmin,
  type AuthUser,
  type UserRole,
} from './auth'
import { db, transaction } from './database'
import { readSavedCustomRoutes } from './customRoutes'

interface AccountRow {
  id: string
  username: string
  role: UserRole
  must_change_password: number
  created_at: string
  updated_at: string
  active_sessions: number
  route_count: number
  suggestion_count: number
  meetup_count: number
  state_vote_count: number
  achievement_count: number
  last_login_at?: string | null
}

const usernameSchema = z.string().trim().min(3).max(32).regex(
  /^[a-zA-Z0-9_-]+$/,
  'Username can only use letters, numbers, underscores, and hyphens.',
)
const passwordSchema = z.string().min(8).max(128)
const roleSchema = z.enum(['member', 'admin'])

const createAccountSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  role: roleSchema.default('member'),
})

const updateAccountSchema = z.object({
  username: usernameSchema.optional(),
  role: roleSchema.optional(),
}).refine((input) => input.username !== undefined || input.role !== undefined, {
  message: 'Choose a username or access-level change.',
})

const resetPasswordSchema = z.object({ password: passwordSchema })

export function registerAdminAccountRoutes(app: Express) {
  app.get('/api/admin/accounts', (request, response) => {
    const admin = requireAdmin(request, response)
    if (!admin) return
    response.json(readAdminAccounts(admin))
  })

  app.get('/api/admin/accounts/:id', (request, response) => {
    try {
      const admin = requireAdmin(request, response)
      if (!admin) return
      if (!findAccountById(request.params.id)) {
        response.status(404).json({ message: 'Account not found.' })
        return
      }
      response.json(readAdminAccountDetail(request.params.id, admin))
    } catch (error) {
      sendAdminError(response, error, 'Unable to load the account details.')
    }
  })

  app.post('/api/admin/accounts', async (request, response) => {
    try {
      const admin = requireAdmin(request, response)
      if (!admin) return
      const parsed = createAccountSchema.parse(request.body)
      const username = normalizeUsername(parsed.username)
      if (findAccount(username)) {
        response.status(409).json({ message: 'That username is already taken.' })
        return
      }

      const now = new Date().toISOString()
      const id = randomUUID()
      const passwordHash = await hashPassword(parsed.password)
      transaction(() => {
        db.prepare(`
          INSERT INTO users (
            id, username, password_hash, role, must_change_password, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 1, ?, ?)
        `).run(id, username, passwordHash, parsed.role, now, now)
        logAccountActivity({
          actor: admin,
          target: { id, username },
          action: 'admin.account_created',
          details: { role: parsed.role, passwordChangeRequired: true },
        })
      })
      response.status(201).json(readAdminAccounts(admin))
    } catch (error) {
      sendAdminError(response, error, 'Unable to create the account.')
    }
  })

  app.patch('/api/admin/accounts/:id', (request, response) => {
    try {
      const admin = requireAdmin(request, response)
      if (!admin) return
      const account = findAccountById(request.params.id)
      if (!account) {
        response.status(404).json({ message: 'Account not found.' })
        return
      }
      const parsed = updateAccountSchema.parse(request.body)
      const nextUsername = parsed.username
        ? normalizeUsername(parsed.username)
        : account.username
      const nextRole = parsed.role ?? account.role
      if (account.id === admin.id && nextRole !== 'admin') {
        response.status(400).json({ message: 'You cannot remove your own admin access.' })
        return
      }
      const usernameOwner = findAccount(nextUsername)
      if (usernameOwner && usernameOwner.id !== account.id) {
        response.status(409).json({ message: 'That username is already taken.' })
        return
      }
      if (account.role === 'admin' && nextRole === 'member' && countAdmins() <= 1) {
        response.status(400).json({ message: 'ChargeQuest must keep at least one admin.' })
        return
      }

      const now = new Date().toISOString()
      transaction(() => {
        db.prepare(`
          UPDATE users SET username = ?, role = ?, updated_at = ? WHERE id = ?
        `).run(nextUsername, nextRole, now, account.id)
        logAccountActivity({
          actor: admin,
          target: { id: account.id, username: nextUsername },
          action: 'admin.account_updated',
          details: {
            previousUsername: account.username,
            username: nextUsername,
            previousRole: account.role,
            role: nextRole,
          },
        })
      })
      response.json(readAdminAccounts(admin))
    } catch (error) {
      sendAdminError(response, error, 'Unable to update the account.')
    }
  })

  app.post('/api/admin/accounts/:id/reset-password', async (request, response) => {
    try {
      const admin = requireAdmin(request, response)
      if (!admin) return
      const account = findAccountById(request.params.id)
      if (!account) {
        response.status(404).json({ message: 'Account not found.' })
        return
      }
      if (account.id === admin.id) {
        response.status(400).json({ message: 'Use your account page to change your own password.' })
        return
      }
      const parsed = resetPasswordSchema.parse(request.body)
      const passwordHash = await hashPassword(parsed.password)
      transaction(() => {
        db.prepare(`
          UPDATE users
          SET password_hash = ?, must_change_password = 1, updated_at = ?
          WHERE id = ?
        `).run(passwordHash, new Date().toISOString(), account.id)
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(account.id)
        logAccountActivity({
          actor: admin,
          target: account,
          action: 'admin.password_reset',
          details: { sessionsRevoked: true, passwordChangeRequired: true },
        })
      })
      response.json(readAdminAccounts(admin))
    } catch (error) {
      sendAdminError(response, error, 'Unable to reset the password.')
    }
  })

  app.post('/api/admin/accounts/:id/revoke-sessions', (request, response) => {
    try {
      const admin = requireAdmin(request, response)
      if (!admin) return
      const account = findAccountById(request.params.id)
      if (!account) {
        response.status(404).json({ message: 'Account not found.' })
        return
      }
      if (account.id === admin.id) {
        response.status(400).json({ message: 'You cannot revoke the session you are using.' })
        return
      }
      const revoked = Number(
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(account.id).changes,
      )
      logAccountActivity({
        actor: admin,
        target: account,
        action: 'admin.sessions_revoked',
        details: { revoked },
      })
      response.json(readAdminAccounts(admin))
    } catch (error) {
      sendAdminError(response, error, 'Unable to revoke sessions.')
    }
  })

  app.delete('/api/admin/accounts/:id', (request, response) => {
    try {
      const admin = requireAdmin(request, response)
      if (!admin) return
      const account = findAccountById(request.params.id)
      if (!account) {
        response.status(404).json({ message: 'Account not found.' })
        return
      }
      if (account.id === admin.id) {
        response.status(400).json({ message: 'You cannot delete the account you are using.' })
        return
      }
      if (account.role === 'admin' && countAdmins() <= 1) {
        response.status(400).json({ message: 'ChargeQuest must keep at least one admin.' })
        return
      }

      transaction(() => {
        logAccountActivity({
          actor: admin,
          target: account,
          action: 'admin.account_deleted',
          details: { role: account.role },
        })
        db.prepare('DELETE FROM users WHERE id = ?').run(account.id)
      })
      response.json(readAdminAccounts(admin))
    } catch (error) {
      sendAdminError(response, error, 'Unable to delete the account.')
    }
  })
}

function readAdminAccounts(viewer: AuthUser) {
  const accounts = db.prepare(`
    SELECT
      users.id,
      users.username,
      users.role,
      users.must_change_password,
      users.created_at,
      users.updated_at,
      (SELECT COUNT(*) FROM sessions WHERE sessions.user_id = users.id) AS active_sessions,
      (SELECT COUNT(*) FROM custom_routes WHERE custom_routes.user_id = users.id) AS route_count,
      (SELECT COUNT(*) FROM suggestions WHERE suggestions.user_id = users.id) AS suggestion_count,
      (SELECT COUNT(*) FROM meetup_invites WHERE meetup_invites.user_id = users.id) AS meetup_count,
      (SELECT COUNT(*) FROM state_votes WHERE state_votes.user_id = users.id) AS state_vote_count,
      (SELECT COUNT(*) FROM achievements WHERE achievements.user_id = users.id) AS achievement_count,
      (
        SELECT MAX(created_at) FROM account_activity
        WHERE account_activity.target_user_id = users.id
          AND account_activity.action = 'auth.login'
      ) AS last_login_at
    FROM users
    ORDER BY CASE users.role WHEN 'admin' THEN 0 ELSE 1 END,
      users.username COLLATE NOCASE ASC
  `).all() as unknown as AccountRow[]

  const activity = (db.prepare(`
    SELECT
      id, actor_user_id, actor_username, target_user_id, target_username,
      action, details_json, created_at
    FROM account_activity
    ORDER BY created_at DESC
    LIMIT 100
  `).all() as unknown as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id),
    actorUserId: item.actor_user_id ? String(item.actor_user_id) : null,
    actorUsername: String(item.actor_username),
    targetUserId: item.target_user_id ? String(item.target_user_id) : null,
    targetUsername: item.target_username ? String(item.target_username) : null,
    action: String(item.action),
    details: parseDetails(item.details_json),
    createdAt: String(item.created_at),
  }))

  return {
    viewerId: viewer.id,
    accounts: accounts.map((account) => ({
      id: account.id,
      username: account.username,
      role: account.role,
      mustChangePassword: Boolean(account.must_change_password),
      createdAt: account.created_at,
      updatedAt: account.updated_at,
      lastLoginAt: account.last_login_at ?? null,
      activeSessions: Number(account.active_sessions),
      routeCount: Number(account.route_count),
      suggestionCount: Number(account.suggestion_count),
      meetupCount: Number(account.meetup_count),
      stateVoteCount: Number(account.state_vote_count),
      achievementCount: Number(account.achievement_count),
    })),
    activity,
  }
}

function readAdminAccountDetail(id: string, viewer: AuthUser) {
  const account = readAdminAccounts(viewer).accounts.find((item) => item.id === id)
  if (!account) throw new Error('Account not found.')

  const preferences = db.prepare(`
    SELECT config_json, updated_at FROM user_preferences WHERE user_id = ?
  `).get(id) as unknown as { config_json: string; updated_at: string } | undefined

  const activity = (db.prepare(`
    SELECT
      id, actor_user_id, actor_username, target_user_id, target_username,
      action, details_json, created_at
    FROM account_activity
    WHERE target_user_id = ? OR actor_user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(id, id) as unknown as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id),
    actorUserId: item.actor_user_id ? String(item.actor_user_id) : null,
    actorUsername: String(item.actor_username),
    targetUserId: item.target_user_id ? String(item.target_user_id) : null,
    targetUsername: item.target_username ? String(item.target_username) : null,
    action: String(item.action),
    details: parseDetails(item.details_json),
    createdAt: String(item.created_at),
  }))

  return {
    account,
    routes: readSavedCustomRoutes(id),
    preferences: preferences
      ? {
          config: JSON.parse(preferences.config_json) as Record<string, unknown>,
          updatedAt: preferences.updated_at,
        }
      : null,
    suggestions: db.prepare(`
      SELECT id, category, title, body, state_code, review_status, created_at, updated_at
      FROM suggestions WHERE user_id = ? ORDER BY created_at DESC
    `).all(id),
    meetups: db.prepare(`
      SELECT id, state_code, city, proposed_day, message, status, created_at, updated_at
      FROM meetup_invites WHERE user_id = ? ORDER BY created_at DESC
    `).all(id),
    stateVotes: db.prepare(`
      SELECT state_code, note, updated_at
      FROM state_votes WHERE user_id = ? ORDER BY updated_at DESC
    `).all(id),
    achievements: db.prepare(`
      SELECT id, title, description, route_name, created_at
      FROM achievements WHERE user_id = ? ORDER BY created_at DESC
    `).all(id),
    activity,
  }
}

function findAccount(username: string) {
  return db.prepare(`
    SELECT id, username, role FROM users WHERE username = ?
  `).get(username) as unknown as { id: string; username: string; role: UserRole } | undefined
}

function findAccountById(id: string) {
  return db.prepare(`
    SELECT id, username, role FROM users WHERE id = ?
  `).get(id) as unknown as { id: string; username: string; role: UserRole } | undefined
}

function countAdmins() {
  return Number(
    (db.prepare(`SELECT COUNT(*) AS count FROM users WHERE role = 'admin'`)
      .get() as unknown as { count: number }).count,
  )
}

function parseDetails(value: unknown) {
  if (!value) return null
  try {
    return JSON.parse(String(value)) as Record<string, unknown>
  } catch {
    return null
  }
}

function sendAdminError(response: Response, error: unknown, fallback: string) {
  const status = error instanceof z.ZodError ? 400 : 500
  response.status(status).json({
    message: error instanceof Error ? error.message : fallback,
  })
}
