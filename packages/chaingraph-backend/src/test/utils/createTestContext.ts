import type { AppContext } from '../../context'
import type { IFlowStore } from '../../stores/flowStore'
import { NodeCatalog, NodeRegistry } from '@badaitech/chaingraph-types'
import { InMemoryFlowStore } from '../../stores/flowStore'

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
  }
}
