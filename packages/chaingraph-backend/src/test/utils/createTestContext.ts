import type { Context } from '@chaingraph/backend/context'
import type { NodeRegistry } from '@chaingraph/types'
import { InMemoryFlowStore } from '@chaingraph/backend/stores/flowStore'
import { nodeRegistry } from '@chaingraph/nodes'

/**
 * Creates test context with in-memory stores
 */
export function createTestContext(
  registry?: NodeRegistry,
): Context {
  return {
    session: {
      userId: 'test-user-id',
    },
    flowStore: new InMemoryFlowStore(),
    nodeRegistry: registry || nodeRegistry,
  }
}
