import { NodeCatalog } from '@badaitech/chaingraph-nodes/dist'
import {
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
} from '@badaitech/chaingraph-types/dist/port/plugins'
import { portRegistry } from 'packages/chaingraph-types/src/port/registry'
import { initializeContext } from './context'
import { ExecutionService, InMemoryExecutionStore } from './execution'
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
const nodesCatalog = new NodeCatalog(NodeRegistry.getInstance())
const executionStore = new InMemoryExecutionStore()
const executionService = new ExecutionService(executionStore)

initializeContext(
  flowStore,
  NodeRegistry.getInstance(),
  nodesCatalog,
  executionService,
  executionStore,
)

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
