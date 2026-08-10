import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { db } from './database'

const MICRO_USD_PER_USD = 1_000_000
const DEFAULT_BUDGET_TIME_ZONE = 'America/New_York'

interface DailyUsageRow {
  budget_date: string
  spent_microusd: number
  reserved_microusd: number
  requests_started: number
  requests_finished: number
  updated_at: string
}

interface ReservationRow {
  id: string
  budget_date: string
  reserved_microusd: number
  status: 'pending' | 'settled' | 'forfeited'
}

export interface OpenAiBudgetReservation {
  id: string
  budgetDate: string
  reservedUsd: number
}

export interface OpenAiDailyUsage {
  budgetDate: string
  spentUsd: number
  reservedUsd: number
  accountedUsd: number
  requestsStarted: number
  requestsFinished: number
}

export class OpenAiBudgetError extends Error {
  readonly status = 429
}

export class OpenAiBudgetLedger {
  private readonly database: DatabaseSync
  private readonly options: {
    now?: () => Date
    timeZone?: string
  }

  constructor(
    database: DatabaseSync,
    options: {
      now?: () => Date
      timeZone?: string
    } = {},
  ) {
    this.database = database
    this.options = options
  }

  reserve(dailyLimitUsd: number, reserveUsd: number): OpenAiBudgetReservation {
    const dailyLimitMicrousd = toMicrousd(dailyLimitUsd)
    const reserveMicrousd = toMicrousd(reserveUsd)
    if (reserveMicrousd > dailyLimitMicrousd) {
      throw new OpenAiBudgetError(
        `One Ask CORE request can reserve $${reserveUsd.toFixed(2)}, above the $${dailyLimitUsd.toFixed(2)} daily limit.`,
      )
    }

    const now = this.now()
    const budgetDate = budgetDateFor(
      now,
      this.options.timeZone ?? process.env.OPENAI_BUDGET_TIME_ZONE ?? DEFAULT_BUDGET_TIME_ZONE,
    )
    const createdAt = now.toISOString()
    const reservationId = randomUUID()

    return immediateTransaction(this.database, () => {
      this.database.prepare(`
        INSERT INTO openai_daily_usage (budget_date, updated_at)
        VALUES (?, ?)
        ON CONFLICT(budget_date) DO NOTHING
      `).run(budgetDate, createdAt)

      const usage = this.readUsageRow(budgetDate)
      if (
        usage.spent_microusd + usage.reserved_microusd + reserveMicrousd >
        dailyLimitMicrousd
      ) {
        throw new OpenAiBudgetError(
          `Ask CORE's $${dailyLimitUsd.toFixed(2)} daily OpenAI budget is used or already reserved. Route planning still works without Ask CORE.`,
        )
      }

      this.database.prepare(`
        UPDATE openai_daily_usage
        SET reserved_microusd = reserved_microusd + ?,
            requests_started = requests_started + 1,
            updated_at = ?
        WHERE budget_date = ?
      `).run(reserveMicrousd, createdAt, budgetDate)
      this.database.prepare(`
        INSERT INTO openai_budget_reservations (
          id, budget_date, reserved_microusd, created_at
        ) VALUES (?, ?, ?, ?)
      `).run(reservationId, budgetDate, reserveMicrousd, createdAt)

      return {
        id: reservationId,
        budgetDate,
        reservedUsd: fromMicrousd(reserveMicrousd),
      }
    })
  }

  settle(reservationId: string, actualUsd: number): OpenAiDailyUsage {
    return this.finish(reservationId, actualUsd, 'settled')
  }

  forfeit(reservationId: string): OpenAiDailyUsage {
    return this.finish(reservationId, undefined, 'forfeited')
  }

  usage(budgetDate = this.currentBudgetDate()): OpenAiDailyUsage {
    const row = this.database.prepare(`
      SELECT * FROM openai_daily_usage WHERE budget_date = ?
    `).get(budgetDate) as unknown as DailyUsageRow | undefined
    return row ? toUsage(row) : emptyUsage(budgetDate)
  }

  private finish(
    reservationId: string,
    actualUsd: number | undefined,
    status: 'settled' | 'forfeited',
  ): OpenAiDailyUsage {
    const settledAt = this.now().toISOString()
    return immediateTransaction(this.database, () => {
      const reservation = this.database.prepare(`
        SELECT id, budget_date, reserved_microusd, status
        FROM openai_budget_reservations
        WHERE id = ?
      `).get(reservationId) as unknown as ReservationRow | undefined
      if (!reservation) throw new Error('OpenAI budget reservation was not found.')
      if (reservation.status !== 'pending') {
        return toUsage(this.readUsageRow(reservation.budget_date))
      }

      const chargedMicrousd =
        status === 'forfeited'
          ? reservation.reserved_microusd
          : toMicrousd(actualUsd ?? 0)
      if (chargedMicrousd > reservation.reserved_microusd) {
        throw new Error(
          `OpenAI request cost $${fromMicrousd(chargedMicrousd).toFixed(6)}, above its $${fromMicrousd(reservation.reserved_microusd).toFixed(6)} reservation.`,
        )
      }

      this.database.prepare(`
        UPDATE openai_daily_usage
        SET spent_microusd = spent_microusd + ?,
            reserved_microusd = MAX(0, reserved_microusd - ?),
            requests_finished = requests_finished + 1,
            updated_at = ?
        WHERE budget_date = ?
      `).run(
        chargedMicrousd,
        reservation.reserved_microusd,
        settledAt,
        reservation.budget_date,
      )
      this.database.prepare(`
        UPDATE openai_budget_reservations
        SET charged_microusd = ?, status = ?, settled_at = ?
        WHERE id = ?
      `).run(chargedMicrousd, status, settledAt, reservationId)

      return toUsage(this.readUsageRow(reservation.budget_date))
    })
  }

  private readUsageRow(budgetDate: string): DailyUsageRow {
    const row = this.database.prepare(`
      SELECT * FROM openai_daily_usage WHERE budget_date = ?
    `).get(budgetDate) as unknown as DailyUsageRow | undefined
    if (!row) throw new Error(`OpenAI usage row ${budgetDate} was not found.`)
    return row
  }

  private currentBudgetDate() {
    return budgetDateFor(
      this.now(),
      this.options.timeZone ?? process.env.OPENAI_BUDGET_TIME_ZONE ?? DEFAULT_BUDGET_TIME_ZONE,
    )
  }

  private now() {
    return this.options.now?.() ?? new Date()
  }
}

export const openAiBudgetLedger = new OpenAiBudgetLedger(db)

export function budgetDateFor(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

function immediateTransaction<T>(database: DatabaseSync, operation: () => T): T {
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = operation()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

function toMicrousd(usd: number) {
  if (!Number.isFinite(usd) || usd < 0) throw new Error('OpenAI budget value is invalid.')
  return Math.ceil(usd * MICRO_USD_PER_USD)
}

function fromMicrousd(microusd: number) {
  return microusd / MICRO_USD_PER_USD
}

function toUsage(row: DailyUsageRow): OpenAiDailyUsage {
  const spentUsd = fromMicrousd(row.spent_microusd)
  const reservedUsd = fromMicrousd(row.reserved_microusd)
  return {
    budgetDate: row.budget_date,
    spentUsd,
    reservedUsd,
    accountedUsd: spentUsd + reservedUsd,
    requestsStarted: row.requests_started,
    requestsFinished: row.requests_finished,
  }
}

function emptyUsage(budgetDate: string): OpenAiDailyUsage {
  return {
    budgetDate,
    spentUsd: 0,
    reservedUsd: 0,
    accountedUsd: 0,
    requestsStarted: 0,
    requestsFinished: 0,
  }
}
