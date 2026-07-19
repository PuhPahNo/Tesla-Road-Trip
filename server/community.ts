import { randomUUID } from 'node:crypto'
import type { Express, Response } from 'express'
import { z } from 'zod'
import { defaultPlannerConfig, plannerConfigSchema } from '../src/domain/config'
import { STATE_CODE_TO_NAME } from '../src/domain/usStates'
import { getRequestUser, requireAdmin, requireUser } from './auth'
import { db } from './database'

const STATE_CODES = Object.keys(STATE_CODE_TO_NAME)

const stateCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => STATE_CODES.includes(value), 'Choose a valid U.S. state.')

const stateVoteSchema = z.object({
  stateCode: stateCodeSchema,
  note: z.string().trim().max(240).optional(),
})

const meetupSchema = z.object({
  stateCode: stateCodeSchema,
  city: z.string().trim().min(2).max(80),
  proposedDay: z.coerce.number().int().min(1).max(365).optional(),
  message: z.string().trim().min(10).max(600),
})

const suggestionSchema = z.object({
  category: z.enum(['stop', 'food', 'scenery', 'charging', 'route', 'other']),
  title: z.string().trim().min(3).max(100),
  body: z.string().trim().min(10).max(800),
  stateCode: stateCodeSchema.optional(),
})

const achievementSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(5).max(500),
  routeName: z.string().trim().max(100).optional(),
})

const tripSchema = z.object({
  active: z.boolean(),
  title: z.string().trim().min(3).max(100),
  routeName: z.string().trim().max(100).optional().nullable(),
  dayNumber: z.coerce.number().int().min(1).max(365).optional().nullable(),
  totalDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  currentLocation: z.string().trim().max(120).optional().nullable(),
  headline: z.string().trim().max(160).optional().nullable(),
  body: z.string().trim().max(1200).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

const updateSchema = z.object({
  phase: z.enum(['planning', 'route-decision', 'build-note', 'milestone', 'on-the-road']),
  dayNumber: z.coerce.number().int().min(1).max(365).optional(),
  location: z.string().trim().max(120).optional(),
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(10).max(4000),
  visiting: z.string().trim().max(240).optional(),
  artifactUrl: z.string().trim().url().max(500).optional(),
  artifactLabel: z.string().trim().max(120).optional(),
  artifactType: z.enum(['image', 'video', 'link']).optional(),
})

const moderationSchema = z.object({
  status: z.enum(['approved', 'declined']),
})

const suggestionReviewSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'archived']),
})

export function registerCommunityRoutes(app: Express) {
  app.get('/api/community', (_request, response) => {
    response.json(readCommunity())
  })

  app.get('/api/account', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    response.json({
      user,
      routeCount: Number(
        (db.prepare('SELECT COUNT(*) AS count FROM custom_routes WHERE user_id = ?')
          .get(user.id) as unknown as { count: number }).count,
      ),
      achievements: readAchievements(user.id),
      suggestions: db.prepare(`
        SELECT id, category, title, body, state_code, status, created_at
        FROM suggestions WHERE user_id = ? ORDER BY created_at DESC
      `).all(user.id),
      meetups: db.prepare(`
        SELECT id, state_code, city, proposed_day, message, status, created_at
        FROM meetup_invites WHERE user_id = ? ORDER BY created_at DESC
      `).all(user.id),
      stateVotes: db.prepare(`
        SELECT state_code, note, updated_at
        FROM state_votes WHERE user_id = ? ORDER BY updated_at DESC
      `).all(user.id),
    })
  })

  app.get('/api/account/preferences', (request, response) => {
    const user = getRequestUser(request)
    if (!user) {
      response.json({ authenticated: false, config: defaultPlannerConfig })
      return
    }
    const row = db.prepare(`
      SELECT config_json FROM user_preferences WHERE user_id = ?
    `).get(user.id) as unknown as { config_json: string } | undefined
    const config = row
      ? plannerConfigSchema.parse(JSON.parse(row.config_json))
      : defaultPlannerConfig
    response.json({ authenticated: true, config })
  })

  app.put('/api/account/preferences', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const parsed = plannerConfigSchema.parse({
        ...defaultPlannerConfig,
        ...request.body,
        savedCustomRoutes: [],
      })
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO user_preferences (user_id, config_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          config_json = excluded.config_json,
          updated_at = excluded.updated_at
      `).run(user.id, JSON.stringify({ ...parsed, savedCustomRoutes: [] }), now)
      response.json({ ok: true, config: parsed })
    } catch (error) {
      sendError(response, error, 'Unable to save preferences.')
    }
  })

  app.post('/api/community/state-votes', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const parsed = stateVoteSchema.parse(request.body)
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO state_votes (user_id, state_code, note, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, state_code) DO UPDATE SET
          note = excluded.note,
          updated_at = excluded.updated_at
      `).run(user.id, parsed.stateCode, parsed.note ?? null, now)
      response.json({ ok: true, community: readCommunity() })
    } catch (error) {
      sendError(response, error, 'Unable to add your state vote.')
    }
  })

  app.delete('/api/community/state-votes/:stateCode', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const stateCode = stateCodeSchema.parse(request.params.stateCode)
      db.prepare(`
        DELETE FROM state_votes WHERE user_id = ? AND state_code = ?
      `).run(user.id, stateCode)
      response.json({ ok: true, community: readCommunity() })
    } catch (error) {
      sendError(response, error, 'Unable to remove your state vote.')
    }
  })

  app.post('/api/community/meetups', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const parsed = meetupSchema.parse(request.body)
      assertPendingMeetupLimit(user.id)
      const now = new Date().toISOString()
      const id = randomUUID()
      db.prepare(`
        INSERT INTO meetup_invites (
          id, user_id, state_code, city, proposed_day, message,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(
        id,
        user.id,
        parsed.stateCode,
        parsed.city,
        parsed.proposedDay ?? null,
        parsed.message,
        now,
        now,
      )
      response.status(201).json({
        ok: true,
        message: 'Your invite is waiting for Anthony to review it.',
        id,
      })
    } catch (error) {
      sendError(response, error, 'Unable to send your meetup invite.')
    }
  })

  app.post('/api/community/suggestions', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const parsed = suggestionSchema.parse(request.body)
      assertDailyPostLimit('suggestions', user.id, 10)
      const now = new Date().toISOString()
      const id = randomUUID()
      db.prepare(`
        INSERT INTO suggestions (
          id, user_id, category, title, body, state_code,
          status, review_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'hidden', 'pending', ?, ?)
      `).run(
        id,
        user.id,
        parsed.category,
        parsed.title,
        parsed.body,
        parsed.stateCode ?? null,
        now,
        now,
      )
      response.status(201).json({ ok: true, id, community: readCommunity() })
    } catch (error) {
      sendError(response, error, 'Unable to share your suggestion.')
    }
  })

  app.post('/api/community/suggestions/:id/vote', (request, response) => {
    const user = requireUser(request, response)
    if (!user) return
    const suggestion = db.prepare(`
      SELECT id FROM suggestions WHERE id = ? AND status = 'published'
    `).get(request.params.id)
    if (!suggestion) {
      response.status(404).json({ message: 'Suggestion not found.' })
      return
    }
    const existing = db.prepare(`
      SELECT 1 FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?
    `).get(request.params.id, user.id)
    if (existing) {
      db.prepare(`
        DELETE FROM suggestion_votes WHERE suggestion_id = ? AND user_id = ?
      `).run(request.params.id, user.id)
    } else {
      db.prepare(`
        INSERT INTO suggestion_votes (suggestion_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).run(request.params.id, user.id, new Date().toISOString())
    }
    response.json({ ok: true, community: readCommunity() })
  })

  app.post('/api/community/achievements', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const parsed = achievementSchema.parse(request.body)
      assertDailyPostLimit('achievements', user.id, 10)
      const id = randomUUID()
      db.prepare(`
        INSERT INTO achievements (
          id, user_id, title, description, route_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        user.id,
        parsed.title,
        parsed.description,
        parsed.routeName ?? null,
        new Date().toISOString(),
      )
      response.status(201).json({ ok: true, id })
    } catch (error) {
      sendError(response, error, 'Unable to share your achievement.')
    }
  })

  app.get('/api/admin/community', (request, response) => {
    if (!requireAdmin(request, response)) return
    response.json({
      community: readCommunity(),
      pendingMeetups: db.prepare(`
        SELECT
          meetup_invites.id,
          meetup_invites.state_code,
          meetup_invites.city,
          meetup_invites.proposed_day,
          meetup_invites.message,
          meetup_invites.status,
          meetup_invites.created_at,
          users.username AS display_name
        FROM meetup_invites
        JOIN users ON users.id = meetup_invites.user_id
        WHERE meetup_invites.status = 'pending'
        ORDER BY meetup_invites.created_at DESC
      `).all(),
      suggestionInbox: db.prepare(`
        SELECT
          suggestions.id,
          suggestions.category,
          suggestions.title,
          suggestions.body,
          suggestions.state_code,
          suggestions.review_status,
          suggestions.created_at,
          suggestions.updated_at,
          users.username AS display_name
        FROM suggestions
        JOIN users ON users.id = suggestions.user_id
        ORDER BY
          CASE suggestions.review_status
            WHEN 'pending' THEN 0
            WHEN 'reviewed' THEN 1
            ELSE 2
          END,
          suggestions.created_at DESC
        LIMIT 200
      `).all(),
    })
  })

  app.put('/api/admin/trip', (request, response) => {
    try {
      if (!requireAdmin(request, response)) return
      const parsed = tripSchema.parse(request.body)
      const now = new Date().toISOString()
      db.prepare(`
        UPDATE anthony_trip SET
          active = ?,
          title = ?,
          route_name = ?,
          day_number = ?,
          total_days = ?,
          current_location = ?,
          headline = ?,
          body = ?,
          latitude = ?,
          longitude = ?,
          started_at = ?,
          departure_date = ?,
          updated_at = ?
        WHERE id = 1
      `).run(
        parsed.active ? 1 : 0,
        parsed.title,
        parsed.routeName ?? null,
        parsed.dayNumber ?? null,
        parsed.totalDays ?? null,
        parsed.currentLocation ?? null,
        parsed.headline ?? null,
        parsed.body ?? null,
        parsed.latitude ?? null,
        parsed.longitude ?? null,
        parsed.startedAt ?? null,
        parsed.departureDate ?? null,
        now,
      )
      response.json({ ok: true, community: readCommunity() })
    } catch (error) {
      sendError(response, error, 'Unable to update Anthony’s trip.')
    }
  })

  app.post('/api/admin/trip-updates', (request, response) => {
    try {
      if (!requireAdmin(request, response)) return
      const parsed = updateSchema.parse(request.body)
      const id = randomUUID()
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO trip_updates (
          id, day_number, location, title, body, visiting, phase,
          artifact_url, artifact_label, artifact_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        parsed.dayNumber ?? null,
        parsed.location || 'Pre-trip',
        parsed.title,
        parsed.body,
        parsed.visiting ?? null,
        parsed.phase,
        parsed.artifactUrl ?? null,
        parsed.artifactLabel ?? null,
        parsed.artifactType ?? null,
        now,
        now,
      )
      db.prepare(`
        UPDATE anthony_trip SET
          day_number = COALESCE(?, day_number),
          current_location = ?,
          headline = ?,
          body = ?,
          updated_at = ?
        WHERE id = 1
      `).run(parsed.dayNumber ?? null, parsed.location ?? null, parsed.title, parsed.body, now)
      response.status(201).json({ ok: true, id, community: readCommunity() })
    } catch (error) {
      sendError(response, error, 'Unable to publish the trip update.')
    }
  })

  app.patch('/api/admin/trip-updates/:id', (request, response) => {
    try {
      if (!requireAdmin(request, response)) return
      const parsed = updateSchema.parse(request.body)
      const now = new Date().toISOString()
      const result = db.prepare(`
        UPDATE trip_updates SET
          day_number = ?, location = ?, title = ?, body = ?, visiting = ?,
          phase = ?, artifact_url = ?, artifact_label = ?, artifact_type = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        parsed.dayNumber ?? null,
        parsed.location || 'Pre-trip',
        parsed.title,
        parsed.body,
        parsed.visiting ?? null,
        parsed.phase,
        parsed.artifactUrl ?? null,
        parsed.artifactLabel ?? null,
        parsed.artifactType ?? null,
        now,
        request.params.id,
      )
      if (result.changes === 0) {
        response.status(404).json({ message: 'Journey update not found.' })
        return
      }
      response.json({ ok: true, community: readCommunity() })
    } catch (error) {
      sendError(response, error, 'Unable to update the journey entry.')
    }
  })

  app.delete('/api/admin/trip-updates/:id', (request, response) => {
    if (!requireAdmin(request, response)) return
    const result = db.prepare('DELETE FROM trip_updates WHERE id = ?').run(request.params.id)
    if (result.changes === 0) {
      response.status(404).json({ message: 'Journey update not found.' })
      return
    }
    response.json({ ok: true, community: readCommunity() })
  })

  app.patch('/api/admin/suggestions/:id', (request, response) => {
    try {
      if (!requireAdmin(request, response)) return
      const parsed = suggestionReviewSchema.parse(request.body)
      const result = db.prepare(`
        UPDATE suggestions SET review_status = ?, updated_at = ? WHERE id = ?
      `).run(parsed.status, new Date().toISOString(), request.params.id)
      if (result.changes === 0) {
        response.status(404).json({ message: 'Suggestion not found.' })
        return
      }
      response.json({ ok: true })
    } catch (error) {
      sendError(response, error, 'Unable to update the suggestion.')
    }
  })

  app.delete('/api/admin/suggestions/:id', (request, response) => {
    if (!requireAdmin(request, response)) return
    const result = db.prepare('DELETE FROM suggestions WHERE id = ?').run(request.params.id)
    if (result.changes === 0) {
      response.status(404).json({ message: 'Suggestion not found.' })
      return
    }
    response.json({ ok: true })
  })

  app.patch('/api/admin/meetups/:id', (request, response) => {
    try {
      if (!requireAdmin(request, response)) return
      const parsed = moderationSchema.parse(request.body)
      const result = db.prepare(`
        UPDATE meetup_invites SET status = ?, updated_at = ? WHERE id = ?
      `).run(parsed.status, new Date().toISOString(), request.params.id)
      if (result.changes === 0) {
        response.status(404).json({ message: 'Meetup invite not found.' })
        return
      }
      response.json({ ok: true })
    } catch (error) {
      sendError(response, error, 'Unable to moderate the meetup invite.')
    }
  })
}

function readCommunity() {
  const trip = db.prepare('SELECT * FROM anthony_trip WHERE id = 1').get() as
    | Record<string, unknown>
    | undefined
  const updates = db.prepare(`
    SELECT id, day_number, location, title, body, visiting, phase,
      artifact_url, artifact_label, artifact_type, created_at, updated_at
    FROM trip_updates ORDER BY created_at DESC LIMIT 50
  `).all()
  const stateVotes = db.prepare(`
    SELECT state_code, COUNT(*) AS votes
    FROM state_votes GROUP BY state_code ORDER BY votes DESC, state_code ASC
  `).all()
  const meetups = db.prepare(`
    SELECT
      meetup_invites.id,
      meetup_invites.state_code,
      meetup_invites.city,
      meetup_invites.proposed_day,
      meetup_invites.message,
      meetup_invites.created_at,
      users.username AS display_name
    FROM meetup_invites
    JOIN users ON users.id = meetup_invites.user_id
    WHERE meetup_invites.status = 'approved'
    ORDER BY meetup_invites.created_at DESC
    LIMIT 30
  `).all()
  const achievements = db.prepare(`
    SELECT
      achievements.id,
      achievements.title,
      achievements.description,
      achievements.route_name,
      achievements.created_at,
      users.username AS display_name
    FROM achievements
    JOIN users ON users.id = achievements.user_id
    ORDER BY achievements.created_at DESC
    LIMIT 20
  `).all()

  return {
    trip: trip
      ? {
          active: Boolean(trip.active),
          title: trip.title,
          routeName: trip.route_name,
          dayNumber: trip.day_number,
          totalDays: trip.total_days,
          currentLocation: trip.current_location,
          headline: trip.headline,
          body: trip.body,
          latitude: trip.latitude,
          longitude: trip.longitude,
          startedAt: trip.started_at,
          departureDate: trip.departure_date,
          updatedAt: trip.updated_at,
        }
      : undefined,
    updates,
    stateVotes,
    meetups,
    suggestions: [],
    achievements,
  }
}

function readAchievements(userId: string) {
  return db.prepare(`
    SELECT id, title, description, route_name, created_at
    FROM achievements WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId)
}

function sendError(
  response: Response,
  error: unknown,
  fallback: string,
) {
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

function assertPendingMeetupLimit(userId: string) {
  const count = Number(
    (db.prepare(`
      SELECT COUNT(*) AS count FROM meetup_invites
      WHERE user_id = ? AND status = 'pending'
    `).get(userId) as unknown as { count: number }).count,
  )
  if (count >= 5) throwRateLimit('You already have five meetup invites waiting for review.')
}

function assertDailyPostLimit(
  table: 'suggestions' | 'achievements',
  userId: string,
  maximum: number,
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const statement =
    table === 'suggestions'
      ? db.prepare(`
          SELECT COUNT(*) AS count FROM suggestions
          WHERE user_id = ? AND created_at >= ?
        `)
      : db.prepare(`
          SELECT COUNT(*) AS count FROM achievements
          WHERE user_id = ? AND created_at >= ?
        `)
  const count = Number(
    (statement.get(userId, since) as unknown as { count: number }).count,
  )
  if (count >= maximum) {
    throwRateLimit(`You can share up to ${maximum} ${table} per day.`)
  }
}

function throwRateLimit(message: string): never {
  const error = new Error(message)
  Object.assign(error, { status: 429 })
  throw error
}
