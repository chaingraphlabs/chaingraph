import type {
  CategoryMetadata,
} from '@badaitech/chaingraph-types'
import { getCategoriesMetadata } from '@badaitech/chaingraph-nodes'
import {
  NodeCatalog,
  NodeRegistry,
  registerFlowTransformers,
  registerNodeTransformers,
} from '@badaitech/chaingraph-types'

import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@badaitech/chaingraph-types/port/plugins'
import { portRegistry } from '@badaitech/chaingraph-types/port/registry'
import { initializeContext } from './context'
import { ExecutionService, InMemoryExecutionStore } from './execution'
import { CleanupService } from './execution/services/cleanup-service'
import { InMemoryFlowStore } from './stores/flowStore'
import { wsServer } from './ws-server'
import './setup'

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(EnumPortPlugin)
portRegistry.register(StreamPortPlugin)

registerNodeTransformers(NodeRegistry.getInstance())
registerFlowTransformers()

// Execution event data
// SuperJSON.registerCustom<ExecutionEventImpl, JSONValue>(
//   {
//     isApplicable: (v): v is ExecutionEventImpl<any> => {
//       return v instanceof ExecutionEventImpl
//     },
//     serialize: (v) => {
//       return SuperJSON.serialize({
//         index: v.index,
//         type: v.type,
//         timestamp: v.timestamp,
//         data: SuperJSON.serialize(v.data),
//       }) as unknown as JSONValue
//     },
//     deserialize: (v) => {
//       const eventData = SuperJSON.deserialize(v as any) as any
//
//       if (!eventData) {
//         throw new Error('Invalid execution event data')
//       }
//
//       const data = SuperJSON.deserialize(eventData.data)
//
//       console.log('!!!!!!!!!Deserializing execution event:', data)
//
//       return new ExecutionEventImpl(
//         eventData.index,
//         eventData.type,
//         eventData.timestamp,
//         data,
//       )
//     },
//   },
//   ExecutionEventImpl.name,
// )

// Initialize stores and context
const flowStore = new InMemoryFlowStore()
const nodesCatalog = new NodeCatalog()
const executionStore = new InMemoryExecutionStore()
const executionService = new ExecutionService(executionStore)
const executionCleanup = new CleanupService(executionStore, executionService)

// register categories
getCategoriesMetadata().forEach((metadata: CategoryMetadata) => {
  nodesCatalog.registerCategory(metadata.id, metadata)
})

// register nodes
NodeRegistry.getInstance().getNodeTypes().forEach((type) => {
  const node = NodeRegistry.getInstance().createNode(type, `${type}-catalog`)
  nodesCatalog.registerNode(type, node)
})

initializeContext(
  flowStore,
  NodeRegistry.getInstance(),
  nodesCatalog,
  executionService,
  executionStore,
)

executionCleanup.start()

// const metricsCollector = new MetricsCollector(flowStore)
// metricsCollector.startMonitoring()

// const server = createHTTPServer({
//   middleware: cors(),
//   router: appRouter,
//   createContext,
// })
//
// server.listen(3000)
// console.log('Server running on http://localhost:3000')

wsServer()
