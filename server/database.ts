import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const DATA_DIR =
  process.env.DATA_DIR ??
  (process.env.RENDER ? '/data' : path.resolve(process.cwd(), '.data'))
const DATABASE_PATH =
  process.env.CHARGE_QUEST_DB_PATH ?? path.join(DATA_DIR, 'charge-quest.sqlite')

mkdirSync(path.dirname(DATABASE_PATH), { recursive: true })

export const db = new DatabaseSync(DATABASE_PATH)

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')
db.exec('PRAGMA busy_timeout = 5000')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS account_activity (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_username TEXT NOT NULL,
    target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    target_username TEXT,
    action TEXT NOT NULL,
    details_json TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS account_activity_created_idx
    ON account_activity(created_at DESC);
  CREATE INDEX IF NOT EXISTS account_activity_target_idx
    ON account_activity(target_user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    config_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_routes (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, id)
  );
  CREATE INDEX IF NOT EXISTS custom_routes_updated_idx
    ON custom_routes(user_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS anthony_trip (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    active INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL DEFAULT 'Anthony''s ChargeQuest',
    route_name TEXT,
    day_number INTEGER,
    total_days INTEGER,
    current_location TEXT,
    headline TEXT,
    body TEXT,
    latitude REAL,
    longitude REAL,
    started_at TEXT,
    departure_date TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trip_updates (
    id TEXT PRIMARY KEY,
    day_number INTEGER,
    location TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    visiting TEXT,
    phase TEXT NOT NULL DEFAULT 'planning',
    artifact_url TEXT,
    artifact_label TEXT,
    artifact_type TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS trip_updates_created_idx
    ON trip_updates(created_at DESC);

  CREATE TABLE IF NOT EXISTS state_votes (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state_code TEXT NOT NULL,
    note TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, state_code)
  );
  CREATE INDEX IF NOT EXISTS state_votes_state_idx ON state_votes(state_code);

  CREATE TABLE IF NOT EXISTS meetup_invites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state_code TEXT NOT NULL,
    city TEXT NOT NULL,
    proposed_day INTEGER,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS meetup_status_idx
    ON meetup_invites(status, created_at DESC);

  CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    state_code TEXT,
    status TEXT NOT NULL DEFAULT 'published'
      CHECK (status IN ('published', 'hidden')),
    review_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS suggestions_created_idx
    ON suggestions(status, created_at DESC);

  CREATE TABLE IF NOT EXISTS suggestion_votes (
    suggestion_id TEXT NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (suggestion_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    route_name TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS achievements_user_idx
    ON achievements(user_id, created_at DESC);
`)

ensureColumn('anthony_trip', 'departure_date', 'TEXT')
ensureColumn('trip_updates', 'phase', "TEXT NOT NULL DEFAULT 'planning'")
ensureColumn('trip_updates', 'artifact_url', 'TEXT')
ensureColumn('trip_updates', 'artifact_label', 'TEXT')
ensureColumn('trip_updates', 'artifact_type', 'TEXT')
ensureColumn('trip_updates', 'updated_at', 'TEXT')
ensureColumn('suggestions', 'review_status', "TEXT NOT NULL DEFAULT 'pending'")

db.exec(`
  UPDATE trip_updates SET updated_at = created_at WHERE updated_at IS NULL;
`)

db.prepare(`
  INSERT INTO anthony_trip (id, active, updated_at)
  VALUES (1, 0, ?)
  ON CONFLICT(id) DO NOTHING
`).run(new Date().toISOString())

// Keep the persisted public trip title aligned with the one-word brand after
// deployment without overwriting any other custom title text Anthony entered.
const legacyBrand = ['Charge', 'Quest'].join(' ')
db.prepare(`
  UPDATE anthony_trip
  SET title = replace(title, ?, ?)
  WHERE instr(title, ?) > 0
`).run(legacyBrand, 'ChargeQuest', legacyBrand)

export function transaction<T>(operation: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = operation()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{
    name: string
  }>
  if (columns.some((item) => item.name === column)) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

export function databasePath() {
  return DATABASE_PATH
}
