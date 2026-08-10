interface RateLimitOptions {
  scope: string
  actorId: string
  limit: number
  windowMs: number
  now?: number
}

const requestTimestamps = new Map<string, number[]>()

export class RequestRateLimitError extends Error {
  readonly status = 429
  readonly retryAfterSeconds: number

  constructor(
    message: string,
    retryAfterSeconds: number,
  ) {
    super(message)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function enforceRequestRateLimit(
  options: RateLimitOptions,
) {
  const now = options.now ?? Date.now()
  const key = `${options.scope}:${options.actorId}`
  const active = (requestTimestamps.get(key) ?? []).filter(
    (timestamp) => now - timestamp < options.windowMs,
  )

  if (active.length >= options.limit) {
    const oldest = active[0] ?? now
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((options.windowMs - (now - oldest)) / 1000),
    )
    throw new RequestRateLimitError(
      `Too many ${options.scope.replaceAll('_', ' ')} requests. Try again in ${retryAfterSeconds} seconds.`,
      retryAfterSeconds,
    )
  }

  active.push(now)
  requestTimestamps.set(key, active)
  pruneRateLimitBuckets(now, options.windowMs)
}

export function resetRequestRateLimitsForTests() {
  requestTimestamps.clear()
}

function pruneRateLimitBuckets(now: number, windowMs: number) {
  if (requestTimestamps.size < 2_000) return
  for (const [key, timestamps] of requestTimestamps) {
    if (!timestamps.some((timestamp) => now - timestamp < windowMs)) {
      requestTimestamps.delete(key)
    }
  }
}
