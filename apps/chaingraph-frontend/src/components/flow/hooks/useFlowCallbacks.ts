/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, Position } from '@badaitech/chaingraph-types'
import type { Connection, Edge, EdgeChange, HandleType, Node, NodeChange } from '@xyflow/react'
import { $edges, requestAddEdge, requestRemoveEdge } from '@/store/edges'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, removeNodeFromFlow, updateNodeParent, updateNodePosition, updateNodeUI } from '@/store/nodes'
import { positionInterpolator } from '@/store/nodes/position-interpolation-advanced'
import { hasCycle } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useCallback, useMemo, useRef } from 'react'
import { getNodePositionInFlow, getNodePositionInsideParent } from '../utils/node-position'

/**
 * Hook to handle flow interaction callbacks
 */
export function useFlowCallbacks() {
  // const { flow } = useFlow()
  const activeFlow = useUnit($activeFlowMetadata)
  const nodes = useUnit($nodes)
  // const { getNode, getNodes } = useReactFlow()
  const edges = useUnit($edges)

  const edgeViews = useMemo(() => {
    if (!activeFlow || !nodes || !edges)
      return []

    return edges.map(edge => ({
      sourceNode: nodes[edge.sourceNodeId],
      targetNode: nodes[edge.targetNodeId],
    }))
  }, [activeFlow, edges, nodes])

  // Ref to track edge reconnection state
  const reconnectSuccessful = useRef(false)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    if (!activeFlow || !nodes || !changes || !activeFlow.id === undefined)
      return

    // Handle node changes (position, selection, etc)
    changes.forEach((change, i) => {
      switch (change.type) {
        case 'position':
          {
            if (!change.dragging)
              return

            const node = nodes[change.id]
            if (!node || !change.position || !change.position.x || !change.position.y) {
              return
            }
            // check if the position is the same
            const isSamePosition
              = node.metadata.ui?.position?.x === change.position.x
                && node.metadata.ui?.position?.y === change.position.y

            if (isSamePosition) {
              return
            }

            positionInterpolator.clearNodeState(node.id)

            updateNodePosition({
              flowId: activeFlow.id!,
              nodeId: change.id,
              position: roundPosition(change.position as Position),
              version: node.getVersion(),
            })
          }
          break

        case 'dimensions':
        {
          const node = nodes[change.id]
          if (!node)
            return

          if (!change.dimensions || !change.dimensions.width || !change.dimensions.height) {
            console.warn(`[useFlowCallbacks] Invalid dimensions change:`, change)
            return
          }

          const isSameDimensions
            = node.metadata.ui?.dimensions?.width === change.dimensions.width
              && node.metadata.ui?.dimensions?.height === change.dimensions.height

          const isNodeDimensionInitialized
              = node.metadata.ui?.dimensions !== undefined
                && node.metadata.ui?.dimensions?.width !== undefined
                && node.metadata.ui?.dimensions?.height !== undefined

          if (isSameDimensions) { // || !isNodeDimensionInitialized) {
            return
          }

          // console.log(`[useFlowCallbacks] Setting dimensions for node ${change.id} to:`, change.dimensions)

          updateNodeUI({
            flowId: activeFlow.id!,
            nodeId: change.id,
            ui: {
              dimensions: change.dimensions,
            },
            version: node.getVersion(),
          })

          break
        }

        case 'select':
          {
            const node = nodes[change.id]
            if (!node)
              return

            // check if the selection state is the same

            // updateNodeUILocal({
            updateNodeUI({
              flowId: activeFlow.id!,
              nodeId: change.id,
              version: node.getVersion(),
              ui: {
                state: {
                  isSelected: change.selected,
                },
              },
            })
          }
          break

        case 'remove':
          {
            const node = nodes[change.id]
            if (!node)
              return

            // Remove node from flow
            removeNodeFromFlow({
              flowId: activeFlow.id!,
              nodeId: change.id,
            })
          }
          break

        default:
          console.warn(`[useFlowCallbacks] Unhandled node change:`, change)
          break
      }
    })
  }, [activeFlow, nodes])

  // Handle edge changes (removal, selection)
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (!activeFlow?.id)
      return

    console.debug('[useFlowCallbacks] Edge changes:', changes)

    changes.forEach((change) => {
      switch (change.type) {
        case 'remove':
          requestRemoveEdge({
            flowId: activeFlow.id!,
            edgeId: change.id,
          })
          break
        case 'select':
          // Handle edge selection if needed
          break
      }
    })
  }, [activeFlow?.id])

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    if (!activeFlow?.id || !connection.source || !connection.target)
      return

    if (hasCycle(Object.values(nodes), edgeViews, {
      sourceNode: nodes[connection.source],
      targetNode: nodes[connection.target],
    })) {
      console.warn('Cycle detected')
      return
    }

    requestAddEdge({
      flowId: activeFlow.id,
      sourceNodeId: connection.source,
      sourcePortId: connection.sourceHandle!,
      targetNodeId: connection.target,
      targetPortId: connection.targetHandle!,
      metadata: {},
    })
  }, [activeFlow?.id, nodes, edgeViews])

  /**
   * Called when user starts dragging an edge handle
   */
  const onReconnectStart = useCallback((_: React.MouseEvent, edge: Edge, handleType: HandleType) => {
    reconnectSuccessful.current = false
  }, [])

  /**
   * Called when user successfully reconnects an edge to a new handle
   */
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    if (!activeFlow?.id)
      return

    reconnectSuccessful.current = true

    // Remove old edge
    requestRemoveEdge({
      flowId: activeFlow.id,
      edgeId: oldEdge.id,
    })

    // Create new edge if we have valid connection points
    if (newConnection.source && newConnection.target) {
      onConnect(newConnection)
    }
  }, [activeFlow?.id, onConnect])

  /**
   * Called when edge reconnection interaction ends
   * If reconnection wasn't successful (dropped on invalid target), remove the edge
   */
  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!activeFlow?.id)
      return

    if (!reconnectSuccessful.current) {
      requestRemoveEdge({
        flowId: activeFlow.id,
        edgeId: edge.id,
      })
    }
    reconnectSuccessful.current = false
  }, [activeFlow?.id])

  // Handle node drag end
  const onNodeDragStop = useCallback((
    event: React.MouseEvent,
    nodesDrag: Node,
    nodesDragStop: Node[],
  ) => {
    // Validate position helper
    const isValidPosition = (pos: any): pos is { x: number, y: number } => {
      return pos
        && typeof pos.x === 'number'
        && typeof pos.y === 'number'
        && !Number.isNaN(pos.x)
        && !Number.isNaN(pos.y)
        && Number.isFinite(pos.x)
        && Number.isFinite(pos.y)
    }

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
    }
  }, [activeFlow?.id, nodes])

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    onNodeDragStop,
  }
}

// Utility functions
function isPointInBounds(point: { x: number, y: number }, bounds: { x: number, y: number, width: number, height: number }) {
  return point.x >= bounds.x
    && point.x <= bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y <= bounds.y + bounds.height
}

function isValidPosition(pos: any): pos is { x: number, y: number } {
  return pos && typeof pos.x === 'number' && typeof pos.y === 'number'
}

function roundPosition(pos: { x: number, y: number }, precision = 10) {
  return {
    x: Math.round(pos.x / precision) * precision,
    y: Math.round(pos.y / precision) * precision,
  }
}
