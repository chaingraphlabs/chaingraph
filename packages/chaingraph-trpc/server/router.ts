/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { mcpProcedures } from './mcp'
import { flowProcedures } from './procedures/flow'
import { nodeRegistryProcedures } from './procedures/nodeRegistry'
import { secretProcedures } from './procedures/secrets'
import { userProcedures } from './procedures/users'
import { createCallerFactory, router } from './trpc'

export const appRouter = router({
  flow: flowProcedures,
  nodeRegistry: nodeRegistryProcedures,
  secrets: secretProcedures,
  // execution: executionRouter,
  mcp: mcpProcedures,
  users: userProcedures,
})
export type AppRouter = typeof appRouter

// Create and export the caller factory
export const createCaller = createCallerFactory(appRouter)

export * from './export'
