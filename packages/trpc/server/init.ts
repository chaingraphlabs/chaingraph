/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import process from 'node:process'
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
import { drizzle } from 'drizzle-orm/node-postgres'
import { initializeContext } from './context'
import { CleanupService } from './executions/services/cleanup-service'
import { ExecutionService } from './executions/services/execution-service'
import { InMemoryExecutionStore } from './executions/store/execution-store'
import { DBFlowStore } from './stores/flowStore/dbFlowStore'

export function init() {
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

  // Initialize stores and context
  const db = drizzle(process.env.DATABASE_URL!)
  // const flowStore = new InMemoryFlowStore()
  const flowStore = new DBFlowStore(db)
  const nodesCatalog = new NodeCatalog()
  const executionStore = new InMemoryExecutionStore()
  const executionService = new ExecutionService(executionStore)
  const executionCleanup = new CleanupService(executionStore, executionService)

  initializeContext(
    db,
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
}
