/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient } from '@badaitech/chaingraph-executor/client'
import type { StoreWritable } from 'effector'
import { trpcDomain } from '@/store/domains'
import { createTRPCClient } from '@badaitech/chaingraph-executor/client'
import SuperJSON from 'superjson'

export const createTRPCExecutionClientEvent = trpcDomain.createEvent<{
  sessionBadAI?: string
  trpcURL?: string
  superjsonCustom?: typeof SuperJSON
}>()

export const $trpcExecutionClient: StoreWritable<TRPCClient | null> = trpcDomain.createStore<TRPCClient | null>(null)

$trpcExecutionClient
  .on(createTRPCExecutionClientEvent, (s, { sessionBadAI, trpcURL, superjsonCustom }) => {
    return createTRPCClient({
      url: trpcURL ?? `ws://localhost:4021`,
      superjsonCustom: superjsonCustom ?? SuperJSON,
      auth: {
        sessionBadAI,
      },
      wsClientCallbacks: {
        onError: (error) => {
          console.error('[TRPC Client] WebSocket error:', error)
        },
        onClose: (event) => {
          console.log('[TRPC Client] WebSocket closed:', event)
        },
        onOpen: () => {
          console.log('[TRPC Client] WebSocket opened')
        },
      },
    }) as TRPCClient
  })
