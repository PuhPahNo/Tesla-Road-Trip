// @vitest-environment node
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { expect, it } from 'vitest'

interface HealthPayload {
  ok: boolean
  database: { healthy: boolean }
  roadRouting: { enabled: boolean }
}

it.each(['stalled', 'rejected', 'healthy'] as const)(
  'keeps HTTP health responsive with a %s routing provider',
  async (mode) => {
    let probes = 0
    let probeClosed = false
    const provider = createServer((_request, response) => {
      probes++
      response.on('close', () => { probeClosed = true })
      if (mode === 'stalled') return
      response.writeHead(mode === 'rejected' ? 403 : 200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ features: [{
        geometry: { coordinates: [[-122.4194, 37.7749], [-122.2712, 37.8044]] },
        properties: { segments: [{ distance: 1000, duration: 100 }] },
      }] }))
    })
    provider.listen(0, '127.0.0.1')
    await once(provider, 'listening')
    const address = provider.address()
    if (!address || typeof address === 'string') throw new Error('Missing mock address')
    const dataDir = await mkdtemp(path.join(tmpdir(), 'chargequest-health-'))
    const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
      env: {
        PATH: process.env.PATH,
        DOTENV_CONFIG_PATH: '/dev/null',
        DATA_DIR: dataDir,
        PORT: '0',
        ORS_API_KEY: 'test-key',
        ORS_BASE_URL: `http://127.0.0.1:${address.port}`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    try {
      // The startup log reports the actual ephemeral port.
      await expect.poll(() => output, { timeout: 10_000 }).toMatch(/listening on http:\/\/localhost:\d+/)
      const port = output.match(/listening on http:\/\/localhost:(\d+)/)?.[1]
      const url = `http://127.0.0.1:${port}/api/health`
      await expect.poll(() => probes).toBe(1)
      const started = performance.now()
      const results = await Promise.all(Array.from({ length: 8 }, async () => {
        const response = await fetch(url, { signal: AbortSignal.timeout(1500) })
        expect(response.status).toBe(200)
        return response.json() as Promise<HealthPayload>
      }))
      expect(performance.now() - started).toBeLessThan(1500)
      for (const result of results) {
        expect(result.ok).toBe(true)
        expect(result.database.healthy).toBe(true)
        if (mode === 'stalled') expect(result.roadRouting.enabled).toBe(false)
      }
      expect(probes).toBe(1)
      // A stalled socket must be aborted, and the failed result cached.
      await expect.poll(() => probeClosed, { timeout: 5000 }).toBe(true)
      await delay(50)
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) })
      expect(response.status).toBe(200)
      expect(((await response.json()) as HealthPayload).roadRouting.enabled).toBe(mode === 'healthy')
      expect(probes).toBe(1)
    } finally {
      const exited = once(child, 'exit')
      child.kill('SIGTERM')
      await exited
      provider.closeAllConnections()
      await new Promise<void>((resolve) => provider.close(() => resolve()))
      await rm(dataDir, { recursive: true, force: true })
    }
  },
  20_000,
)
