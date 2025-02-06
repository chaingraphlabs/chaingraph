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
