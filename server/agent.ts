import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Express } from 'express'
import { z } from 'zod'
import {
  PLANNER_NUMERIC_LIMITS,
  defaultPlannerConfig,
  plannerConfigSchema,
  sanitizePlannerConfig,
} from '../src/domain/config'
import { haversineMiles } from '../src/domain/geo'
import { getKnownWaypoint } from '../src/domain/highlights'
import { optimizeRoutes } from '../src/domain/optimizer'
import { detailForCatalogPlace } from '../src/domain/placeDetails'
import { effectivePlaceRating, suggestedStayDays } from '../src/domain/stays'
import {
  PLACE_CATALOG,
  PLACE_CATEGORY_LABELS,
  searchPlaceCatalog,
  type CatalogPlaceType,
  type PlaceCategory,
} from '../src/domain/placeCatalog'
import { buildStateRouteStats } from '../src/domain/routeStats'
import { buildTripComposition } from '../src/domain/tripComposition'
import { readSavedCustomRoutes, updateSavedCustomRoute } from './customRoutes'
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
const MAX_AGENT_TOOL_TURNS = 8
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

const NUMERIC_SETTING_LIMITS = PLANNER_NUMERIC_LIMITS

const BOOLEAN_SETTING_KEYS = [
  'longDayOptimization',
  'includeCanada',
  'includeMexico',
  'showAllStations',
  'autoStays',
] as const

const PLACE_CATEGORY_VALUES = Object.keys(PLACE_CATEGORY_LABELS) as [
  PlaceCategory,
  ...PlaceCategory[],
]

const catalogSearchArgsSchema = z.object({
  query: z.string().max(120).optional().nullable(),
  state: z.string().min(2).max(3).optional().nullable(),
  type: z.enum(['city', 'landmark']).optional().nullable(),
  category: z.enum(PLACE_CATEGORY_VALUES).optional().nullable(),
  limit: z.number().int().min(1).max(50).optional().nullable(),
})

const waypointArgsSchema = z.object({
  waypointId: z.string().min(1).max(96),
})

const customRouteArgsSchema = z.object({
  waypointIds: z
    .array(z.string().min(1).max(96))
    .min(1)
    .max(12),
})

const savedRouteUpdateArgsSchema = z
  .object({
    routeId: z.string().min(1).max(96).optional().nullable(),
    name: z.string().min(1).max(80).optional().nullable(),
    targetDays: z.number().int().min(1).max(365).optional().nullable(),
    waypointIdsToAdd: z
      .array(z.string().min(1).max(96))
      .max(16)
      .optional()
      .nullable(),
    waypointIdsToRemove: z
      .array(z.string().min(1).max(96))
      .max(16)
      .optional()
      .nullable(),
    keepOrder: z.boolean().optional().nullable(),
  })
  .refine(
    ({ routeId: _routeId, ...changes }) =>
      Object.values(changes).some((value) => value !== undefined && value !== null),
    'At least one saved-route change is required.',
  )

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
      let workingConfig = sanitizePlannerConfig({
        ...parsed.config,
        savedCustomRoutes: await readSavedCustomRoutes(),
      })
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

  for (let turn = 0; turn <= MAX_AGENT_TOOL_TURNS; turn += 1) {
    const response = await createOpenAiResponse(
      apiKey,
      input,
      turn < MAX_AGENT_TOOL_TURNS,
    )
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

  throw new AgentHttpError(502, 'Trip agent could not finish the route update.')
}

async function createOpenAiResponse(
  apiKey: string,
  input: unknown[],
  allowTools: boolean,
) {
  const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? FALLBACK_MODEL,
      instructions:
        `You are a route-planning assistant inside the Charge Quest app. Use tools when you need route data or when the user asks to change settings, require a stop, create a temporary custom ordered route, edit the selected saved route, or reoptimize. The app has ${PLACE_CATALOG.length} curated city and landmark stops across categories such as national parks, history, civil rights, sports, music, entertainment, science, coasts, scenic stops, and roadside attractions. Longest Trip routes automatically give top-rated places multi-night basecamp stays (a new unique Supercharger each day keeps the streak alive); the tripPace setting (sprint/balanced/savor) and autoStays toggle control this, favoriteCategories/mutedCategories bias which places qualify, and suggest_stays shows current stays plus candidates before pacing advice. Use search_catalog_locations to find exact waypoint IDs before adding requested stops or creating custom routes. For exact-order temporary custom-route requests through catalog waypoints, call create_custom_route with only the intermediate waypoint IDs in order; omit Chattanooga/start/end. When the selected route is a persistent saved route, use update_saved_custom_route once with all requested additions, removals, renaming, day-target, and order changes batched together; that tool saves and reoptimizes the route. Avoid repeating a tool call after it succeeds. Keep final answers short and name the concrete changes made. You cannot execute arbitrary code, browse the web, or spend money outside this API call. Treat Tesla badge and landmark data as the app curated catalog, not official proof.${allowTools ? '' : ' Do not request more tools; summarize the completed changes and any unfinished request now.'}`,
      input,
      tools: plannerAgentTools,
      tool_choice: allowTools ? 'auto' : 'none',
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

  if (name === 'search_catalog_locations') {
    const parsed = catalogSearchArgsSchema.parse(args)
    const matches = searchPlaceCatalog({
      query: parsed.query ?? '',
      state: parsed.state ?? undefined,
      type: (parsed.type ?? undefined) as CatalogPlaceType | undefined,
      category: parsed.category ?? undefined,
      limit: parsed.limit ?? 20,
    })

    return {
      catalogSize: PLACE_CATALOG.length,
      matches: matches.map((entry) => ({
        id: entry.id,
        label: entry.label,
        type: entry.type,
        state: entry.state,
        categories: entry.categories.map((category) => PLACE_CATEGORY_LABELS[category]),
        priority: entry.priority,
        radiusMiles: entry.radiusMiles,
      })),
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

  if (name === 'update_saved_custom_route') {
    const parsed = savedRouteUpdateArgsSchema.parse(args)
    const routeId = parsed.routeId ?? context.selectedRouteId
    const savedRoute = context.workingConfig.savedCustomRoutes.find(
      (route) => route.id === routeId,
    )
    if (!savedRoute) {
      throw new Error('Select a saved custom route before asking the copilot to edit it.')
    }

    const removeIds = new Set(parsed.waypointIdsToRemove ?? [])
    const waypoints = savedRoute.waypoints.filter(
      (waypoint) => !removeIds.has(waypoint.id),
    )
    for (const waypointId of parsed.waypointIdsToAdd ?? []) {
      const waypoint = getKnownWaypoint(waypointId)
      if (!waypoint) throw new Error(`Unknown waypoint: ${waypointId}`)
      if (!waypoints.some((current) => current.id === waypoint.id)) {
        waypoints.push(waypoint)
      }
    }
    if (waypoints.length === 0) {
      throw new Error('A saved route must keep at least one waypoint.')
    }
    if (waypoints.length > 16) {
      throw new Error('A saved route can contain at most 16 waypoints.')
    }

    const updated = await updateSavedCustomRoute(savedRoute.id, {
      ...(parsed.name !== undefined && parsed.name !== null
        ? { name: parsed.name }
        : {}),
      ...(parsed.targetDays !== undefined && parsed.targetDays !== null
        ? { targetDays: parsed.targetDays }
        : {}),
      ...(parsed.keepOrder !== undefined && parsed.keepOrder !== null
        ? { keepOrder: parsed.keepOrder }
        : {}),
      waypoints,
    })
    if (!updated) throw new Error('Saved route not found.')

    context.workingConfig = sanitizePlannerConfig({
      ...context.workingConfig,
      savedCustomRoutes: updated.routes,
    })
    context.selectedRouteId = updated.route.id
    const result = await context.ensureOptimized()
    const route = getSelectedRoute(result, updated.route.id)
    context.actions.push(`Updated saved route: ${updated.route.name}`)
    return {
      selectedRouteId: route.id,
      savedRoute: {
        id: updated.route.id,
        name: updated.route.name,
        targetDays: updated.route.targetDays,
        waypoints: updated.route.waypoints.map((waypoint) => ({
          id: waypoint.id,
          label: waypoint.label,
        })),
        keepOrder: Boolean(updated.route.keepOrder),
      },
      route: summarizeRoute(route),
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

  if (name === 'suggest_stays') {
    const parsed = routeDetailArgsSchema.parse(args)
    const result = await context.ensureOptimized()
    const route = getSelectedRoute(result, parsed.routeId ?? context.selectedRouteId)
    return suggestStaysForRoute(route, context.workingConfig)
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
    name: 'suggest_stays',
    description:
      'List the selected route\'s current multi-night basecamp stays plus the highest-rated places on the route that could earn longer stays at balanced or savor pace. Use before advising on trip pacing.',
    parameters: {
      type: 'object',
      properties: {
        routeId: { type: ['string', 'null'] },
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
        longestTripDays: { type: 'number' },
        plannerMode: {
          type: 'string',
          enum: ['longest_trip', 'most_unique_sites'],
        },
        tripPace: {
          type: 'string',
          enum: ['sprint', 'balanced', 'savor'],
          description:
            'How much the route lingers: rating-driven extra basecamp nights at top places (sprint = none, savor = most).',
        },
        autoStays: {
          type: 'boolean',
          description:
            'Longest Trip only: automatically give highly rated places multi-day stays with a new unique Supercharger each day.',
        },
        favoriteCategories: {
          type: 'array',
          items: { type: 'string', enum: Object.keys(PLACE_CATEGORY_LABELS) },
          description:
            'Place categories the user loves — rated higher when choosing stops and stay lengths. Replaces the whole list.',
        },
        mutedCategories: {
          type: 'array',
          items: { type: 'string', enum: Object.keys(PLACE_CATEGORY_LABELS) },
          description:
            'Place categories the user wants downplayed — rated lower for stops and stays. Replaces the whole list.',
        },
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
    name: 'search_catalog_locations',
    description:
      'Search the curated city and landmark catalog by text, state, type, or category. Use this before adding requested places unless the exact waypoint ID is already known.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        state: { type: 'string', description: 'Two-letter state code such as OH, CA, or TN.' },
        type: { type: 'string', enum: ['city', 'landmark'] },
        category: {
          type: 'string',
          enum: Object.keys(PLACE_CATEGORY_LABELS),
        },
        limit: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'add_required_waypoint',
    description:
      'Require routes to pass through a catalog waypoint corridor before reoptimizing. Use waypoint IDs returned by search_catalog_locations.',
    parameters: {
      type: 'object',
      properties: {
        waypointId: {
          type: 'string',
          description: 'Catalog waypoint ID, for example landmark-oh-pro-football-hall-of-fame.',
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
      'Create and optimize an additional Custom AI Route candidate through catalog waypoints in the exact order provided. Omit the start/end location from waypointIds.',
    parameters: {
      type: 'object',
      properties: {
        waypointIds: {
          type: 'array',
          minItems: 1,
          maxItems: 12,
          items: {
            type: 'string',
            description: 'Catalog waypoint ID returned by search_catalog_locations.',
          },
        },
      },
      required: ['waypointIds'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'update_saved_custom_route',
    description:
      'Persist and reoptimize one saved custom route. Batch every requested rename, route-specific day target, waypoint addition/removal, and order change into one call. Use catalog waypoint IDs.',
    parameters: {
      type: 'object',
      properties: {
        routeId: {
          type: ['string', 'null'],
          description: 'Saved route ID. Omit to edit the currently selected saved route.',
        },
        name: { type: ['string', 'null'] },
        targetDays: {
          type: ['number', 'null'],
          description:
            'Streak-day target for this saved route only. Does not change the global trip configuration.',
        },
        waypointIdsToAdd: {
          type: ['array', 'null'],
          maxItems: 16,
          items: { type: 'string' },
        },
        waypointIdsToRemove: {
          type: ['array', 'null'],
          maxItems: 16,
          items: { type: 'string' },
        },
        keepOrder: { type: ['boolean', 'null'] },
      },
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
    plannerMode: config.plannerMode,
    longestTripDays: config.longestTripDays,
    tripPace: config.tripPace,
    autoStays: config.autoStays,
    favoriteCategories: config.favoriteCategories,
    mutedCategories: config.mutedCategories,
    targetStations: config.targetStations,
    tripWeeks: config.tripWeeks,
    dailyDriveTargetHours: config.dailyDriveTargetHours,
    dailyDriveMaxHours: config.dailyDriveMaxHours,
    longDayOptimization: config.longDayOptimization,
    includeCanada: config.includeCanada,
    includeMexico: config.includeMexico,
    requiredWaypoints: config.requiredWaypoints,
    customRouteWaypoints: config.customRouteWaypoints,
    savedCustomRoutes: config.savedCustomRoutes.map((route) => ({
      id: route.id,
      name: route.name,
      targetDays: route.targetDays ?? config.longestTripDays,
      waypointCount: route.waypoints.length,
      waypoints: route.waypoints.map((waypoint) => ({
        id: waypoint.id,
        label: waypoint.label,
      })),
      keepOrder: Boolean(route.keepOrder),
    })),
    longestTripTargets: config.longestTripTargets,
  }
}

/** Group consecutive stay-tagged days into one entry per basecamp. */
function groupRouteStays(route: RoutePlan) {
  const stays: Array<{
    placeId: string
    label: string
    nights: number
    firstDay: number
    lastDay: number
  }> = []

  route.days.forEach((day) => {
    if (!day.stay) return
    const last = stays.at(-1)
    if (last && last.placeId === day.stay.placeId && day.stay.night > 1) {
      last.lastDay = day.day
      return
    }
    if (day.stay.night === 1) {
      stays.push({
        placeId: day.stay.placeId,
        label: day.stay.label,
        nights: day.stay.totalNights,
        firstDay: day.day,
        lastDay: day.day,
      })
    }
  })

  return stays
}

function suggestStaysForRoute(route: RoutePlan, config: PlannerConfig) {
  const currentStays = groupRouteStays(route)
  const currentIds = new Set(currentStays.map((stay) => stay.placeId))
  const placesOnRoute = new Map<string, (typeof PLACE_CATALOG)[number]>()

  route.visits.forEach((visit) => {
    PLACE_CATALOG.forEach((entry) => {
      if (placesOnRoute.has(entry.id)) return
      if (
        haversineMiles(visit.station.position, entry.position) <=
        entry.radiusMiles
      ) {
        placesOnRoute.set(entry.id, entry)
      }
    })
  })

  const candidates = [...placesOnRoute.values()]
    .map((entry) => {
      const rating = effectivePlaceRating(
        detailForCatalogPlace(entry).rating,
        entry.categories,
        config,
      )
      return {
        id: entry.id,
        label: entry.label,
        state: entry.state,
        effectiveRating: rating,
        suggestedDays: {
          balanced: suggestedStayDays(rating, 'balanced'),
          savor: suggestedStayDays(rating, 'savor'),
        },
        alreadyAStay: currentIds.has(entry.id),
      }
    })
    .filter((candidate) => candidate.suggestedDays.savor >= 2)
    .sort((a, b) => b.effectiveRating - a.effectiveRating)
    .slice(0, 12)

  return {
    tripPace: config.tripPace,
    autoStays: config.autoStays,
    currentStays,
    candidates,
    note: 'Longer stays need Longest Trip mode with autoStays on; each extra night reserves a new unique Supercharger near the place. Use set_trip_settings (tripPace/autoStays) or a manual visit target with stayDays to act on these.',
  }
}

function summarizeRoute(route: RoutePlan) {
  const composition = buildTripComposition(route)
  return {
    stays: groupRouteStays(route),
    id: route.id,
    plannerMode: route.plannerMode,
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
    rating: route.rating,
    composition: {
      bigCities: composition.bigCities,
      landmarks: composition.landmarks,
      teslaBadges: composition.teslaBadges,
      signatureStops: composition.signatureStops,
    },
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
    if (key === 'plannerMode') {
      if (value === 'longest_trip' || value === 'most_unique_sites') {
        settings.plannerMode = value
        return
      }

      ignoredFields.push(key)
      return
    }

    if (key === 'tripPace') {
      if (value === 'sprint' || value === 'balanced' || value === 'savor') {
        settings.tripPace = value
        return
      }

      ignoredFields.push(key)
      return
    }

    if (key === 'favoriteCategories' || key === 'mutedCategories') {
      if (
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === 'string' &&
            (PLACE_CATEGORY_VALUES as readonly string[]).includes(item),
        )
      ) {
        settings[key] = value as PlaceCategory[]
        return
      }

      ignoredFields.push(key)
      return
    }

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
