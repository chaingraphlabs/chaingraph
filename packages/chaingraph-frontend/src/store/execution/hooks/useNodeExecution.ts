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
    }
  }, [nodeStates, nodeId])
}
