import type { Edge } from '@xyflow/react'
import { useAppSelector } from '@/store_OLD/hooks'
import { useMemo, useState } from 'react'

/**
 * Hook to transform flow edges into ReactFlow edges
 */
export function useFlowEdges() {
  const edges = useAppSelector(state => state.flow.edges)
  const [, set] = useState()
  return useMemo(() => {
    return Object.values(edges).map((edge): Edge => ({
      id: edge.id,
      source: edge.sourceNode.id,
      target: edge.targetNode.id,
      sourceHandle: edge.sourcePort.config.id,
      targetHandle: edge.targetPort.config.id,
      type: 'chaingraphEdge',
      animated: true,
    }))
  }, [edges])
}
