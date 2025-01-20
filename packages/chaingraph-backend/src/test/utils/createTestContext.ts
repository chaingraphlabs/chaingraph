import type { AppContext } from '@chaingraph/backend/context'
import type { IFlowStore } from '@chaingraph/backend/stores/flowStore'
import type { NodeRegistry } from '@chaingraph/types'
import { InMemoryFlowStore } from '@chaingraph/backend/stores/flowStore'
import { NodeCatalog, nodeRegistry } from '@chaingraph/nodes'

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
  }
}
