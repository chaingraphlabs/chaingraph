import { procedures } from '@chaingraph/backend/procedures'
import { flowProcedures } from '@chaingraph/backend/procedures/flow'
import { nodeRegistryProcedures } from '@chaingraph/backend/procedures/nodeRegistry'
import { nodeProcedures } from '@chaingraph/backend/procedures/nodes'
import { createCallerFactory, router } from './trpc'

export const appRouter = router({
  testProcedures: procedures,
  flow: flowProcedures,
  nodeRegistry: nodeRegistryProcedures,
  nodes: nodeProcedures,
})
export type AppRouter = typeof appRouter

// Create and export the caller factory
export const createCaller = createCallerFactory(appRouter)
