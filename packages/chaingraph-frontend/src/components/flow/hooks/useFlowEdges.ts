/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Edge } from '@xyflow/react'
import { useFlowNodes } from '@/components/flow/hooks/useFlowNodes'
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
        const sourceNode = nodes.find(n => n.id === edge.sourceNodeId)
        const targetNode = nodes.find(n => n.id === edge.targetNodeId)

        return sourceNode && targetNode
          && sourceNode.position && targetNode.position
          && !Number.isNaN(sourceNode.position.x) && !Number.isNaN(sourceNode.position.y)
          && !Number.isNaN(targetNode.position.x) && !Number.isNaN(targetNode.position.y)
      })
      .map((edge) => {
        const rfEdge: Edge = {
          id: edge.edgeId,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          sourceHandle: edge.sourcePortId,
          targetHandle: edge.targetPortId,
          type: 'default',
          style: { stroke: 'currentColor', strokeWidth: 2 },
        }

        return rfEdge
      })
  }, [edges, nodes])

  return reactFlowEdges
}
