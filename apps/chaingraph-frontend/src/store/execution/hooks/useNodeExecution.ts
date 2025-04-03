/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { $executionState } from '../stores'

export function useNodeExecution(nodeId: string) {
  const { nodeStates } = useUnit($executionState)

  return useMemo(() => {
    const state = nodeStates.get(nodeId)

    return {
      status: state?.status ?? 'idle',
      isExecuting: state?.status === 'running',
      isCompleted: state?.status === 'completed',
      isFailed: state?.status === 'failed',
      isSkipped: state?.status === 'skipped',
      executionTime: state?.executionTime,
      error: state?.error,
      startTime: state?.startTime,
      endTime: state?.endTime,
      node: state?.node,
    }
  }, [nodeStates, nodeId])
}
