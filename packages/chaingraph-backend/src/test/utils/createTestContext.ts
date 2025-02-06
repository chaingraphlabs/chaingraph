import type { NodeRegistry } from '@badaitech/chaingraph-types'
import type { AppContext } from '../../context'
import type { IFlowStore } from '../../stores/flowStore'
import { NodeCatalog, nodeRegistry } from '@badaitech/chaingraph-nodes/dist'
import { InMemoryFlowStore } from '../../stores/flowStore'

/**
 * Creates test context with in-memory stores
 */
export function createTestContext(
  _nodeRegistry?: NodeRegistry,
  nodesCatalog?: NodeCatalog,
  flowStore?: IFlowStore,
): AppContext {
  return {
    session: {
      userId: 'test_user_id',
    },
    nodeRegistry: _nodeRegistry ?? nodeRegistry,
    nodesCatalog: nodesCatalog ?? new NodeCatalog(nodeRegistry),
    flowStore: flowStore ?? new InMemoryFlowStore(),
    executionService: null as any,
    executionStore: null as any,
  }
}
