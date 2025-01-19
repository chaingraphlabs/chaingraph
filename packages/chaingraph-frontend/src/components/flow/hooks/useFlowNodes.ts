import type { Node } from '@xyflow/react'
import { useCategories } from '@/store/categories'
import { $nodesWithVersions } from '@/store/nodes'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

/**
 * Hook to transform flow nodes into ReactFlow nodes
 */
export function useFlowNodes() {
  const { nodes } = useUnit($nodesWithVersions)

  const { getCategoryMetadata } = useCategories()

  // Transform flow nodes into ReactFlow nodes
  return useMemo(() => {
    console.log('[useFlowNodes]: Nodes updated:', nodes)

    return Object.values(nodes).map((node): Node => {
      const categoryMetadata = getCategoryMetadata(node.metadata.category!)

      return {
        id: node.id,
        type: 'chaingraphNode',
        position: node.metadata.ui?.position ?? { x: 0, y: 0 },
        data: {
          node,
          categoryMetadata,
        },
      }
    })
  }, [nodes, getCategoryMetadata])
}
