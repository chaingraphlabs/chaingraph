/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient } from '@badaitech/chaingraph-trpc/client'
import type { StoreWritable } from 'effector'
import { createTRPCClient } from '@badaitech/chaingraph-trpc/client'
import { attach, combine, createEffect } from 'effector'
import SuperJSON from 'superjson'
import { globalReset } from '@/store/common'
import { trpcDomain } from '@/store/domains'

interface ClientConfig {
  sessionBadAI?: string
  trpcURL: string
  superjsonCustom: typeof SuperJSON
}

interface ClientWithConfig {
  client: TRPCClient
  config: ClientConfig
}

interface CreateClientParams {
  sessionBadAI?: string
  trpcURL?: string
  superjsonCustom?: typeof SuperJSON
}

interface CreateClientEffectParams {
  params: CreateClientParams
  state: { client: TRPCClient | null, config: ClientConfig | null }
}

export const createTRPCClientEvent = trpcDomain.createEvent<CreateClientParams>()

export const $trpcClient: StoreWritable<TRPCClient | null> = trpcDomain.createStore<TRPCClient | null>(null)
const $trpcClientConfig: StoreWritable<ClientConfig | null> = trpcDomain.createStore<ClientConfig | null>(null)

// Simple connection key function
function createConnectionKey(url: string, session?: string): string {
  return `${url}-${session || 'anonymous'}`
}

// Connection deduplication map
const activeConnections = new Map<string, TRPCClient>()

// Effect to create the TRPC client with connection deduplication
const createClientFx = trpcDomain.createEffect<ClientConfig, TRPCClient>((config) => {
  // Create simple connection key
  const connectionKey = createConnectionKey(config.trpcURL, config.sessionBadAI)

  // Check for existing connection
  if (activeConnections.has(connectionKey)) {
    return activeConnections.get(connectionKey)!
  }

  // Create new connection
  const client = createTRPCClient({
    url: config.trpcURL,
    superjsonCustom: config.superjsonCustom,
    auth: {
      sessionBadAI: config.sessionBadAI,
    },
    wsClientCallbacks: {
      onError: (error) => {
        console.error('[TRPC Client] WebSocket error:', error)
      },
      onClose: (event) => {
        console.log('[TRPC Client] WebSocket closed:', event)
        // Clean up connection on close
        activeConnections.delete(connectionKey)
      },
      onOpen: () => { },
    },
  }) as TRPCClient

  // Store connection in map
  activeConnections.set(connectionKey, client)

  return client
})

// Combine current state for comparison
const $currentState = combine(
  $trpcClient,
  $trpcClientConfig,
  (client, config) => ({ client, config }),
)

// Attached effect that returns both client and config when creating new client
const createClientIfNeededFx = attach({
  source: $currentState,
  effect: createEffect<CreateClientEffectParams, ClientWithConfig | null>(async ({ params, state }) => {
    const newConfig: ClientConfig = {
      sessionBadAI: params.sessionBadAI,
      trpcURL: params.trpcURL ?? `ws://localhost:3001`,
      superjsonCustom: params.superjsonCustom ?? SuperJSON,
    }

    const { client, config: currentConfig } = state

    // Check if configuration has changed
    const configChanged = !currentConfig
      || currentConfig.sessionBadAI !== newConfig.sessionBadAI
      || currentConfig.trpcURL !== newConfig.trpcURL
      || currentConfig.superjsonCustom !== newConfig.superjsonCustom

    if (!configChanged && client) {
      return {
        client,
        config: currentConfig!,
      }
    }

    // Create new client
    const newClient = await createClientFx(newConfig)

    // Return both client and config
    return {
      client: newClient,
      config: newConfig,
    }
  }),
  mapParams: (params: CreateClientParams, state) => ({
    params,
    state,
  }),
})

// Connect event to attached effect
createTRPCClientEvent.watch(createClientIfNeededFx)

// Update stores when a new client is created
$trpcClient
  .on(createClientIfNeededFx.doneData, (_, result) => {
    if (result) {
      return result.client
    }
    return _
  })
  .reset(globalReset)

$trpcClientConfig
  .on(createClientIfNeededFx.doneData, (_, result) => {
    if (result) {
      return result.config
    }
    return _
  })
  .reset(globalReset)
