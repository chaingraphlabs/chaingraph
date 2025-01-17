import type { AppContext } from '@chaingraph/backend/context'
import type { IFlowStore } from '@chaingraph/backend/stores/flowStore'
import { InMemoryFlowStore } from '@chaingraph/backend/stores/flowStore'
import { NodeCatalog } from '@chaingraph/nodes'
import { NodeRegistry } from '@chaingraph/types'

/**
 * Creates test context with in-memory stores
 */
export function createTestContext(
  nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
  nodesCatalog: NodeCatalog = new NodeCatalog(NodeRegistry.getInstance()),
  flowStore: IFlowStore = new InMemoryFlowStore(),
): AppContext {
  return {
    session: {
      userId: 'test_user_id',
    },
    flowStore,
    nodeRegistry,
    nodesCatalog,
  }
}
