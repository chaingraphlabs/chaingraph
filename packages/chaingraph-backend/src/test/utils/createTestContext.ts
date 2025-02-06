import type { AppContext } from '../../context'
import type { IFlowStore } from '../../stores/flowStore'
import { NodeCatalog } from '@badaitech/chaingraph-nodes/dist'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { InMemoryFlowStore } from '../../stores/flowStore'

/**
 * Creates test context with in-memory stores
 */
export function createTestContext(
  _nodeRegistry?: NodeRegistry,
  nodesCatalog?: NodeCatalog,
  flowStore?: IFlowStore,
): AppContext {
  const nodeRegistry = _nodeRegistry ?? NodeRegistry.getInstance()

  return {
    session: {
      userId: 'test_user_id',
    },
    nodeRegistry,
    nodesCatalog: nodesCatalog ?? new NodeCatalog(nodeRegistry),
    flowStore: flowStore ?? new InMemoryFlowStore(),
    executionService: null as any,
    executionStore: null as any,
  }
}
