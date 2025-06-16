/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, Position } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, updateNodeParent, updateNodePosition } from '@/store/nodes'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'
import { getNodePositionInFlow, getNodePositionInsideParent } from '../utils/node-position'
import { isValidPosition, roundPosition } from './useFlowUtils'

/**
 * Hook for handling node drag operations with parent/group management
 */
export function useNodeDragHandling(
  checkForNodeSchemaDrop: (
    droppedNode: Node,
    droppedPosition: { x: number, y: number },
    allNodes: Record<string, INode>
  ) => void,
) {
  const activeFlow = useUnit($activeFlowMetadata)
  const nodes = useUnit($nodes)

  // Handle node drag end
  const onNodeDragStop = useCallback((
    event: React.MouseEvent,
    nodesDrag: Node,
    nodesDragStop: Node[],
  ) => {
    // Check all nodes in nodesDragStop
    const validNodes = nodesDragStop.filter(node =>
      node.position && isValidPosition(node.position),
    )

    // Ensure dragged node is in the array
    if (!nodesDragStop.find(node => node.id === nodesDrag.id)
      && isValidPosition(nodesDrag.position)) {
      nodesDragStop.push(nodesDrag)
    }

    for (const nodeDragStop of nodesDragStop) {
      if (!activeFlow?.id || !nodeDragStop || !isValidPosition(nodeDragStop.position)) {
        console.warn('Invalid node or position:', {
          node: nodeDragStop?.id,
          position: nodeDragStop?.position,
        })
        continue
      }

      const flowNode = nodes[nodeDragStop.id]

      if (flowNode) {
        // TODO: add to node metadata that node is dragged stop!!!
      }

      if (!flowNode || flowNode.metadata.category === 'group')
        continue

      const currentParentId = flowNode.metadata.parentNodeId
      const currentParent = currentParentId ? nodes[currentParentId] : undefined

      // Validate current parent
      if (currentParentId && (!currentParent || !isValidPosition(currentParent.metadata.ui?.position))) {
        console.warn('Invalid parent node or position:', {
          parentId: currentParentId,
          parentPosition: currentParent?.metadata.ui?.position,
        })
        continue
      }

      // Calculate absolute position
      const absoluteNodePosition = currentParentId && currentParent
        ? getNodePositionInFlow(
            nodeDragStop.position,
            currentParent.metadata.ui!.position!,
          )
        : { ...nodeDragStop.position } // Create new object to avoid mutations

      // Validate absolute position
      if (!isValidPosition(absoluteNodePosition)) {
        console.warn('Invalid absolute position calculated:', {
          node: nodeDragStop.id,
          original: nodeDragStop.position,
          calculated: absoluteNodePosition,
        })
        continue
      }

      // Find potential parent group
      const groupNodes = Object.entries(nodes).filter(([_, n]) =>
        n.metadata.category === 'group'
        && n.metadata.ui?.position
        && isValidPosition(n.metadata.ui.position)
        && n.metadata.ui.dimensions
        && typeof n.metadata.ui.dimensions.width === 'number'
        && typeof n.metadata.ui.dimensions.height === 'number',
      )

      let newParentId: string | undefined
      let targetGroupNode: INode | undefined

      // Check if node is inside any group
      for (const [_, groupNode] of groupNodes) {
        const groupBounds = {
          x: groupNode.metadata.ui!.position!.x,
          y: groupNode.metadata.ui!.position!.y,
          width: groupNode.metadata.ui!.dimensions!.width,
          height: groupNode.metadata.ui!.dimensions!.height,
        }

        const nodeCenter = {
          x: absoluteNodePosition.x + (nodeDragStop.width || 0) / 2,
          y: absoluteNodePosition.y + (nodeDragStop.height || 0) / 2,
        }

        if (
          nodeCenter.x >= groupBounds.x
          && nodeCenter.x <= groupBounds.x + groupBounds.width
          && nodeCenter.y >= groupBounds.y
          && nodeCenter.y <= groupBounds.y + groupBounds.height
        ) {
          newParentId = groupNode.id
          targetGroupNode = groupNode
          break
        }
      }

      // Handle moving out of group
      if (currentParentId && !newParentId && currentParentId !== newParentId) {
        if (!isValidPosition(absoluteNodePosition)) {
          console.warn('Invalid position when moving out of group')
          continue
        }

        // check if nodeDragStop node's parent is the group node, if no, skip
        const parentNode = nodes[currentParentId]
        if (parentNode && parentNode.metadata.category === 'group') {
          updateNodePosition({
            flowId: activeFlow.id,
            nodeId: nodeDragStop.id,
            position: roundPosition(absoluteNodePosition as Position),
            version: flowNode.getVersion(),
          })

          updateNodeParent({
            flowId: activeFlow.id,
            nodeId: nodeDragStop.id,
            parentNodeId: undefined,
            position: roundPosition(absoluteNodePosition as Position),
            version: flowNode.getVersion() + 1,
          })
        }
      } else if (newParentId && targetGroupNode && newParentId !== currentParentId) {
        const newPosition = getNodePositionInsideParent(
          absoluteNodePosition,
          targetGroupNode.metadata.ui!.position!,
        )

        if (!isValidPosition(newPosition)) {
          console.warn('Invalid position when moving into group:', {
            absolute: absoluteNodePosition,
            calculated: newPosition,
            targetGroup: targetGroupNode.id,
          })
          continue
        }

        updateNodePosition({
          flowId: activeFlow.id,
          nodeId: nodeDragStop.id,
          position: roundPosition(newPosition as Position),
          version: flowNode.getVersion(),
        })

        updateNodeParent({
          flowId: activeFlow.id,
          nodeId: nodeDragStop.id,
          parentNodeId: newParentId,
          position: roundPosition(newPosition as Position),
          version: flowNode.getVersion() + 1,
        })
      }

      // Check for node schema drop detection
      checkForNodeSchemaDrop(nodeDragStop, absoluteNodePosition, nodes)
    }
  }, [activeFlow?.id, nodes, checkForNodeSchemaDrop])

  const onNodeDragStart = useCallback((
    event: React.MouseEvent,
    nodesDrag: Node,
    nodesDragStop: Node[],
  ) => {
    // TODO: add to node metadata that node is dragged
  }, [])

  return {
    onNodeDragStart,
    onNodeDragStop,
  }
}
