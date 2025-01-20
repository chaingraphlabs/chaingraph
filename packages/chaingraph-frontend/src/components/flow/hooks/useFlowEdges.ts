import { useFlowNodes } from '@/components/flow/hooks/useFlowNodes.ts'
import { $edges } from '@/store'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

/**
 * Hook to transform flow edges into ReactFlow edges
 */
export function useFlowEdges() {
  const edges = useUnit($edges)
  const nodes = useFlowNodes()

  // Transform edges for ReactFlow
  // const reactFlowEdges = useMemo(() => {
  //   if (!edges) {
  //     return []
  //   }
  //
  //   console.log('edges', edges)
  //   return edges.map((edge) => {
  //     const edgeData = {
  //       id: edge.edgeId,
  //       source: edge.sourceNodeId,
  //       target: edge.targetNodeId,
  //       sourceHandle: edge.sourcePortId,
  //       targetHandle: edge.targetPortId,
  //
  //       // Add other edge properties
  //       label: edge.metadata?.label,
  //     }
  //
  //     return edgeData
  //   })
  // }, [edges])

  const reactFlowEdges = useMemo(() => {
    return edges
      .filter((edge) => {
        // Проверяем валидность нод и их позиций
        const sourceNode = nodes.find(n => n.id === edge.sourceNodeId)
        const targetNode = nodes.find(n => n.id === edge.targetNodeId)

        return sourceNode && targetNode
          && sourceNode.position && targetNode.position
          && !Number.isNaN(sourceNode.position.x) && !Number.isNaN(sourceNode.position.y)
          && !Number.isNaN(targetNode.position.x) && !Number.isNaN(targetNode.position.y)
      })
      .map(edge => ({
        id: edge.edgeId,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: edge.sourcePortId,
        targetHandle: edge.targetPortId,
        type: 'default', // Используем простой тип edge
        style: { stroke: 'currentColor', strokeWidth: 2 },
      }))
  }, [edges, nodes])

  return reactFlowEdges
}
