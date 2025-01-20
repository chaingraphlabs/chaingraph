import type { Node } from '@xyflow/react'
import { $nodes } from '@/store'
import { useCategories } from '@/store/categories'
import { DefaultPosition } from '@chaingraph/types/node/node-ui.ts'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

/**
 * Hook to transform flow nodes into ReactFlow nodes
 */
export function useFlowNodes1() {
  const nodes = useUnit($nodes)

  const { getCategoryMetadata } = useCategories()

  // Transform flow nodes into ReactFlow nodes
  return useMemo(() => {
    if (!nodes) {
      return []
    }

    return Object.values(nodes).map((node): Node => {
      const categoryMetadata = getCategoryMetadata(node.metadata.category!)

      return {
        id: node.id,
        type: 'chaingraphNode',
        position: node.metadata.ui?.position ?? DefaultPosition,
        data: {
          node,
          categoryMetadata,
        },
      } as Node
    })
  }, [nodes, getCategoryMetadata])
}
