/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IFlowStore } from 'server/stores/flowStore/types'
import type { AppContext } from '../../context'
import { NodeCatalog, NodeRegistry } from '@badaitech/chaingraph-types'
import { InMemoryFlowStore } from '../../stores/flowStore/inMemoryFlowStore'

/**
 * Creates test context with in-memory stores
 */
export function createTestContext(
  _nodeRegistry?: NodeRegistry,
  _nodesCatalog?: NodeCatalog,
  flowStore?: IFlowStore,
): AppContext {
  const nodeRegistry = _nodeRegistry ?? NodeRegistry.getInstance()
  const nodesCatalog = _nodesCatalog ?? new NodeCatalog()

  nodeRegistry.getNodeTypes().forEach((type) => {
    const node = nodeRegistry.createNode(type, `${type}-catalog`)
    nodesCatalog.registerNode(type, node)
  })

  return {
    session: {
      userId: 'test_user_id',
    },
    nodeRegistry,
    nodesCatalog,
    flowStore: flowStore ?? new InMemoryFlowStore(),
    executionService: null as any,
    executionStore: null as any,
    db: null as any,
  }
}
