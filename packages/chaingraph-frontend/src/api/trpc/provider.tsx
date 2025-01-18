'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  loggerLink,
  splitLink,
  unstable_httpBatchStreamLink,
  unstable_httpSubscriptionLink,
} from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client.ts'

interface TrpcProviderProps {
  children: React.ReactNode
}

function getUrl() {
  // TODO: bake from env on build time
  return `http://localhost:3000/`
}

export function TrpcProvider({ children }: TrpcProviderProps) {
  // Create Query Client for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Disable automatic refetch on window focus
        retry: false, // Disable automatic retry on failure

        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
    },
  }))

  // Create tRPC client
  const [trpcClient] = useState(() =>
    trpc.createClient({
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
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
