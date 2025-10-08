/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionRouter } from '@badaitech/chaingraph-executor/server'
import type { AppRouter } from '@badaitech/chaingraph-trpc/server'
import { createTRPCReact } from '@trpc/react-query'
import { createContext } from 'react'

// Create custom contexts for each tRPC client to avoid conflicts
export const executorTRPCContext = createContext(null)
export const mainTRPCContext = createContext(null)

// Create tRPC React instances with custom contexts
export const executorTRPC: ReturnType<typeof createTRPCReact<ExecutionRouter>> = createTRPCReact<ExecutionRouter>({
  context: executorTRPCContext,
})

export const mainTRPC: ReturnType<typeof createTRPCReact<AppRouter>> = createTRPCReact<AppRouter>({
  context: mainTRPCContext,
})

// interface ExecutorProviderWrapperProps {
//   children: ReactNode
//   trpcClient: ExecutorTRPCClient | null
//   queryClient: QueryClient
// }
//
// export function ExecutorProviderWrapper({ children, trpcClient, queryClient }: ExecutorProviderWrapperProps) {
//   if (!trpcClient) {
//     return <>{children}</>
//   }
//
//   return (
//     <executorTRPC.Provider client={trpcClient} queryClient={queryClient}>
//       <QueryClientProvider client={queryClient}>
//         {children}
//       </QueryClientProvider>
//     </executorTRPC.Provider>
//   )
// }

// interface MainProviderWrapperProps {
//   children: ReactNode
//   trpcClient: MainTRPCClient | null
//   queryClient: QueryClient
// }
//
// export function MainProviderWrapper({ children, trpcClient, queryClient }: MainProviderWrapperProps) {
//   if (!trpcClient) {
//     return <>{children}</>
//   }
//
//   return (
//     <mainTRPC.Provider client={trpcClient} queryClient={queryClient}>
//       <QueryClientProvider client={queryClient}>
//         {children}
//       </QueryClientProvider>
//     </mainTRPC.Provider>
//   )
// }
