import type { CreateExecutionOptions, ExecutionStatus } from './types'
import { trpcClient } from '@/api/trpc/client'
import { createEffect } from 'effector'
import { isTerminalStatus } from './types'

// Control effects
export const createExecutionFx = createEffect(
  async ({ flowId, debug }: CreateExecutionOptions) => {
    const response = await trpcClient.execution.create.mutate({
      flowId,
      options: {
        debug,
        execution: {
          maxConcurrency: 1,
          nodeTimeoutMs: 90000,
          flowTimeoutMs: 300000,
        },
      },
    })
    return response.executionId
  },
)

export const startExecutionFx = createEffect(async (executionId: string) => {
  await trpcClient.execution.start.mutate({ executionId })
})

export const pauseExecutionFx = createEffect(async (executionId: string) => {
  await trpcClient.execution.pause.mutate({ executionId })
})

export const resumeExecutionFx = createEffect(async (executionId: string) => {
  await trpcClient.execution.resume.mutate({ executionId })
})

export const stopExecutionFx = createEffect(async (executionId: string) => {
  await trpcClient.execution.stop.mutate({ executionId })
})

// Debug effects
export const addBreakpointFx = createEffect(
  async ({ executionId, nodeId }: { executionId: string, nodeId: string }) => {
    await trpcClient.execution.debug.addBreakpoint.mutate({ executionId, nodeId })
  },
)

export const removeBreakpointFx = createEffect(
  async ({ executionId, nodeId }: { executionId: string, nodeId: string }) => {
    await trpcClient.execution.debug.removeBreakpoint.mutate({ executionId, nodeId })
  },
)

export const stepExecutionFx = createEffect(async (executionId: string) => {
  await trpcClient.execution.debug.step.mutate({ executionId })
})

// effect for checking terminal status
export const checkTerminalStatusFx = createEffect((status: ExecutionStatus) => {
  return isTerminalStatus(status)
})
