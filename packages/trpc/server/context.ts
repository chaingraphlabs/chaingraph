/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeCatalog, NodeRegistry } from '@badaitech/chaingraph-types'
import type { drizzle } from 'drizzle-orm/node-postgres'
import type { ExecutionService } from './executions/services/execution-service'
import type { IExecutionStore } from './executions/store/execution-store'
import type { IFlowStore } from './stores/flowStore/types'

export interface Session {
  userId: string
}
export type DBType = ReturnType<typeof drizzle>

export interface AppContext {
  session: Session
  db: DBType
  flowStore: IFlowStore
  nodeRegistry: NodeRegistry
  nodesCatalog: NodeCatalog
  executionService: ExecutionService
  executionStore: IExecutionStore
}

let db: DBType | null = null
let flowStore: IFlowStore | null = null
let nodeRegistry: NodeRegistry | null = null
let nodesCatalog: NodeCatalog | null = null
let executionService: ExecutionService | null = null
let executionStore: IExecutionStore | null = null

/**
 * Initialize application context with stores
 * Should be called once when application starts
 */
export function initializeContext(
  _db: DBType,
  _flowStore: IFlowStore,
  _nodeRegistry: NodeRegistry,
  _nodesCatalog: NodeCatalog,
  _executionService: ExecutionService,
  _executionStore: IExecutionStore,
) {
  db = _db
  flowStore = _flowStore
  nodeRegistry = _nodeRegistry
  nodesCatalog = _nodesCatalog
  executionService = _executionService
  executionStore = _executionStore
}

/**
 * Creates context for tRPC procedures
 * Reuses initialized stores instead of creating new ones
 */
export async function createContext(): Promise<AppContext> {
  if (
    !db
    || !flowStore
    || !nodeRegistry
    || !nodesCatalog
    || !executionService
    || !executionStore
  ) {
    throw new Error('Context not initialized. Call initializeContext first.')
  }

  return {
    session: {
      userId: 'test_user_id', // TODO: Implement proper session management
    },
    db,
    flowStore,
    nodeRegistry,
    nodesCatalog,
    executionService,
    executionStore,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
