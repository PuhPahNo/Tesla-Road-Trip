import { beforeEach, describe, expect, it } from 'vitest'
import {
  RequestRateLimitError,
  enforceRequestRateLimit,
  resetRequestRateLimitsForTests,
} from './rateLimit'

describe('request rate limiter', () => {
  beforeEach(() => resetRequestRateLimitsForTests())

  it('limits the same actor within a scope', () => {
    const request = {
      scope: 'route optimization per account',
      actorId: 'user-1',
      limit: 2,
      windowMs: 60_000,
      now: 1_000,
    }
    enforceRequestRateLimit(request)
    enforceRequestRateLimit({ ...request, now: 2_000 })

    expect(() =>
      enforceRequestRateLimit({ ...request, now: 3_000 }),
    ).toThrow(RequestRateLimitError)
  })

  it('keeps account, network, and global buckets independent', () => {
    enforceRequestRateLimit({
      scope: 'per account',
      actorId: 'user-1',
      limit: 1,
      windowMs: 60_000,
      now: 1_000,
    })

    expect(() =>
      enforceRequestRateLimit({
        scope: 'per account',
        actorId: 'user-2',
        limit: 1,
        windowMs: 60_000,
        now: 1_000,
      }),
    ).not.toThrow()
    expect(() =>
      enforceRequestRateLimit({
        scope: 'per network',
        actorId: '127.0.0.1',
        limit: 1,
        windowMs: 60_000,
        now: 1_000,
      }),
    ).not.toThrow()
  })
})
