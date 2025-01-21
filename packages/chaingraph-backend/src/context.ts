import type { IFlowStore } from '@chaingraph/backend/stores/flowStore'
import type { NodeCatalog } from '@chaingraph/nodes'
import type { NodeRegistry } from '@chaingraph/types'

export interface Session {
  userId: string
}

export interface AppContext {
  session: Session
  flowStore: IFlowStore
  nodeRegistry: NodeRegistry
  nodesCatalog: NodeCatalog
}

let flowStore: IFlowStore | null = null
let nodeRegistry: NodeRegistry | null = null
let nodesCatalog: NodeCatalog | null = null

/**
 * Initialize application context with stores
 * Should be called once when application starts
 */
export function initializeContext(
  store: IFlowStore,
  registry: NodeRegistry,
  catalog: NodeCatalog,
) {
  flowStore = store
  nodeRegistry = registry
  nodesCatalog = catalog
}

/**
 * Creates context for tRPC procedures
 * Reuses initialized stores instead of creating new ones
 */
export async function createContext(): Promise<AppContext> {
  if (!flowStore || !nodeRegistry || !nodesCatalog) {
    throw new Error('Context not initialized. Call initializeContext first.')
  }

  return {
    session: {
      userId: 'test_user_id', // TODO: Implement proper session management
    },
    flowStore,
    nodeRegistry,
    nodesCatalog,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
