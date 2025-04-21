/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// import type { W } from '@trpc/client'
import type { inferReactQueryProcedureOptions } from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../server/router'
import { createTRPCReact } from '@trpc/react-query'

// infer the types for your router
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// Create tRPC client with type safety
export const trpcReact = createTRPCReact<AppRouter>()

// function getUrl() {
//   // TODO: bake from env on build time
//   return `http://localhost:3000/`
// }
//
// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false, // Disable automatic refetch on window focus
//       retry: false, // Disable automatic retry on failure
//
//       // With SSR, we usually want to set some default staleTime
//       // above 0 to avoid refetching immediately on the client
//       staleTime: 30 * 1000,
//     },
//   },
// })
//
// // export const _trpcClient = trpcReact.createClient({
// //   // transformer: superjson,
// //   links: [
// //     // adds pretty logs to your console in development and logs errors in production
// //     loggerLink({
// //       withContext: true,
// //     }),
// //
// //     splitLink({
// //       // uses the httpSubscriptionLink for subscriptions
// //       condition: op => op.type === 'subscription',
// //       true: unstable_httpSubscriptionLink({
// //         transformer: superjson,
// //         url: getUrl(),
// //       }),
// //       false: unstable_httpBatchStreamLink({
// //         transformer: superjson,
// //         url: getUrl(),
// //       }),
// //     }),
// //   ],
// // })
//
// export type WSClient = ReturnType<typeof createWSClient>
//
// // create persistent WebSocket connection
// export const wsClient: WSClient = createWSClient({
//   url: `ws://localhost:3001`,
//   onError: (err) => {
//     console.error('WebSocket error:', err)
//   },
// })
//
// // configure TRPCClient to use WebSockets transport
// export const trpcClient = createTRPCClient<AppRouter>({
//   links: [wsLink<AppRouter>({
//     transformer: SuperJSON,
//     client: wsClient,
//   })],
// })

export {
  createTRPCClient,
  getQueryClient,
  TRPCProvider,
  useTRPC,
  useTRPCClient,
} from './trpc'

export type { TRPCClient } from './trpc'
