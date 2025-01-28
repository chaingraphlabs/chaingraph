import { createContext, initializeContext } from '@chaingraph/backend/context'
import {
  ExecutionService,
  InMemoryExecutionStore,
} from '@chaingraph/backend/execution'
import { InMemoryFlowStore } from '@chaingraph/backend/stores/flowStore'
import { NodeCatalog, nodeRegistry } from '@chaingraph/nodes'
import {
  registerFlowTransformers,
  registerNodeTransformers,
  registerPortTransformers,
} from '@chaingraph/types'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import cors from 'cors'
import { appRouter } from './router'
import './setup'

registerPortTransformers()
registerNodeTransformers(nodeRegistry)
registerFlowTransformers()

// Initialize stores and context
const flowStore = new InMemoryFlowStore()
const nodesCatalog = new NodeCatalog(nodeRegistry)
const executionStore = new InMemoryExecutionStore()
const executionService = new ExecutionService(executionStore)

initializeContext(
  flowStore,
  nodeRegistry,
  nodesCatalog,
  executionService,
  executionStore,
)

// const metricsCollector = new MetricsCollector(flowStore)
// metricsCollector.startMonitoring()

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext,
})

server.listen(3000)
console.log('Server running on http://localhost:3000')
