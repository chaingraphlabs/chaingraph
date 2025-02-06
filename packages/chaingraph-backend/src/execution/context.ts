import type { Context } from '../context'
import type { IExecutionStore } from './store/execution-store'
import type { ExecutionOptions } from './types'
import { ExecutionService } from './services/execution-service'
import { InMemoryExecutionStore } from './store/execution-store'

export interface ExecutionContext extends Context {
  executionStore: IExecutionStore
  executionService: ExecutionService
}

export async function createExecutionContext(
  ctx: Context,
  options?: ExecutionOptions,
): Promise<ExecutionContext> {
  const executionStore = new InMemoryExecutionStore()
  const executionService = new ExecutionService(executionStore, options)

  return {
    ...ctx,
    executionStore,
    executionService,
  }
}
