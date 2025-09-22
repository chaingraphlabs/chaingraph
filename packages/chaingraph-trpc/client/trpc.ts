/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AppRouter } from '../server/router'
import { QueryClient } from '@tanstack/react-query'
import {
  createTRPCClient as _createTRPCClient,
  createWSClient,
  wsLink,

} from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import SuperJSON from 'superjson'

// Authentication-related configuration
interface AuthOptions {
  sessionBadAI?: string
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        retry: true,

        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 1000,
      },
    },
  })
}

let browserMainQueryClient: QueryClient | undefined

export function getMainQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserMainQueryClient)
      browserMainQueryClient = makeQueryClient()
    return browserMainQueryClient
  }
}

// Keep old export for backward compatibility
export const getQueryClient = getMainQueryClient

export function createTRPCClient(
  opts: {
    url: string
    superjsonCustom?: typeof SuperJSON
    auth?: AuthOptions

    wsClientCallbacks?: {
      onOpen?: () => void
      onError?: (err?: Event) => void
      onClose?: (cause?: { code?: number }) => void
    }
  } = {
    url: `ws://localhost:3001`,
    superjsonCustom: SuperJSON,
  },
) {
  const token = opts.auth?.sessionBadAI || undefined

  return _createTRPCClient<AppRouter>({
    links: [
      wsLink<AppRouter>({
        transformer: opts?.superjsonCustom ?? SuperJSON,
        client: createWSClient({
          url: opts.url,
          connectionParams: {
            sessionBadAI: token,
          },
          onOpen: () => {
            // console.log('WebSocket connection opened')
            opts.wsClientCallbacks?.onOpen && opts.wsClientCallbacks.onOpen()
          },
          onError: (event) => {
            // console.error('WebSocket error event:', event)
            opts.wsClientCallbacks?.onError && opts.wsClientCallbacks.onError(event)
          },
          onClose: (cause) => {
            // console.error('WebSocket connection closed:', cause)
            opts.wsClientCallbacks?.onClose && opts.wsClientCallbacks.onClose(cause)
          },
          keepAlive: {
            enabled: true,
            intervalMs: 5000,
            pongTimeoutMs: 3000,
          },
        }),
      }),
    ],
  })
}

export type TRPCClient = ReturnType<typeof createTRPCClient>

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()
