import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode'
import type { OnNodeDrag } from '@xyflow/react'
import { $activeFlowMetadata } from '@/store/flow'
import { updateNodePosition } from '@/store/nodes'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'

export function useNodeDrag() {
  const activeFlow = useUnit($activeFlowMetadata)

  const handleNodeDrag: OnNodeDrag<ChaingraphNode> = useCallback((_, node) => {
    if (!activeFlow?.id)
      return

    console.log(`[useNodeDrag] Updating node position for node ${node.id}, position:`, node.position)

    updateNodePosition({
      flowId: activeFlow.id,
      nodeId: node.id,
      position: node.position,
      version: node.data.node.getVersion(),
    })
  }, [activeFlow?.id])

  return handleNodeDrag
}
