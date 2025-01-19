import type { AppRouter } from '@chaingraph/backend/router.ts'
import type { inferReactQueryProcedureOptions } from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { QueryClient } from '@tanstack/react-query'
import {
  loggerLink,
  splitLink,
  unstable_httpBatchStreamLink,
  unstable_httpSubscriptionLink,
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

export const trpcClient = trpc.createClient({
  // transformer: superjson,
  links: [
    // adds pretty logs to your console in development and logs errors in production
    loggerLink(),

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
