import type { AppRouter } from '@chaingraph/backend/router.ts'
import type { inferReactQueryProcedureOptions } from '@trpc/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCReact } from '@trpc/react-query'

// infer the types for your router
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// Create tRPC client with type safety
export const trpc = createTRPCReact<AppRouter>()
