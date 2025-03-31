/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Edge } from '@xyflow/react'
import { useFlowNodes } from '@/components/flow/hooks/useFlowNodes.ts'
import { $edges } from '@/store'
import { $ports } from '@/store/ports/stores.ts'
import { useUpdateNodeInternals } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

/**
 * Hook to transform flow edges into ReactFlow edges
 */
export function useFlowEdges() {
  const edges = useUnit($edges)
  const nodes = useFlowNodes()
  const ports = useUnit($ports)
  const updateNodeInternals = useUpdateNodeInternals()

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

  // useEffect(() => {
  //   // Effect to update Reactflow internals when edges change
  //   Object.values(edges).forEach((edge) => {
  //     updateNodeInternals(edge.sourceNodeId)
  //     updateNodeInternals(edge.targetNodeId)
  //   })
  // }, [edges, updateNodeInternals])
  //
  // useEffect(() => {
  //   // Effect to update Reactflow internals when nodes change
  //   Object.values(nodes).forEach((node) => {
  //     updateNodeInternals(node.id)
  //   })
  // }, [nodes, updateNodeInternals])

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
        const sourcePort = ports[`${edge.sourceNodeId}-${edge.sourcePortId}`]
        const targetPort = ports[`${edge.targetNodeId}-${edge.targetPortId}`]

        if (!sourcePort || !targetPort) {
          return null
        }

        const config = sourcePort.getConfig()
        const borderColor = config.ui?.bgColor

        const rfEdge: Edge = {
          id: edge.edgeId,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          sourceHandle: edge.sourcePortId,
          targetHandle: edge.targetPortId,
          type: 'default',
          style: {
            stroke: borderColor ?? 'currentColor',
            strokeWidth: 4,
          },
        }

        return rfEdge
      })
  }, [edges, nodes])

  return reactFlowEdges
}
