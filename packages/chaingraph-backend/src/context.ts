import type { IFlowStore } from '@chaingraph/backend/stores/flowStore'
import type { NodeRegistry } from '@chaingraph/types'
import type { CreateNextContextOptions } from '@trpc/server/dist/adapters/next'

export interface Session {
  userId: string
}

export interface AppContext {
  session: Session
  flowStore: IFlowStore
  nodeRegistry: NodeRegistry
}

let flowStore: IFlowStore | null = null
let nodeRegistry: NodeRegistry | null = null

/**
 * Initialize application context with stores
 * Should be called once when application starts
 */
export function initializeContext(
  store: IFlowStore,
  registry: NodeRegistry,
) {
  flowStore = store
  nodeRegistry = registry
}

/**
 * Creates context for tRPC procedures
 * Reuses initialized stores instead of creating new ones
 */
export async function createContext(opts: CreateNextContextOptions): Promise<AppContext> {
  if (!flowStore || !nodeRegistry) {
    throw new Error('Context not initialized. Call initializeContext first.')
  }

  return {
    session: {
      userId: 'test_user_id', // TODO: Implement proper session management
    },
    flowStore,
    nodeRegistry,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
