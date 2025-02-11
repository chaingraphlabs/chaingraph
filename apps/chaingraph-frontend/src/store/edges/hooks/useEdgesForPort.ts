import type { EdgeData } from '@/store/edges/types'
import { $edges } from '@/store/edges/stores'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

export function useEdgesForPort(portId: string): EdgeData[] {
  const edges = useUnit($edges)

  // Filter the edges to return only those that are connected to the given port.
  // We check if either the sourcePortId or the targetPortId match the provided port id.
  return useMemo(() => {
    return edges.filter(
      edge =>
        edge.sourcePortId === portId
        || edge.targetPortId === portId,
    )
  }, [edges, portId])
}
