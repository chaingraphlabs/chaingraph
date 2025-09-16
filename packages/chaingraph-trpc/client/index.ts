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

export {
  createTRPCClient,
  getMainQueryClient,
  getQueryClient,
  TRPCProvider,
  useTRPC,
  useTRPCClient,
} from './trpc'

export type { TRPCClient } from './trpc'
