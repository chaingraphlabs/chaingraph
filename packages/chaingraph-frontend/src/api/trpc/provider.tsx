import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client.ts'

interface TrpcProviderProps {
  children: React.ReactNode
}

export function TrpcProvider({ children }: TrpcProviderProps) {
  // Create Query Client for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Disable automatic refetch on window focus
        retry: false, // Disable automatic retry on failure
      },
    },
  }))

  // Create tRPC client
  const [trpcClient] = useState(() =>
    trpc.createClient({
      // transformer: superjson,
      links: [
        httpBatchLink({
          transformer: superjson,
          url: 'http://localhost:3000/', // Your API URL
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
