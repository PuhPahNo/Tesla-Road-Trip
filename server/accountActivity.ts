import { randomUUID } from 'node:crypto'
import { db } from './database'

interface ActivityIdentity {
  id: string
  username: string
}

export function logAccountActivity({
  actor,
  target,
  action,
  details,
}: {
  actor?: ActivityIdentity
  target?: ActivityIdentity
  action: string
  details?: Record<string, unknown>
}) {
  db.prepare(`
    INSERT INTO account_activity (
      id, actor_user_id, actor_username, target_user_id, target_username,
      action, details_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    actor?.id ?? null,
    actor?.username ?? 'system',
    target?.id ?? null,
    target?.username ?? null,
    action,
    details ? JSON.stringify(details) : null,
    new Date().toISOString(),
  )
}
