import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Express } from 'express'
import { z } from 'zod'
import {
  defaultPlannerConfig,
  plannerConfigSchema,
  sanitizePlannerConfig,
} from '../src/domain/config'
import { getKnownWaypoint, KNOWN_WAYPOINTS } from '../src/domain/highlights'
import { optimizeRoutes } from '../src/domain/optimizer'
import { buildStateRouteStats } from '../src/domain/routeStats'
import type {
  OptimizeResponse,
  PlannerConfig,
  RoutePlan,
  Station,
} from '../src/domain/types'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const ONE_MINUTE_MS = 60_000
const FALLBACK_MODEL = 'gpt-5-mini'
const DEFAULT_DAILY_LIMIT_USD = 5
const DEFAULT_MAX_REQUEST_USD = 0.35
const DEFAULT_MAX_OUTPUT_TOKENS = 900
const DEFAULT_AGENT_RATE_LIMIT_PER_MINUTE = 6
const DEFAULT_INPUT_COST_PER_1M_USD = 1.25
const DEFAULT_OUTPUT_COST_PER_1M_USD = 10

interface StationCache {
  fetchedAt: string
  stations: Station[]
}

interface AgentUsageRecord {
  date: string
  requests: number
  estimatedSpendUsd: number
  updatedAt: string
}

interface OpenAiResponse {
  output?: OpenAiOutputItem[]
  output_text?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
    prompt_tokens?: number
    completion_tokens?: number
  }
}

interface OpenAiOutputItem {
  type?: string
  call_id?: string
  name?: string
  arguments?: string
  role?: string
  content?: Array<{
    type?: string
    text?: string
  }>
}

const agentRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  config: plannerConfigSchema,
  selectedRouteId: z.string().optional(),
})

const routeDetailArgsSchema = z.object({
  routeId: z.string().nullable().optional(),
  day: z.number().int().min(1).nullable().optional(),
  state: z.string().min(2).max(3).nullable().optional(),
})

const NUMERIC_SETTING_LIMITS = {
  targetStations: { min: 25, max: 5000, integer: true },
  tripWeeks: { min: 1, max: 52 },
  dailyDriveTargetHours: { min: 1, max: 14 },
  dailyDriveMaxHours: { min: 1, max: 16 },
  longDayMaxHours: { min: 2, max: 14 },
  longDayMinSitesPerExtraHour: { min: 0.1, max: 30 },
  averageMph: { min: 25, max: 85 },
  practicalRangeMiles: { min: 80, max: 350 },
  closeStationRadiusMiles: { min: 0.5, max: 25 },
  closeStationStopMinutes: { min: 1, max: 60 },
  distanceChargeStopMinutes: { min: 2, max: 90 },
  roadDistanceFactor: { min: 1, max: 1.8 },
} as const

const BOOLEAN_SETTING_KEYS = [
  'longDayOptimization',
  'includeCanada',
  'includeMexico',
  'showAllStations',
] as const

const waypointArgsSchema = z.object({
  waypointId: z.enum(KNOWN_WAYPOINTS.map((waypoint) => waypoint.id) as [string, ...string[]]),
})

const customRouteArgsSchema = z.object({
  waypointIds: z
    .array(
      z.enum(KNOWN_WAYPOINTS.map((waypoint) => waypoint.id) as [string, ...string[]]),
    )
    .min(1)
    .max(12),
})

let agentRequestTimestamps: number[] = []

export function registerAgentRoutes(
  app: Express,
  loadStations: () => Promise<StationCache>,
) {
  app.post('/api/agent', async (request, response) => {
    const apiKey = process.env.OPENAI_API_KEY
    const dailyLimitUsd = getNumberEnv(
      'OPENAI_DAILY_SPEND_LIMIT_USD',
      DEFAULT_DAILY_LIMIT_USD,
    )
    const maxRequestUsd = getNumberEnv(
      'OPENAI_AGENT_MAX_REQUEST_USD',
      DEFAULT_MAX_REQUEST_USD,
    )

    if (!apiKey) {
      response.status(503).json({
        message:
          'OpenAI agent is not configured. Add OPENAI_API_KEY to .env and restart npm run dev.',
        actions: [],
        config: defaultPlannerConfig,
        usage: {
          enabled: false,
          dailyLimitUsd,
          estimatedDailySpendUsd: 0,
          estimatedRequestSpendUsd: 0,
        },
      })
      return
    }

    try {
      enforceAgentRateLimit()
      await assertDailyBudget(dailyLimitUsd, maxRequestUsd)

      const parsed = agentRequestSchema.parse(request.body)
      let workingConfig = sanitizePlannerConfig(parsed.config)
      let selectedRouteId = parsed.selectedRouteId
      let workingResult: OptimizeResponse | undefined
      const actions: string[] = []

      const ensureOptimized = async () => {
        if (workingResult) return workingResult
        const cache = await loadStations()
        workingResult = optimizeRoutes(
          cache.stations,
          workingConfig,
          cache.fetchedAt,
        )
        selectedRouteId = selectedRouteId ?? workingResult.routes[0]?.id
        return workingResult
      }

      const toolContext: AgentToolContext = {
        get workingConfig() {
          return workingConfig
        },
        set workingConfig(nextConfig) {
          workingConfig = nextConfig
          workingResult = undefined
        },
        get selectedRouteId() {
          return selectedRouteId
        },
        set selectedRouteId(nextRouteId) {
          selectedRouteId = nextRouteId
        },
        actions,
        ensureOptimized,
      }

      const agentResult = await runPlannerAgent({
        apiKey,
        message: parsed.message,
        toolContext,
      })
      const usageRecord = await chargeDailyUsage(
        estimateOpenAiCost(agentResult.usage, maxRequestUsd),
      )

      response.json({
        message: agentResult.message,
        actions,
        config: workingConfig,
        result: workingResult,
        selectedRouteId,
        usage: {
          enabled: true,
          dailyLimitUsd,
          estimatedDailySpendUsd: usageRecord.estimatedSpendUsd,
          estimatedRequestSpendUsd: agentResult.estimatedRequestSpendUsd,
        },
      })
    } catch (error) {
      const status =
        error instanceof AgentHttpError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 502
      response.status(status).json({
        error: 'agent_failed',
        message:
          error instanceof Error
            ? error.message
            : 'The OpenAI trip agent request failed.',
      })
    }
  })
}

interface AgentToolContext {
  workingConfig: PlannerConfig
  selectedRouteId?: string
  actions: string[]
  ensureOptimized: () => Promise<OptimizeResponse>
}

async function runPlannerAgent({
  apiKey,
  message,
  toolContext,
}: {
  apiKey: string
  message: string
  toolContext: AgentToolContext
}) {
  let input: unknown[] = [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `User request: ${message}`,
        },
      ],
    },
  ]
  let usage: OpenAiResponse['usage']
  let estimatedRequestSpendUsd = 0

  for (let turn = 0; turn < 6; turn += 1) {
    const response = await createOpenAiResponse(apiKey, input)
    usage = mergeUsage(usage, response.usage)
    estimatedRequestSpendUsd += estimateOpenAiCost(
      response.usage,
      getNumberEnv('OPENAI_AGENT_MAX_REQUEST_USD', DEFAULT_MAX_REQUEST_USD),
    )

    const functionCalls = response.output?.filter(
      (item) => item.type === 'function_call',
    ) ?? []

    if (functionCalls.length === 0) {
      return {
        message: extractResponseText(response),
        usage,
        estimatedRequestSpendUsd,
      }
    }

    const toolOutputs = await Promise.all(
      functionCalls.map(async (call) => ({
        type: 'function_call_output',
        call_id: call.call_id,
        output: JSON.stringify(await runAgentTool(call, toolContext)),
      })),
    )

    input = [...input, ...(response.output ?? []), ...toolOutputs]
  }

  throw new AgentHttpError(502, 'Trip agent exceeded the allowed tool-call loop.')
}

async function createOpenAiResponse(apiKey: string, input: unknown[]) {
  const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? FALLBACK_MODEL,
      instructions:
        `You are a route-planning assistant inside a local Tesla Supercharger Quest Planner app. Use tools when you need route data or when the user asks to change settings, require a stop, create a custom ordered route, or reoptimize. Known waypoint IDs are: ${KNOWN_WAYPOINTS.map((waypoint) => `${waypoint.id} (${waypoint.label})`).join(', ')}. For exact-order custom-route requests, call create_custom_route with only the intermediate waypoint IDs in order; omit Chattanooga/start/end. Keep final answers short and name the concrete changes made. You cannot execute arbitrary code, browse the web, or spend money outside this API call. Treat Tesla badge and landmark data as the app curated catalog, not official proof.`,
      input,
      tools: plannerAgentTools,
      tool_choice: 'auto',
      parallel_tool_calls: false,
      max_output_tokens: getNumberEnv(
        'OPENAI_AGENT_MAX_OUTPUT_TOKENS',
        DEFAULT_MAX_OUTPUT_TOKENS,
      ),
    }),
  })

  const payload = (await openAiResponse.json()) as OpenAiResponse & {
    error?: { message?: string }
  }

  if (!openAiResponse.ok) {
    throw new AgentHttpError(
      openAiResponse.status,
      payload.error?.message ?? 'OpenAI API request failed.',
    )
  }

  return payload
}

async function runAgentTool(
  call: OpenAiOutputItem,
  context: AgentToolContext,
) {
  const name = call.name
  const args = parseToolArgs(call.arguments)

  if (name === 'get_trip_context') {
    const result = await context.ensureOptimized()
    return {
      config: summarizeConfig(context.workingConfig),
      selectedRouteId: context.selectedRouteId,
      routes: result.routes.map(summarizeRoute),
      stateCoverage: buildStateRouteStats(
        getSelectedRoute(result, context.selectedRouteId),
        result.stations,
      ).slice(0, 12),
    }
  }

  if (name === 'get_route_details') {
    const parsed = routeDetailArgsSchema.parse(args)
    const result = await context.ensureOptimized()
    const route = getSelectedRoute(result, parsed.routeId ?? context.selectedRouteId)
    const stateCoverage = buildStateRouteStats(route, result.stations)
    return {
      route: summarizeRoute(route),
      days: parsed.day
        ? route.days.filter((day) => day.day === parsed.day)
        : route.days.slice(0, 10),
      state:
        parsed.state ?
          stateCoverage.find((state) => state.state === parsed.state) ?? null
        : null,
    }
  }

  if (name === 'set_trip_settings') {
    const parsed = parsePlannerSettingsArgs(args)

    if (Object.keys(parsed.settings).length === 0) {
      context.actions.push('No valid planner settings were changed.')
      return {
        config: summarizeConfig(context.workingConfig),
        ignoredFields: parsed.ignoredFields,
      }
    }

    context.workingConfig = sanitizePlannerConfig({
      ...context.workingConfig,
      ...parsed.settings,
    })
    context.actions.push(
      `Updated planner settings: ${Object.keys(parsed.settings).join(', ')}`,
    )
    return {
      config: summarizeConfig(context.workingConfig),
      ignoredFields: parsed.ignoredFields,
    }
  }

  if (name === 'add_required_waypoint') {
    const parsed = waypointArgsSchema.parse(args)
    const waypoint = getKnownWaypoint(parsed.waypointId)
    if (!waypoint) {
      throw new Error(`Unknown waypoint: ${parsed.waypointId}`)
    }

    const nextWaypoints = [
      ...context.workingConfig.requiredWaypoints.filter(
        (current) => current.id !== waypoint.id,
      ),
      waypoint,
    ]
    context.workingConfig = sanitizePlannerConfig({
      ...context.workingConfig,
      requiredWaypoints: nextWaypoints,
    })
    context.actions.push(`Required waypoint added: ${waypoint.label}`)
    return {
      config: summarizeConfig(context.workingConfig),
    }
  }

  if (name === 'create_custom_route') {
    const parsed = customRouteArgsSchema.parse(args)
    const customRouteWaypoints = parsed.waypointIds.map((waypointId) => {
      const waypoint = getKnownWaypoint(waypointId)
      if (!waypoint) {
        throw new Error(`Unknown waypoint: ${waypointId}`)
      }
      return waypoint
    })

    context.workingConfig = sanitizePlannerConfig({
      ...context.workingConfig,
      customRouteWaypoints,
    })
    const result = await context.ensureOptimized()
    const customRoute =
      result.routes.find((route) => route.id === 'custom-ai-route') ??
      result.routes[0]
    context.selectedRouteId = customRoute.id
    context.actions.push(
      `Created custom route: ${customRouteWaypoints.map((waypoint) => waypoint.label).join(' -> ')}`,
    )
    return {
      config: summarizeConfig(context.workingConfig),
      selectedRouteId: customRoute.id,
      route: summarizeRoute(customRoute),
    }
  }

  if (name === 'clear_required_waypoints') {
    context.workingConfig = sanitizePlannerConfig({
      ...context.workingConfig,
      requiredWaypoints: [],
    })
    context.actions.push('Cleared required waypoints.')
    return {
      config: summarizeConfig(context.workingConfig),
    }
  }

  if (name === 'clear_custom_route') {
    context.workingConfig = sanitizePlannerConfig({
      ...context.workingConfig,
      customRouteWaypoints: [],
    })
    context.actions.push('Cleared custom route waypoints.')
    return {
      config: summarizeConfig(context.workingConfig),
    }
  }

  if (name === 'optimize_trip') {
    const result = await context.ensureOptimized()
    const route = getSelectedRoute(result, context.selectedRouteId)
    context.selectedRouteId = route.id
    context.actions.push(`Optimized routes with ${route.name} selected.`)
    return {
      selectedRouteId: route.id,
      route: summarizeRoute(route),
      requiredWaypoints: context.workingConfig.requiredWaypoints,
    }
  }

  throw new Error(`Unsupported tool call: ${name ?? 'unknown'}`)
}

const plannerAgentTools = [
  {
    type: 'function',
    name: 'get_trip_context',
    description: 'Get current planner settings, route summaries, and selected route state coverage.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'get_route_details',
    description:
      'Get detailed route data. Use optional routeId, day, or state filters to keep context focused.',
    parameters: {
      type: 'object',
      properties: {
        routeId: { type: ['string', 'null'] },
        day: { type: ['number', 'null'] },
        state: { type: ['string', 'null'] },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'set_trip_settings',
    description:
      'Update planner settings. Only include fields the user explicitly wants changed.',
    parameters: {
      type: 'object',
      properties: {
        targetStations: { type: 'number' },
        tripWeeks: { type: 'number' },
        dailyDriveTargetHours: { type: 'number' },
        dailyDriveMaxHours: { type: 'number' },
        longDayOptimization: { type: 'boolean' },
        longDayMaxHours: { type: 'number' },
        longDayMinSitesPerExtraHour: { type: 'number' },
        averageMph: { type: 'number' },
        practicalRangeMiles: { type: 'number' },
        closeStationRadiusMiles: { type: 'number' },
        closeStationStopMinutes: { type: 'number' },
        distanceChargeStopMinutes: { type: 'number' },
        includeCanada: { type: 'boolean' },
        includeMexico: { type: 'boolean' },
        showAllStations: { type: 'boolean' },
        roadDistanceFactor: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'add_required_waypoint',
    description:
      'Require routes to pass through a known waypoint corridor before reoptimizing.',
    parameters: {
      type: 'object',
      properties: {
        waypointId: {
          type: 'string',
          enum: KNOWN_WAYPOINTS.map((waypoint) => waypoint.id),
        },
      },
      required: ['waypointId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'create_custom_route',
    description:
      'Create and optimize an additional Custom AI Route candidate through known waypoints in the exact order provided. Omit the start/end location from waypointIds.',
    parameters: {
      type: 'object',
      properties: {
        waypointIds: {
          type: 'array',
          minItems: 1,
          maxItems: 12,
          items: {
            type: 'string',
            enum: KNOWN_WAYPOINTS.map((waypoint) => waypoint.id),
          },
        },
      },
      required: ['waypointIds'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'clear_required_waypoints',
    description: 'Remove all required waypoint preferences from the planner config.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'clear_custom_route',
    description: 'Remove the custom route candidate from the planner config.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'optimize_trip',
    description:
      'Run the deterministic trip optimizer using the current server-side planner settings.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
]

function summarizeConfig(config: PlannerConfig) {
  return {
    targetStations: config.targetStations,
    tripWeeks: config.tripWeeks,
    dailyDriveTargetHours: config.dailyDriveTargetHours,
    dailyDriveMaxHours: config.dailyDriveMaxHours,
    longDayOptimization: config.longDayOptimization,
    includeCanada: config.includeCanada,
    includeMexico: config.includeMexico,
    requiredWaypoints: config.requiredWaypoints,
    customRouteWaypoints: config.customRouteWaypoints,
  }
}

function summarizeRoute(route: RoutePlan) {
  return {
    id: route.id,
    name: route.name,
    strategy: route.strategy,
    uniqueStations: route.uniqueStations,
    totalMiles: route.totalMiles,
    totalDays: route.totalDays,
    averageDistanceBetweenSuperchargers:
      route.averageDistanceBetweenSuperchargers,
    averageDriveHoursPerDay: route.averageDriveHoursPerDay,
    stationsPerDay: route.stationsPerDay,
    warnings: route.warnings,
    advisories: route.advisories,
    firstDay: route.days[0],
    lastDay: route.days.at(-1),
  }
}

function getSelectedRoute(result: OptimizeResponse, routeId?: string) {
  return (
    result.routes.find((route) => route.id === routeId) ??
    result.routes[0]
  )
}

function parseToolArgs(rawArgs: string | undefined) {
  if (!rawArgs) return {}
  return JSON.parse(rawArgs) as Record<string, unknown>
}

function parsePlannerSettingsArgs(args: Record<string, unknown>) {
  const settings: Partial<PlannerConfig> = {}
  const ignoredFields: string[] = []

  Object.entries(args).forEach(([key, value]) => {
    if (key in NUMERIC_SETTING_LIMITS) {
      const limit =
        NUMERIC_SETTING_LIMITS[key as keyof typeof NUMERIC_SETTING_LIMITS]
      const numberValue =
        typeof value === 'number'
          ? value
          : typeof value === 'string'
            ? Number(value)
            : Number.NaN

      if (
        Number.isFinite(numberValue) &&
        numberValue >= limit.min &&
        numberValue <= limit.max &&
        (!('integer' in limit) || !limit.integer || Number.isInteger(numberValue))
      ) {
        Object.assign(settings, { [key]: numberValue })
        return
      }

      ignoredFields.push(key)
      return
    }

    if ((BOOLEAN_SETTING_KEYS as readonly string[]).includes(key)) {
      if (typeof value === 'boolean') {
        Object.assign(settings, { [key]: value })
        return
      }

      ignoredFields.push(key)
      return
    }

    ignoredFields.push(key)
  })

  return { settings, ignoredFields }
}

function extractResponseText(response: OpenAiResponse) {
  if (response.output_text) return response.output_text

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join('\n')

  return text || 'Done.'
}

function mergeUsage(
  current: OpenAiResponse['usage'],
  next: OpenAiResponse['usage'],
) {
  if (!current) return next
  if (!next) return current

  return {
    input_tokens: (current.input_tokens ?? 0) + (next.input_tokens ?? 0),
    output_tokens: (current.output_tokens ?? 0) + (next.output_tokens ?? 0),
    prompt_tokens: (current.prompt_tokens ?? 0) + (next.prompt_tokens ?? 0),
    completion_tokens:
      (current.completion_tokens ?? 0) + (next.completion_tokens ?? 0),
  }
}

function estimateOpenAiCost(
  usage: OpenAiResponse['usage'],
  fallbackCostUsd: number,
) {
  if (!usage) return fallbackCostUsd

  const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? 0
  const outputTokens = usage.output_tokens ?? usage.completion_tokens ?? 0
  const inputCost =
    (inputTokens / 1_000_000) *
    getNumberEnv('OPENAI_INPUT_COST_PER_1M_USD', DEFAULT_INPUT_COST_PER_1M_USD)
  const outputCost =
    (outputTokens / 1_000_000) *
    getNumberEnv('OPENAI_OUTPUT_COST_PER_1M_USD', DEFAULT_OUTPUT_COST_PER_1M_USD)

  return Math.max(inputCost + outputCost, 0.001)
}

function enforceAgentRateLimit() {
  const limit = getNumberEnv(
    'OPENAI_AGENT_RATE_LIMIT_PER_MINUTE',
    DEFAULT_AGENT_RATE_LIMIT_PER_MINUTE,
  )
  const now = Date.now()
  agentRequestTimestamps = agentRequestTimestamps.filter(
    (timestamp) => now - timestamp < ONE_MINUTE_MS,
  )

  if (agentRequestTimestamps.length >= limit) {
    throw new AgentHttpError(
      429,
      `OpenAI trip agent rate limit reached: ${limit} requests per minute.`,
    )
  }

  agentRequestTimestamps.push(now)
}

async function assertDailyBudget(dailyLimitUsd: number, maxRequestUsd: number) {
  const usage = await readDailyUsage()

  if (usage.estimatedSpendUsd + maxRequestUsd > dailyLimitUsd) {
    throw new AgentHttpError(
      429,
      `OpenAI trip agent daily budget would exceed $${dailyLimitUsd.toFixed(2)}.`,
    )
  }
}

async function chargeDailyUsage(costUsd: number) {
  const usage = await readDailyUsage()
  const nextUsage = {
    ...usage,
    requests: usage.requests + 1,
    estimatedSpendUsd: roundMoney(usage.estimatedSpendUsd + costUsd),
    updatedAt: new Date().toISOString(),
  }

  await writeFile(usageFilePath(), JSON.stringify(nextUsage, null, 2))
  return nextUsage
}

async function readDailyUsage(): Promise<AgentUsageRecord> {
  const today = new Date().toISOString().slice(0, 10)

  try {
    const raw = await readFile(usageFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as AgentUsageRecord
    if (parsed.date === today) return parsed
  } catch {
    // Missing or malformed local usage state starts a new local day.
  }

  return {
    date: today,
    requests: 0,
    estimatedSpendUsd: 0,
    updatedAt: new Date().toISOString(),
  }
}

function usageFilePath() {
  return path.resolve(
    process.cwd(),
    process.env.OPENAI_AGENT_USAGE_FILE ?? '.quest-agent-usage.json',
  )
}

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function roundMoney(value: number) {
  return Math.round(value * 10000) / 10000
}

class AgentHttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
