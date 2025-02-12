/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  CategoryMetadata,
} from '@badaitech/chaingraph-types'
import { getCategoriesMetadata } from '@badaitech/chaingraph-nodes'
import {
  AnyPortPlugin,
  ArrayPortPlugin,
  BooleanPortPlugin,
  EnumPortPlugin,
  NodeCatalog,
  NodeRegistry,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortPluginRegistry,
  registerFlowTransformers,
  registerNodeTransformers,
  StreamPortPlugin,
  StringPortPlugin,
} from '@badaitech/chaingraph-types'

import { initializeContext } from './context'
import { ExecutionService, InMemoryExecutionStore } from './execution'
import { CleanupService } from './execution/services/cleanup-service'
import { InMemoryFlowStore } from './stores/flowStore'
import { wsServer } from './ws-server'
import './setup'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)
PortPluginRegistry.getInstance().register(AnyPortPlugin)
PortPluginRegistry.getInstance().register(BooleanPortPlugin)

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

initializeContext(
  flowStore,
  NodeRegistry.getInstance(),
  nodesCatalog,
  executionService,
  executionStore,
)

// register categories
getCategoriesMetadata().forEach((metadata: CategoryMetadata) => {
  nodesCatalog.registerCategory(metadata.id, metadata)
})

// register nodes
NodeRegistry.getInstance().getNodeTypes().forEach((type) => {
  const node = NodeRegistry.getInstance().createNode(type, `${type}-catalog`)
  nodesCatalog.registerNode(type, node)
})

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
