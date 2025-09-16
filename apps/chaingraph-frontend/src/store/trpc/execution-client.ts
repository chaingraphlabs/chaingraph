/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient } from '@badaitech/chaingraph-executor/client'
import type { StoreWritable } from 'effector'
import { createTRPCClient } from '@badaitech/chaingraph-executor/client'
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

export const createTRPCExecutionClientEvent = trpcDomain.createEvent<CreateClientParams>()

export const $trpcClientExecutor: StoreWritable<TRPCClient | null> = trpcDomain.createStore<TRPCClient | null>(null)
const $trpcClientExecutorConfig: StoreWritable<ClientConfig | null> = trpcDomain.createStore<ClientConfig | null>(null)

// Effect to create the TRPC execution client
const createExecutorClientFx = createEffect<ClientConfig, TRPCClient>((config) => {
  console.log('[TRPC Executor Client] Creating client with config:', {
    url: config.trpcURL,
    hasSession: !!config.sessionBadAI,
  })

  return createTRPCClient({
    url: config.trpcURL,
    superjsonCustom: config.superjsonCustom,
    auth: {
      sessionBadAI: config.sessionBadAI,
    },
    wsClientCallbacks: {
      onError: (error) => {
        console.error('[TRPC Executor Client] WebSocket error:', error)
      },
      onClose: (event) => {
        console.log('[TRPC Executor Client] WebSocket closed:', event)
      },
      onOpen: () => {
        console.log('[TRPC Executor Client] WebSocket opened')
      },
    },
  }) as TRPCClient
})

// Combine current state for comparison
const $currentExecutorState = combine(
  $trpcClientExecutor,
  $trpcClientExecutorConfig,
  (client, config) => ({ client, config }),
)

// Attached effect that returns both client and config when creating new client
const createExecutorClientIfNeededFx = attach({
  source: $currentExecutorState,
  effect: createEffect<CreateClientEffectParams, ClientWithConfig | null>(async ({ params, state }) => {
    const newConfig: ClientConfig = {
      sessionBadAI: params.sessionBadAI,
      trpcURL: params.trpcURL ?? `ws://localhost:4021`,
      superjsonCustom: params.superjsonCustom ?? SuperJSON,
    }

    const { client, config: currentConfig } = state

    // Check if configuration has changed
    const configChanged = !currentConfig
      || currentConfig.sessionBadAI !== newConfig.sessionBadAI
      || currentConfig.trpcURL !== newConfig.trpcURL
      || currentConfig.superjsonCustom !== newConfig.superjsonCustom

    if (!configChanged && client) {
      console.log('[TRPC Executor Client] Configuration unchanged, reusing existing client')
      return null
    }

    // Create new client
    const newClient = await createExecutorClientFx(newConfig)

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
createTRPCExecutionClientEvent.watch(createExecutorClientIfNeededFx)

// Update stores when a new client is created
$trpcClientExecutor
  .on(createExecutorClientIfNeededFx.doneData, (_, result) => {
    if (result) {
      return result.client
    }
    return _
  })
  .reset(globalReset)

$trpcClientExecutorConfig
  .on(createExecutorClientIfNeededFx.doneData, (_, result) => {
    if (result) {
      return result.config
    }
    return _
  })
  .reset(globalReset)
