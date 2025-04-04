/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import type { IFlowStore } from './stores/flowStore/types'
import process from 'node:process'
import { getCategoriesMetadata } from '@badaitech/chaingraph-nodes'
import { NodeCatalog, NodeRegistry, registerSuperjsonTransformers } from '@badaitech/chaingraph-types'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import SuperJSON from 'superjson'
import { initializeContext } from './context'
import { CleanupService } from './executions/services/cleanup-service'
import { ExecutionService } from './executions/services/execution-service'
import { InMemoryExecutionStore } from './executions/store/execution-store'
import { DBFlowStore } from './stores/flowStore/dbFlowStore'
import { InMemoryFlowStore } from './stores/flowStore/inMemoryFlowStore'

export async function init() {
  registerSuperjsonTransformers(SuperJSON, NodeRegistry.getInstance())

  // Initialize stores and context
  const db = drizzle(process.env.DATABASE_URL!)
  let flowStore: IFlowStore = new InMemoryFlowStore()

  // ping to check if the connection is successful
  try {
    const res = await db.execute(sql`select 1`)
    if (!res || res.rows.length === 0) {
      throw new Error('DB connection failed')
    }
    console.log('DB connection successful')
    flowStore = new DBFlowStore(db)
  } catch (error) {
    console.error('DB connection failed, using in-memory store. If you would like to use a database, please set DATABASE_URL environment variable.')
  }

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
