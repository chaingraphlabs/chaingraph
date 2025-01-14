import type { Context } from '@chaingraph/backend/context'
import { InMemoryFlowStore } from '@chaingraph/backend/stores/flowStore'

/**
 * Creates test context with in-memory stores
 */
export function createTestContext(): Context {
  return {
    session: {
      userId: 'test-user-id',
    },
    flowStore: new InMemoryFlowStore(),
  }
}
