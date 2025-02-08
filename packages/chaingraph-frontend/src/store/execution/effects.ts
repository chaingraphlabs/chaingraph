/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateExecutionOptions, ExecutionStatus } from './types'
import { trpcClient } from '@/api/trpc/client'
import { $executionState } from '@/store/execution/stores.ts'
import { createEffect } from 'effector'
import { isTerminalStatus } from './types'

// Control effects
export const createExecutionFx = createEffect(
  async ({ flowId, debug }: CreateExecutionOptions) => {
    const breakpoints = $executionState.getState().breakpoints

    const response = await trpcClient.execution.create.mutate({
      flowId,
      options: {
        debug,
        breakpoints: debug ? Array.from(breakpoints) : [],
        execution: {
          maxConcurrency: 2,
          nodeTimeoutMs: 90000,
          flowTimeoutMs: 300000,
        },
      },
    })
    return response.executionId
  },
)

export const startExecutionFx = createEffect(async (executionId: string) => {
  return trpcClient.execution.start.mutate({ executionId })
})

export const pauseExecutionFx = createEffect(async (executionId: string) => {
  return trpcClient.execution.pause.mutate({ executionId })
})

export const resumeExecutionFx = createEffect(async (executionId: string) => {
  return trpcClient.execution.resume.mutate({ executionId })
})

export const stopExecutionFx = createEffect(async (executionId: string) => {
  return trpcClient.execution.stop.mutate({ executionId })
})

// Debug effects
export const addBreakpointFx = createEffect(
  async ({ executionId, nodeId }: { executionId: string, nodeId: string }) => {
    return trpcClient.execution.debug.addBreakpoint.mutate({ executionId, nodeId })
  },
)

export const removeBreakpointFx = createEffect(
  async ({ executionId, nodeId }: { executionId: string, nodeId: string }) => {
    return trpcClient.execution.debug.removeBreakpoint.mutate({ executionId, nodeId })
  },
)

export const stepExecutionFx = createEffect(async (executionId: string) => {
  return trpcClient.execution.debug.step.mutate({ executionId })
})

// effect for checking terminal status
export const checkTerminalStatusFx = createEffect((status: ExecutionStatus) => {
  return isTerminalStatus(status)
})
