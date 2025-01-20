import type { Node } from '@xyflow/react'
import { $nodes } from '@/store'
import { useCategories } from '@/store/categories'
import { DefaultPosition } from '@chaingraph/types/node/node-ui.ts'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

/**
 * Hook to transform flow nodes into ReactFlow nodes
 */
export function useFlowNodes() {
  const nodes = useUnit($nodes)

  const { getCategoryMetadata } = useCategories()

  // Transform flow nodes into ReactFlow nodes
  return useMemo(() => {
    if (!nodes) {
      return []
    }

    return Object.values(nodes).map((node): Node => {
      const categoryMetadata = getCategoryMetadata(node.metadata.category!)

      const reactflowNode: Node = {
        id: node.id,
        type: 'chaingraphNode',
        position: node.metadata.ui?.position ?? DefaultPosition,
        data: {
          node,
          categoryMetadata,
        },
        selected: node.metadata.ui?.state?.isSelected ?? false,
      }

      // set dimensions
      if (node.metadata.ui?.dimensions && node.metadata.ui.dimensions.width > 0 && node.metadata.ui.dimensions.height > 0) {
        reactflowNode.width = node.metadata.ui.dimensions.width
        reactflowNode.height = node.metadata.ui.dimensions.height
      }

      return reactflowNode
    })
  }, [nodes, getCategoryMetadata])
}
