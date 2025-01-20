import { $nodes } from '@/store/nodes'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

function useNode(nodeId: string) {
  const nodes = useUnit($nodes)
  return useMemo(
    () => nodes[nodeId],
    [nodes, nodeId],
  )
}
