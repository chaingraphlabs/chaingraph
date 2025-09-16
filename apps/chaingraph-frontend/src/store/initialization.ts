/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeRegistry } from '@badaitech/chaingraph-types'
import { initializeNodes } from '@badaitech/chaingraph-nodes'
import { NodeRegistry as NodeRegistryClass, registerSuperjsonTransformers } from '@badaitech/chaingraph-types'
import { combine, createEffect, createEvent, createStore, sample } from 'effector'
import SuperJSON from 'superjson'
import { fetchCategorizedNodesFx } from './categories'
import { loadFlowsListFx } from './flow'
import { initInterpolatorFx } from './nodes'
import { $session, setSession } from './session'
import { $trpcClientExecutor, createTRPCExecutionClientEvent } from './trpc/execution-client'
import { $trpcClient, createTRPCClientEvent } from './trpc/store'

// Public API Types
export interface ChainGraphConfig {
  trpcMainURL?: string // Editor/flows endpoint (default: ws://localhost:3001)
  trpcExecutorURL?: string // Execution endpoint (default: ws://localhost:4021)
  superjsonCustom?: typeof SuperJSON
  nodeRegistry?: NodeRegistry
  theme?: 'dark' | 'light'
}

// Internal types
interface AppInternalConfig {
  sessionToken: string
  trpcMainURL: string
  trpcExecutorURL: string
  superjsonCustom: typeof SuperJSON
  nodeRegistry?: NodeRegistry
}

interface InitializationState {
  sessionSet: boolean
  nodeRegistryInitialized: boolean
  trpcClientsCreated: boolean
  dataFetched: boolean
  error: Error | null
}

// Session provider type
export type SessionProvider = () => string | Promise<string>

// Events
const startAppInternal = createEvent<AppInternalConfig>()
export const resetApp = createEvent()

// Stores
const $appConfig = createStore<AppInternalConfig | null>(null)
  .on(startAppInternal, (_, config) => config)
  .reset(resetApp)

export const $initState = createStore<InitializationState>({
  sessionSet: false,
  nodeRegistryInitialized: false,
  trpcClientsCreated: false,
  dataFetched: false,
  error: null,
})
  .reset(resetApp)

// Effects

// 1. Initialize node registry
const initializeNodeRegistryFx = createEffect<AppInternalConfig, void>((config) => {
  initializeNodes((_nodeRegistry: NodeRegistry) => {
    if (config.nodeRegistry) {
      config.nodeRegistry.copyFrom(_nodeRegistry)
    }
    NodeRegistryClass.setInstance(config.nodeRegistry ?? _nodeRegistry)
  })

  registerSuperjsonTransformers(
    config.superjsonCustom,
    NodeRegistryClass.getInstance(),
  )

  // Initialize interpolator
  initInterpolatorFx()
})

// 2. Create TRPC clients effect
const createTRPCClientsFx = createEffect<AppInternalConfig, void>((config) => {
  // Create main TRPC client for editor/flows
  createTRPCClientEvent({
    sessionBadAI: config.sessionToken,
    trpcURL: config.trpcMainURL,
    superjsonCustom: config.superjsonCustom,
  })

  // Create executor TRPC client for execution
  createTRPCExecutionClientEvent({
    sessionBadAI: config.sessionToken,
    trpcURL: config.trpcExecutorURL,
    superjsonCustom: config.superjsonCustom,
  })
})

// 3. Fetch initial data
const fetchInitialDataFx = createEffect(async () => {
  await Promise.all([
    fetchCategorizedNodesFx(),
    loadFlowsListFx(),
  ])
})

// Chain the initialization flow using sample

// Step 1: When app starts → set session and initialize node registry
sample({
  clock: startAppInternal,
  fn: config => config.sessionToken,
  target: setSession,
})

sample({
  clock: startAppInternal,
  target: initializeNodeRegistryFx,
})

// Step 2: When node registry initialized → create TRPC clients
sample({
  clock: initializeNodeRegistryFx.done,
  source: $appConfig,
  filter: Boolean,
  target: createTRPCClientsFx,
})

// Step 3: When TRPC clients are ready → fetch initial data
sample({
  clock: combine($trpcClient, $trpcClientExecutor),
  source: combine($trpcClient, $trpcClientExecutor),
  filter: ([client, executor]) => client !== null && executor !== null,
  fn: () => undefined,
  target: fetchInitialDataFx,
})

// Update initialization state
$initState
  .on(startAppInternal, state => ({ ...state, sessionSet: true }))
  .on(initializeNodeRegistryFx.done, state => ({ ...state, nodeRegistryInitialized: true }))
  .on(initializeNodeRegistryFx.fail, (state, { error }) => ({ ...state, error }))
  .on(createTRPCClientsFx.done, state => ({ ...state, trpcClientsCreated: true }))
  .on(createTRPCClientsFx.fail, (state, { error }) => ({ ...state, error }))
  .on(fetchInitialDataFx.done, state => ({ ...state, dataFetched: true }))
  .on(fetchInitialDataFx.fail, (state, { error }) => ({ ...state, error }))

// Derived stores for app readiness
export const $isAppReady = combine(
  $initState,
  $trpcClient,
  $trpcClientExecutor,
  $session,
  (state, client, executor, session) =>
    state.sessionSet
    && state.nodeRegistryInitialized
    && client !== null
    && executor !== null
    && session !== null
    && state.dataFetched
    && !state.error,
)

export const $initializationError = $initState.map(state => state.error)

export const $initializationProgress = combine(
  $initState,
  (state) => {
    if (state.error)
      return 'error'
    if (state.dataFetched)
      return 'complete'
    if (state.trpcClientsCreated)
      return 'fetching-data'
    if (state.nodeRegistryInitialized)
      return 'creating-clients'
    if (state.sessionSet)
      return 'initializing-registry'
    return 'setting-session'
  },
)

// Public API - Unified initialization function
export function initChainGraph(sessionOrProvider: string | SessionProvider, config?: ChainGraphConfig): Promise<void> {
  // Resolve session
  const sessionPromise = typeof sessionOrProvider === 'function'
    ? Promise.resolve(sessionOrProvider())
    : Promise.resolve(sessionOrProvider)

  return sessionPromise.then((sessionToken) => {
    // Start the app with resolved session and config
    startAppInternal({
      sessionToken,
      trpcMainURL: config?.trpcMainURL ?? 'ws://localhost:3001',
      trpcExecutorURL: config?.trpcExecutorURL ?? 'ws://localhost:4021',
      superjsonCustom: config?.superjsonCustom ?? SuperJSON,
      nodeRegistry: config?.nodeRegistry,
    })
  })
}

// Export session providers for convenience
export { sessionProviders } from './session'
