/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AppRouter } from '@badaitech/chaingraph-backend/router'
import type { inferReactQueryProcedureOptions } from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { QueryClient } from '@tanstack/react-query'
import {
  createTRPCClient,
  createWSClient,
  loggerLink,
  splitLink,
  unstable_httpBatchStreamLink,
  unstable_httpSubscriptionLink,
  wsLink,
} from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'

// infer the types for your router
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// Create tRPC client with type safety
export const trpc = createTRPCReact<AppRouter>()

function getUrl() {
  // TODO: bake from env on build time
  return `http://localhost:3000/`
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      retry: false, // Disable automatic retry on failure

      // With SSR, we usually want to set some default staleTime
      // above 0 to avoid refetching immediately on the client
      staleTime: 30 * 1000,
    },
  },
})

export const _trpcClient = trpc.createClient({
  // transformer: superjson,
  links: [
    // adds pretty logs to your console in development and logs errors in production
    loggerLink({
      withContext: true,
    }),

    splitLink({
      // uses the httpSubscriptionLink for subscriptions
      condition: op => op.type === 'subscription',
      true: unstable_httpSubscriptionLink({
        transformer: superjson,
        url: getUrl(),
      }),
      false: unstable_httpBatchStreamLink({
        transformer: superjson,
        url: getUrl(),
      }),
    }),
  ],
})

// create persistent WebSocket connection
export const wsClient = createWSClient({
  url: `ws://localhost:3001`,
  onError: (err) => {
    console.error('WebSocket error:', err)
  },
})
// configure TRPCClient to use WebSockets transport
export const trpcClient = createTRPCClient<AppRouter>({
  links: [wsLink<AppRouter>({
    transformer: superjson,
    client: wsClient,
  })],
})
