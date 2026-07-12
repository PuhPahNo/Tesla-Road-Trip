import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'
import type { Express, Request, Response } from 'express'
import { z } from 'zod'
import { logAccountActivity } from './accountActivity'
import { db } from './database'

const SESSION_COOKIE = 'cq_session'
const SESSION_DAYS = 30
const MAX_AUTH_ATTEMPTS = 12
const AUTH_WINDOW_MS = 15 * 60 * 1000
const ANTHONY_USERNAME = 'anthony'
const ANTHONY_TEMPORARY_PASSWORD = 'admin123'
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  length: number,
) => Promise<Buffer>

export type UserRole = 'member' | 'admin'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  mustChangePassword: boolean
  createdAt: string
}

interface UserRow {
  id: string
  username: string
  password_hash: string
  role: UserRole
  must_change_password: number
  created_at: string
}

interface SessionUserRow extends UserRow {
  expires_at: string
}

const authSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only use letters, numbers, underscores, and hyphens.',
  ),
  password: z.string().min(8).max(128),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
})

const attempts = new Map<string, number[]>()

export function registerAuthRoutes(app: Express) {
  app.get('/api/auth/session', (request, response) => {
    response.json({ user: getRequestUser(request) })
  })

  app.post('/api/auth/signup', async (request, response) => {
    try {
      enforceAuthRateLimit(request)
      const parsed = authSchema.parse(request.body)
      const username = normalizeUsername(parsed.username)
      if (findUserByUsername(username)) {
        response.status(409).json({ message: 'That username is already taken.' })
        return
      }

      const now = new Date().toISOString()
      const userId = randomUUID()
      const passwordHash = await hashPassword(parsed.password)
      db.prepare(`
        INSERT INTO users (
          id, username, password_hash, role, must_change_password, created_at, updated_at
        ) VALUES (?, ?, ?, 'member', 0, ?, ?)
      `).run(userId, username, passwordHash, now, now)

      const user = findUserById(userId)
      if (!user) throw new Error('Unable to create account.')
      logAccountActivity({
        actor: user,
        target: user,
        action: 'auth.signup',
      })
      createSession(response, user.id)
      response.status(201).json({ user: toAuthUser(user) })
    } catch (error) {
      sendAuthError(response, error, 'Unable to create account.')
    }
  })

  app.post('/api/auth/login', async (request, response) => {
    try {
      enforceAuthRateLimit(request)
      const parsed = authSchema.parse(request.body)
      const user = findUserByUsername(normalizeUsername(parsed.username))
      if (!user || !(await verifyPassword(parsed.password, user.password_hash))) {
        response.status(401).json({ message: 'Username or password is incorrect.' })
        return
      }

      logAccountActivity({ actor: user, target: user, action: 'auth.login' })
      createSession(response, user.id)
      response.json({ user: toAuthUser(user) })
    } catch (error) {
      sendAuthError(response, error, 'Unable to sign in.')
    }
  })

  app.post('/api/auth/logout', (request, response) => {
    const user = getRequestUser(request)
    const token = readCookie(request, SESSION_COOKIE)
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
    }
    if (user) {
      logAccountActivity({ actor: user, target: user, action: 'auth.logout' })
    }
    clearSessionCookie(response)
    response.json({ ok: true })
  })

  app.post('/api/auth/change-password', async (request, response) => {
    try {
      enforceAuthRateLimit(request)
      const user = requireUser(request, response, { allowPasswordChange: true })
      if (!user) return
      const parsed = changePasswordSchema.parse(request.body)
      const stored = findUserById(user.id)
      if (
        !stored ||
        !(await verifyPassword(parsed.currentPassword, stored.password_hash))
      ) {
        response.status(400).json({ message: 'Current password is incorrect.' })
        return
      }

      const now = new Date().toISOString()
      db.prepare(`
        UPDATE users
        SET password_hash = ?, must_change_password = 0, updated_at = ?
        WHERE id = ?
      `).run(await hashPassword(parsed.newPassword), now, user.id)
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id)
      createSession(response, user.id)
      const updated = findUserById(user.id)
      if (!updated) throw new Error('Unable to reload account.')
      logAccountActivity({
        actor: updated,
        target: updated,
        action: 'auth.password_changed',
      })
      response.json({ ok: true, user: toAuthUser(updated) })
    } catch (error) {
      sendAuthError(response, error, 'Unable to change password.')
    }
  })
}

export async function ensureAnthonyAdmin() {
  const existing = findUserByUsername(ANTHONY_USERNAME)
  const now = new Date().toISOString()
  if (existing) {
    db.prepare(`UPDATE users SET role = 'admin', updated_at = ? WHERE id = ?`).run(
      now,
      existing.id,
    )
    return toAuthUser({ ...existing, role: 'admin' })
  }

  // Once an installation already has an administrator, treat that account as
  // the durable owner even if its username was changed in account management.
  // The well-known Anthony login is only a bootstrap for a brand-new database.
  const existingAdmin = db.prepare(`
    SELECT id, username, password_hash, role, must_change_password, created_at
    FROM users
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1
  `).get() as unknown as UserRow | undefined
  if (existingAdmin) return toAuthUser(existingAdmin)

  const userId = randomUUID()
  db.prepare(`
    INSERT INTO users (
      id, username, password_hash, role, must_change_password, created_at, updated_at
    ) VALUES (?, ?, ?, 'admin', 1, ?, ?)
  `).run(
    userId,
    ANTHONY_USERNAME,
    await hashPassword(ANTHONY_TEMPORARY_PASSWORD),
    now,
    now,
  )
  const created = findUserById(userId)
  if (!created) throw new Error('Unable to seed the Anthony admin account.')
  return toAuthUser(created)
}

export function getRequestUser(request: Request): AuthUser | undefined {
  const token = readCookie(request, SESSION_COOKIE)
  if (!token) return undefined
  const now = new Date().toISOString()
  const row = db.prepare(`
    SELECT
      users.id,
      users.username,
      users.password_hash,
      users.role,
      users.must_change_password,
      users.created_at,
      sessions.expires_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), now) as unknown as SessionUserRow | undefined
  if (!row) return undefined
  return toAuthUser(row)
}

export function requireUser(
  request: Request,
  response: Response,
  options: { allowPasswordChange?: boolean } = {},
) {
  const user = getRequestUser(request)
  if (!user) {
    response.status(401).json({ message: 'Sign in to continue.' })
    return undefined
  }
  if (user.mustChangePassword && !options.allowPasswordChange) {
    response.status(403).json({ message: 'Change your temporary password to continue.' })
    return undefined
  }
  return user
}

export function requireAdmin(request: Request, response: Response) {
  const user = requireUser(request, response)
  if (!user) return undefined
  if (user.role !== 'admin') {
    response.status(403).json({ message: 'Anthony admin access is required.' })
    return undefined
  }
  return user
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptAsync(password, salt, 64)
  return `scrypt$${salt}$${hash.toString('hex')}`
}

async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, hashHex] = encoded.split('$')
  if (algorithm !== 'scrypt' || !salt || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptAsync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function createSession(response: Response, userId: string) {
  const token = randomBytes(32).toString('base64url')
  const createdAt = new Date()
  const expiresAt = new Date(
    createdAt.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  )
  db.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(
    hashToken(token),
    userId,
    expiresAt.toISOString(),
    createdAt.toISOString(),
  )
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(
    createdAt.toISOString(),
  )
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(process.env.RENDER || process.env.NODE_ENV === 'production'),
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(process.env.RENDER || process.env.NODE_ENV === 'production'),
    path: '/',
  })
}

function readCookie(request: Request, name: string) {
  const header = request.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...valueParts] = part.trim().split('=')
    if (key === name) return decodeURIComponent(valueParts.join('='))
  }
  return undefined
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function findUserByUsername(username: string) {
  return db.prepare(`
    SELECT id, username, password_hash, role, must_change_password, created_at
    FROM users WHERE username = ?
  `).get(username) as unknown as UserRow | undefined
}

function findUserById(id: string) {
  return db.prepare(`
    SELECT id, username, password_hash, role, must_change_password, created_at
    FROM users WHERE id = ?
  `).get(id) as unknown as UserRow | undefined
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at,
  }
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function enforceAuthRateLimit(request: Request) {
  const key = request.ip || request.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const recent = (attempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < AUTH_WINDOW_MS,
  )
  if (recent.length >= MAX_AUTH_ATTEMPTS) {
    const error = new Error('Too many sign-in attempts. Try again in a few minutes.')
    Object.assign(error, { status: 429 })
    throw error
  }
  recent.push(now)
  attempts.set(key, recent)
}

function sendAuthError(response: Response, error: unknown, fallback: string) {
  const status =
    error instanceof z.ZodError
      ? 400
      : typeof error === 'object' && error && 'status' in error
        ? Number(error.status)
        : 500
  response.status(status).json({
    message: error instanceof Error ? error.message : fallback,
  })
}
