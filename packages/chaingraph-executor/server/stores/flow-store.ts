/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBType, IFlowStore } from '@badaitech/chaingraph-trpc/server'
import type { Flow } from '@badaitech/chaingraph-types'
import { DBFlowStore } from '@badaitech/chaingraph-trpc/server'
import { getDatabase } from '../utils/db'
import { createLogger } from '../utils/logger'

const logger = createLogger('flow-store')

let flowStore: DBFlowStore | null = null

export async function getFlowStore(
  db?: DBType,
): Promise<IFlowStore> {
  if (!flowStore) {
    const _db = db ?? await getDatabase()
    flowStore = new DBFlowStore(_db, false)
    logger.info('Flow store initialized')
  }
  return flowStore
}

export async function loadFlow(flowId: string): Promise<Flow | null> {
  const store = await getFlowStore()
  const flow = await store.getFlow(flowId)

  if (!flow) {
    logger.warn({ flowId }, 'Flow not found')
    return null
  }

  return flow
}
