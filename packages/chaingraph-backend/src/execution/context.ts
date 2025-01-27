import type { Context } from '@chaingraph/backend/context'
import type {
  IExecutionStore,
} from '@chaingraph/backend/execution/store/execution-store'
import type { ExecutionOptions } from '@chaingraph/backend/execution/types'
import { ExecutionService } from '@chaingraph/backend/execution/services/execution-service'
import {
  InMemoryExecutionStore,
} from '@chaingraph/backend/execution/store/execution-store'

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
