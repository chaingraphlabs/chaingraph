import { initializeContext } from '@chaingraph/backend/context'
import {
  ExecutionService,
  InMemoryExecutionStore,
} from '@chaingraph/backend/execution'
import { InMemoryFlowStore } from '@chaingraph/backend/stores/flowStore'
import { wsServer } from '@chaingraph/backend/ws-server'
import { NodeCatalog, nodeRegistry } from '@chaingraph/nodes'
import {
  registerFlowTransformers,
  registerNodeTransformers,
} from '@chaingraph/types'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@chaingraph/types/port/plugins'
import { portRegistry } from '@chaingraph/types/port/registry'
import './setup'

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(EnumPortPlugin)
portRegistry.register(StreamPortPlugin)

registerNodeTransformers(nodeRegistry)
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

// const server = createHTTPServer({
//   middleware: cors(),
//   router: appRouter,
//   createContext,
// })
//
// server.listen(3000)
// console.log('Server running on http://localhost:3000')

wsServer()
