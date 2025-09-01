/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { PostgresExecutionStore } from '@badaitech/chaingraph-trpc/server'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { getDatabase } from '../utils/db'
import { createLogger } from '../utils/logger'

const logger = createLogger('execution-store')

let executionStore: PostgresExecutionStore | null = null

export async function getExecutionStore(
  nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
): Promise<PostgresExecutionStore> {
  if (!executionStore) {
    const db = await getDatabase()
    executionStore = new PostgresExecutionStore(
      db as any,
      nodeRegistry,
    )
    logger.info('Execution store initialized')
  }
  return executionStore
}
