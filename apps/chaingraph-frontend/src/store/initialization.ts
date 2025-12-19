/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { initializeNodes } from '@badaitech/chaingraph-nodes'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { registerSuperjsonTransformers, setTransformerTraceCallbacks } from '@badaitech/chaingraph-types'
import { combine, sample } from 'effector'
import SuperJSON from 'superjson'
import { trace } from '@/lib/perf-trace'
import { fetchCategorizedNodesFx } from './categories'
import { initializationDomain } from './domains'
import { loadFlowsListFx } from './flow'
import { initInterpolatorFx } from './nodes'
// Import ports-v2 to register all sample() wiring for granular port stores
// This enables the buffering system, echo detection, initialization handlers, etc.
import '@/store/ports-v2'
import { setSession } from './session'
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

// Session provider type
export type SessionProvider = () => string | Promise<string>

// Events
export const resetApp = initializationDomain.createEvent()
export const initializeApp = initializationDomain.createEvent<{
  session: string
  config?: ChainGraphConfig
}>()

// Simplified initialization state
export type InitStatus = 'idle' | 'initializing' | 'ready' | 'error'

export const $initStatus = initializationDomain.createStore<InitStatus>('idle')
  .reset(resetApp)

export const $initError = initializationDomain.createStore<Error | null>(null)
  .reset(resetApp)

// Store current configuration to detect changes
const $currentConfig = initializationDomain.createStore<AppInternalConfig | null>(null)
  .reset(resetApp)

// No longer need separate effects - everything is in the main effect

// Derived stores
export const $isAppReady = $initStatus.map(status => status === 'ready')
export const $isInitializing = $initStatus.map(status => status === 'initializing')

// Main initialization effect
const initializeAppFx = initializationDomain.createEffect<AppInternalConfig, void>(async (config) => {
  // Set session
  setSession(config.sessionToken)

  // Initialize node registry
  initializeNodes((_nodeRegistry: NodeRegistry) => {
    if (config.nodeRegistry) {
      config.nodeRegistry.copyFrom(_nodeRegistry)
    }
    NodeRegistry.setInstance(config.nodeRegistry ?? _nodeRegistry)
  })

  registerSuperjsonTransformers(
    config.superjsonCustom,
    NodeRegistry.getInstance(),
  )

  // Connect trace callbacks for deserialization tracing (dev mode only)
  if (import.meta.env.DEV) {
    setTransformerTraceCallbacks({
      onDeserializeStart: (type) => trace.start(`deserialize.${type}`, { category: 'io' }),
      onDeserializeEnd: (spanId) => {
        if (spanId) trace.end(spanId)
      },
    })
  }

  initInterpolatorFx()

  // Create TRPC clients
  createTRPCClientEvent({
    sessionBadAI: config.sessionToken,
    trpcURL: config.trpcMainURL,
    superjsonCustom: config.superjsonCustom,
  })

  createTRPCExecutionClientEvent({
    sessionBadAI: config.sessionToken,
    trpcURL: config.trpcExecutorURL,
    superjsonCustom: config.superjsonCustom,
  })

  // Wait for clients to be ready
  await new Promise<void>((resolve) => {
    const unwatch = combine($trpcClient, $trpcClientExecutor).watch(([client, executor]) => {
      if (client && executor) {
        unwatch()
        resolve()
      }
    })
  })

  // Fetch initial data
  await Promise.all([
    fetchCategorizedNodesFx(),
    loadFlowsListFx(),
  ])
})

// Update initialization status
$initStatus
  .on(initializeAppFx, () => 'initializing')
  .on(initializeAppFx.done, () => 'ready')
  .on(initializeAppFx.fail, () => 'error')

$initError
  .on(initializeAppFx.fail, (_, { error }) => error)
  .on(initializeAppFx.done, () => null)

$currentConfig
  .on(initializeAppFx, (_, config) => config)

// Sample initialization event to effect
sample({
  source: combine($currentConfig, $initStatus),
  clock: initializeApp,
  filter: ([currentConfig, status], { session, config }) => {
    // Build new config
    const newConfig: AppInternalConfig = {
      sessionToken: session,
      trpcMainURL: config?.trpcMainURL ?? 'ws://localhost:3001',
      trpcExecutorURL: config?.trpcExecutorURL ?? 'ws://localhost:4021',
      superjsonCustom: config?.superjsonCustom ?? SuperJSON,
      nodeRegistry: config?.nodeRegistry,
    }

    // Allow initialization if idle or error state
    if (status === 'idle' || status === 'error') {
      return true
    }

    // Check if config actually changed
    if (currentConfig && status === 'ready') {
      const configChanged
        = currentConfig.sessionToken !== newConfig.sessionToken
          || currentConfig.trpcMainURL !== newConfig.trpcMainURL
          || currentConfig.trpcExecutorURL !== newConfig.trpcExecutorURL

      if (configChanged) {
        return true
      }
    }

    return false
  },
  fn: (_, { session, config }) => ({
    sessionToken: session,
    trpcMainURL: config?.trpcMainURL ?? 'ws://localhost:3001',
    trpcExecutorURL: config?.trpcExecutorURL ?? 'ws://localhost:4021',
    superjsonCustom: config?.superjsonCustom ?? SuperJSON,
    nodeRegistry: config?.nodeRegistry,
  }),
  target: initializeAppFx,
})

// Public API - Simplified initialization function
export async function initChainGraph(
  sessionOrProvider: string | SessionProvider,
  config?: ChainGraphConfig,
): Promise<void> {
  // Resolve session if it's a provider function
  const session = typeof sessionOrProvider === 'function'
    ? await sessionOrProvider()
    : sessionOrProvider

  // Trigger initialization
  initializeApp({ session, config })

  // Wait for initialization to complete
  // return new Promise<void>((resolve, reject) => {
  //   const unwatch = $initStatus.watch((status) => {
  //     if (status === 'ready') {
  //       unwatch()
  //       resolve()
  //     } else if (status === 'error') {
  //       const error = $initError.getState()
  //       unwatch()
  //       reject(error || new Error('Initialization failed'))
  //     }
  //   })
  // })
}

// Helper to reset initialization (useful for testing)
export function resetChainGraphInitialization(): void {
  resetApp()
}

// Helper to check if initialization is complete
export function isChainGraphInitialized(): boolean {
  return $initStatus.getState() === 'ready'
}

// Export session providers for convenience
export { sessionProviders } from './session'
