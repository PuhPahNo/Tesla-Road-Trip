// @vitest-environment node

import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import {
  OpenAiBudgetError,
  OpenAiBudgetLedger,
  budgetDateFor,
} from './openAiBudget'

function createLedger(now = new Date('2026-08-10T16:00:00.000Z')) {
  const database = new DatabaseSync(':memory:')
  database.exec('PRAGMA foreign_keys = ON')
  database.exec(`
    CREATE TABLE openai_daily_usage (
      budget_date TEXT PRIMARY KEY,
      spent_microusd INTEGER NOT NULL DEFAULT 0,
      reserved_microusd INTEGER NOT NULL DEFAULT 0,
      requests_started INTEGER NOT NULL DEFAULT 0,
      requests_finished INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE openai_budget_reservations (
      id TEXT PRIMARY KEY,
      budget_date TEXT NOT NULL REFERENCES openai_daily_usage(budget_date),
      reserved_microusd INTEGER NOT NULL,
      charged_microusd INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      settled_at TEXT
    );
  `)
  return {
    database,
    ledger: new OpenAiBudgetLedger(database, {
      now: () => now,
      timeZone: 'America/New_York',
    }),
  }
}

describe('persistent OpenAI daily budget ledger', () => {
  it('atomically includes pending reservations in the daily cap', () => {
    const { ledger } = createLedger()
    const first = ledger.reserve(1, 0.6)

    expect(() => ledger.reserve(1, 0.5)).toThrow(OpenAiBudgetError)
    expect(ledger.usage().accountedUsd).toBe(0.6)

    ledger.settle(first.id, 0.2)
    expect(ledger.reserve(1, 0.5).reservedUsd).toBe(0.5)
    expect(ledger.usage().accountedUsd).toBe(0.7)
  })

  it('charges the full reservation when an OpenAI request fails', () => {
    const { ledger } = createLedger()
    const reservation = ledger.reserve(1, 0.35)

    const usage = ledger.forfeit(reservation.id)
    expect(usage.spentUsd).toBe(0.35)
    expect(usage.reservedUsd).toBe(0)
    expect(usage.requestsFinished).toBe(1)
  })

  it('survives a new ledger instance using the same database', () => {
    const { database, ledger } = createLedger()
    const reservation = ledger.reserve(1, 0.35)
    ledger.settle(reservation.id, 0.05)

    const restarted = new OpenAiBudgetLedger(database, {
      now: () => new Date('2026-08-10T18:00:00.000Z'),
      timeZone: 'America/New_York',
    })
    expect(restarted.usage().spentUsd).toBe(0.05)
  })

  it('uses the configured local calendar day instead of UTC midnight', () => {
    expect(
      budgetDateFor(
        new Date('2026-08-11T03:59:59.000Z'),
        'America/New_York',
      ),
    ).toBe('2026-08-10')
    expect(
      budgetDateFor(
        new Date('2026-08-11T04:00:00.000Z'),
        'America/New_York',
      ),
    ).toBe('2026-08-11')
  })
})
