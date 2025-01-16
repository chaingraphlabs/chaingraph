import { createContext, initializeContext } from '@chaingraph/backend/context'
import { InMemoryFlowStore } from '@chaingraph/backend/stores/flowStore'
import { nodeRegistry } from '@chaingraph/nodes'

import {
  registerFlowTransformers,
  registerNodeTransformers,
  registerPortTransformers,
} from '@chaingraph/types'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import cors from 'cors'
import { appRouter } from './router'

registerPortTransformers()
registerNodeTransformers(nodeRegistry)
registerFlowTransformers()

// Initialize stores and context
const flowStore = new InMemoryFlowStore()
initializeContext(
  flowStore,
  nodeRegistry,
)

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext,
})

server.listen(3000)
console.log('Server running on http://localhost:3000')
