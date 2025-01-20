import type { NodeDropEvent } from '@/components/dnd'
import { useDnd } from '@/components/dnd'
import { $activeFlowMetadata } from '@/store/flow'
import { $addNodeError, $isNodesLoading, addNodeToFlow } from '@/store/nodes'
import { useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback, useEffect } from 'react'

/**
 * Hook to handle node drops in the flow
 * @returns Object containing loading and error states
 */
export function useNodeDrop() {
  // Get active flow metadata from flow store
  const activeFlow = useUnit($activeFlowMetadata)

  // Get nodes store states
  const { isLoading, error } = useUnit({
    isLoading: $isNodesLoading,
    error: $addNodeError,
  })

  const { screenToFlowPosition } = useReactFlow()
  const { onNodeDrop } = useDnd()

  // Handle node drop
  const handleNodeDrop = useCallback(async (event: NodeDropEvent) => {
    if (!activeFlow?.id) {
      console.warn('[useNodeDrop]: No active flow')
      return
    }

    console.log('[useNodeDrop]: Node drop event:', event)

    try {
      // Calculate drop position
      const position = screenToFlowPosition({
        x: event.position.x,
        y: event.position.y,
      })

      console.log('Dropped node:', event.node.title, position)

      // Dispatch addNodeToFlow event
      addNodeToFlow({
        flowId: activeFlow.id,
        nodeType: event.node.type,
        position,
        metadata: {
          title: event.node.title,
          description: event.node.description,
          category: event.node.category,
          tags: event.node.tags,
        },
      })
    } catch (error) {
      console.error('Failed to add node:', error)
      // Error handling is now managed by the store
    }
  }, [activeFlow?.id, screenToFlowPosition])

  // Subscribe to drop events
  useEffect(() => {
    return onNodeDrop(handleNodeDrop)
  }, [onNodeDrop, handleNodeDrop])

  return {
    isLoading,
    error,
  }
}
