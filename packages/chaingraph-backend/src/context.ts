import type { IFlowStore } from '@chaingraph/backend/stores/flowStore'
import type { CreateNextContextOptions } from '@trpc/server/dist/adapters/next'

export interface Session {
  userId: string
}

export interface AppContext {
  session: Session
  flowStore: IFlowStore
}

let flowStore: IFlowStore | null = null

/**
 * Initialize application context with stores
 * Should be called once when application starts
 */
export function initializeContext(store: IFlowStore) {
  flowStore = store
}

/**
 * Creates context for tRPC procedures
 * Reuses initialized stores instead of creating new ones
 */
export async function createContext(opts: CreateNextContextOptions): Promise<AppContext> {
  if (!flowStore) {
    throw new Error('Context not initialized. Call initializeContext first.')
  }

  return {
    session: {
      userId: 'test_user_id', // TODO: Implement proper session management
    },
    flowStore,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
