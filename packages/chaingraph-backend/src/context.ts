import type { NodeCatalog } from '@badaitech/chaingraph-nodes'
import type { NodeRegistry } from '@badaitech/chaingraph-types'
import type { ExecutionService, IExecutionStore } from './execution'
import type { IFlowStore } from './stores/flowStore'

export interface Session {
  userId: string
}

export interface AppContext {
  session: Session
  flowStore: IFlowStore
  nodeRegistry: NodeRegistry
  nodesCatalog: NodeCatalog
  executionService: ExecutionService
  executionStore: IExecutionStore
}

let flowStore: IFlowStore | null = null
let nodeRegistry: NodeRegistry | null = null
let nodesCatalog: NodeCatalog | null = null
let executionService: ExecutionService | null = null
let executionStore: IExecutionStore | null = null

/**
 * Initialize application context with stores
 * Should be called once when application starts
 */
export function initializeContext(
  _flowStore: IFlowStore,
  _nodeRegistry: NodeRegistry,
  _nodesCatalog: NodeCatalog,
  _executionService: ExecutionService,
  _executionStore: IExecutionStore,
) {
  flowStore = _flowStore
  nodeRegistry = _nodeRegistry
  nodesCatalog = _nodesCatalog
  executionService = _executionService
  executionStore = _executionStore
}

/**
 * Creates context for tRPC procedures
 * Reuses initialized stores instead of creating new ones
 */
export async function createContext(): Promise<AppContext> {
  if (
    !flowStore
    || !nodeRegistry
    || !nodesCatalog
    || !executionService
    || !executionStore
  ) {
    throw new Error('Context not initialized. Call initializeContext first.')
  }

  return {
    session: {
      userId: 'test_user_id', // TODO: Implement proper session management
    },
    flowStore,
    nodeRegistry,
    nodesCatalog,
    executionService,
    executionStore,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
