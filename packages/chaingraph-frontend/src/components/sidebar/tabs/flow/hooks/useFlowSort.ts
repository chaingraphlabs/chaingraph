import type { FlowMetadata } from '@chaingraph/types'
import { useMemo } from 'react'

export function useFlowSort(flows: FlowMetadata[] | undefined, selectedFlowId?: string) {
  return useMemo(() => {
    if (!flows)
      return []

    return [...flows]
      .filter(flow => flow && flow.updatedAt && flow.updatedAt.getTime() > 0)
      .sort((a, b) => {
        // Always show selected flow at the top
        if (selectedFlowId) {
          if (a.id === selectedFlowId)
            return -1
          if (b.id === selectedFlowId)
            return 1
        }

        // Then sort by updatedAt
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [flows, selectedFlowId])
}
