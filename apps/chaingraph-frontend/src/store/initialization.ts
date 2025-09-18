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
import { attach, combine, createEffect, sample } from 'effector'
import SuperJSON from 'superjson'
import { fetchCategorizedNodesFx } from './categories'
import { initializationDomain } from './domains'
import { loadFlowsListFx } from './flow'
import { DEFAULT_INIT_KEY, initTracker } from './initialization-tracker'
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
const startAppInternal = initializationDomain.createEvent<AppInternalConfig>()
export const resetApp = initializationDomain.createEvent()

// Initialization domain events and stores
export const initializationRequested = initializationDomain.createEvent<{
  sessionOrProvider: string | SessionProvider
  config?: ChainGraphConfig
  initKey?: object | symbol
}>()

// Locking mechanism to prevent race conditions
export const acquireInitLock = initializationDomain.createEvent<string>()
export const releaseInitLock = initializationDomain.createEvent<string>()

// Store for tracking initialization lock
const $initLock = initializationDomain.createStore<string | null>(null)
  .on(acquireInitLock, (_, lockId) => lockId)
  .on(releaseInitLock, (state, lockId) => state === lockId ? null : state)
  .reset(resetApp)

// Track initialization config to detect changes
const $lastInitConfig = initializationDomain.createStore<AppInternalConfig | null>(null)
  .on(startAppInternal, (_, config) => config)
  .reset(resetApp)

// Track if initialization is in progress (will be defined after effects)

// Stores
const $appConfig = initializationDomain.createStore<AppInternalConfig | null>(null)
  .on(startAppInternal, (_, config) => config)
  .reset(resetApp)

export const $initState = initializationDomain.createStore<InitializationState>({
  sessionSet: false,
  nodeRegistryInitialized: false,
  trpcClientsCreated: false,
  dataFetched: false,
  error: null,
})
  .reset(resetApp)

// Effects

// 1. Initialize node registry
const initializeNodeRegistryFx = initializationDomain.createEffect<AppInternalConfig, void>((config) => {
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
const createTRPCClientsFx = initializationDomain.createEffect<AppInternalConfig, void>((config) => {
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
const fetchInitialDataFx = initializationDomain.createEffect(async () => {
  await Promise.all([
    fetchCategorizedNodesFx(),
    loadFlowsListFx(),
  ])
})

// Track if initialization is in progress
const $isInitializing = initializationDomain.createStore<boolean>(false)
  .on(startAppInternal, () => true)
  .on(fetchInitialDataFx.done, () => false)
  .on(fetchInitialDataFx.fail, () => false)
  .reset(resetApp)

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

// Smart initialization effect with locking and tracking
const smartInitializationFx = attach({
  source: combine({
    lock: $initLock,
    lastConfig: $lastInitConfig,
    mainClient: $trpcClient,
    executorClient: $trpcClientExecutor,
    isInitializing: $isInitializing,
  }),
  effect: createEffect(async ({
    request,
    source,
  }: {
    request: { sessionOrProvider: string | SessionProvider, config?: ChainGraphConfig, initKey?: object | symbol }
    source: { lock: string | null, lastConfig: AppInternalConfig | null, mainClient: any, executorClient: any, isInitializing: boolean }
  }) => {
    const { sessionOrProvider, config, initKey = DEFAULT_INIT_KEY } = request
    const { lock, lastConfig, mainClient, executorClient, isInitializing } = source

    // Check if already locked (synchronous race condition check)
    if (lock !== null) {
      console.log('[ChainGraph] Initialization locked, skipping duplicate call')
      return
    }

    // Check initialization tracker first
    const existingPromise = initTracker.getPromise(initKey)
    if (existingPromise) {
      console.log('[ChainGraph] Reusing existing initialization promise')
      return existingPromise
    }

    // Generate lock ID and acquire lock
    const lockId = crypto.randomUUID()
    acquireInitLock(lockId)

    try {
      // Resolve session
      const sessionToken = typeof sessionOrProvider === 'function'
        ? await sessionOrProvider()
        : sessionOrProvider

      const newConfig: AppInternalConfig = {
        sessionToken,
        trpcMainURL: config?.trpcMainURL ?? 'ws://localhost:3001',
        trpcExecutorURL: config?.trpcExecutorURL ?? 'ws://localhost:4021',
        superjsonCustom: config?.superjsonCustom ?? SuperJSON,
        nodeRegistry: config?.nodeRegistry,
      }

      // Check if initialization is needed
      const configChanged = !lastConfig
        || lastConfig.sessionToken !== newConfig.sessionToken
        || lastConfig.trpcMainURL !== newConfig.trpcMainURL
        || lastConfig.trpcExecutorURL !== newConfig.trpcExecutorURL
        || lastConfig.superjsonCustom !== newConfig.superjsonCustom

      const hasExistingClients = mainClient && executorClient

      if (!configChanged && hasExistingClients && !isInitializing) {
        console.log('[ChainGraph] Configuration unchanged and clients exist, skipping initialization')
        return
      }

      console.log('[ChainGraph] Starting initialization with new configuration')
      startAppInternal(newConfig)

      // Wait for initialization to complete
      return new Promise<void>((resolve, reject) => {
        const unwatch = $isAppReady.watch((isReady) => {
          if (isReady) {
            unwatch()
            resolve()
          }
        })

        const unwatchError = $initializationError.watch((error) => {
          if (error) {
            unwatchError()
            unwatch()
            reject(error)
          }
        })
      })
    } finally {
      // Always release the lock
      releaseInitLock(lockId)
    }
  }),
  mapParams: (request: { sessionOrProvider: string | SessionProvider, config?: ChainGraphConfig, initKey?: object | symbol }, source) => ({
    request,
    source,
  }),
})

// Connect initialization request to smart effect
sample({
  clock: initializationRequested,
  target: smartInitializationFx,
})

// Public API - Unified initialization function with tracking
export function initChainGraph(sessionOrProvider: string | SessionProvider, config?: ChainGraphConfig, initKey?: object | symbol): Promise<void> {
  const key = initKey || DEFAULT_INIT_KEY

  // Check if already initialized/initializing
  const existingPromise = initTracker.getPromise(key)
  if (existingPromise) {
    console.log('[ChainGraph] Reusing existing initialization')
    return existingPromise
  }

  // Create new initialization promise
  const initPromise = new Promise<void>((resolve, reject) => {
    // Trigger initialization through effector
    initializationRequested({ sessionOrProvider, config, initKey: key })

    // Wait for completion
    const unsubscribe = $isAppReady.watch((isReady) => {
      if (isReady) {
        unsubscribe()
        resolve()
      }
    })

    // Handle errors
    const unsubscribeError = $initializationError.watch((error) => {
      if (error) {
        unsubscribeError()
        unsubscribe()
        reject(error)
      }
    })
  })

  // Track this initialization
  return initTracker.track(key, initPromise)
}

// Helper to reset initialization (useful for testing)
export function resetChainGraphInitialization(initKey?: object | symbol): void {
  const key = initKey || DEFAULT_INIT_KEY
  initTracker.reset(key)
  resetApp()
}

// Helper to check if initialization is complete
export function isChainGraphInitialized(initKey?: object | symbol): boolean {
  const key = initKey || DEFAULT_INIT_KEY
  return initTracker.isInitialized(key)
}

// Export session providers for convenience
export { sessionProviders } from './session'
