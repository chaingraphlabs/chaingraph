/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { executionRouter } from './execution'
import { procedures } from './procedures'
import { flowProcedures } from './procedures/flow'
import { nodeRegistryProcedures } from './procedures/nodeRegistry'
import { createCallerFactory, router } from './trpc'

export const appRouter = router({
  testProcedures: procedures,
  flow: flowProcedures,
  nodeRegistry: nodeRegistryProcedures,
  execution: executionRouter,
})
export type AppRouter = typeof appRouter

// Create and export the caller factory
export const createCaller = createCallerFactory(appRouter)
