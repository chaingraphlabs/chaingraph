/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, ObjectPortConfig, Position } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import type { DropTarget as DragDropTarget, NodeDragEndEvent, NodeDragStartEvent } from '@/store/drag-drop'
import { useUnit } from 'effector-react'
import { useCallback, useMemo, useRef } from 'react'
import { useDragDrop } from '@/store/drag-drop'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, nodeDragEnd, nodeDragStart, updateNodeParent, updateNodePosition } from '@/store/nodes'
import { getNodePositionInFlow, getNodePositionInsideParent } from '../utils/node-position'
import { calculateDropPriority, calculateNodeDepth, isValidPosition, roundPosition, wouldCreateCircularDependency } from './useFlowUtils'

/**
 * Hook for handling node drag operations with parent/group management
 * Uses depth-based priority to ensure schema drops take precedence over group parenting
 */
export function useNodeDragHandling(
  checkForNodeSchemaDrop: (
    droppedNode: Node,
    droppedPosition: { x: number, y: number },
    allNodes: Record<string, INode>
  ) => void,
  screenToFlowPosition?: (position: { x: number, y: number }) => { x: number, y: number },
) {
  const activeFlow = useUnit($activeFlowMetadata)
  const nodes = useUnit($nodes)
  const {
    startDrag,
    updateDragPosition,
    endDrag,
    updateDropTargets,
    updateMousePosition,
    clearDropTargets,
    hoveredDropTarget,
  } = useDragDrop()

  // Throttle mouse position updates to improve performance
  const lastMouseUpdateTime = useRef(0)
  const mouseUpdateThrottle = 16 // ~60fps

  const throttledUpdateMousePosition = useCallback((position: { x: number, y: number }) => {
    const now = Date.now()
    if (now - lastMouseUpdateTime.current >= mouseUpdateThrottle) {
      updateMousePosition(position)
      lastMouseUpdateTime.current = now
    }
  }, [updateMousePosition])

  /**
   * Calculate absolute position for a node, considering all parent positions
   */
  const getAbsoluteNodePosition = useCallback((nodeId: string): Position | null => {
    const node = nodes[nodeId]
    if (!node || !node.metadata.ui?.position)
      return null

    let absolutePosition = { ...node.metadata.ui.position }
    let currentNode = node

    // Traverse up the parent chain, adding parent positions
    while (currentNode.metadata.parentNodeId) {
      const parentNode = nodes[currentNode.metadata.parentNodeId]
      if (!parentNode || !parentNode.metadata.ui?.position)
        break

      absolutePosition = getNodePositionInFlow(absolutePosition, parentNode.metadata.ui.position)
      currentNode = parentNode
    }

    return absolutePosition
  }, [nodes])

  // Memoize valid group nodes to avoid recalculating on every drag
  const validGroupNodes = useMemo(() => {
    return Object.entries(nodes).filter(([_, node]) =>
      node.metadata.category === 'group'
      && node.metadata.ui?.dimensions
      && node.metadata.ui.dimensions.width
      && node.metadata.ui.dimensions.height,
    )
  }, [nodes])

  // Memoize nodes with schema capture ports
  const nodesWithSchemaPorts = useMemo(() => {
    const result: Array<[string, INode, Array<[string, ObjectPortConfig]>]> = []

    Object.entries(nodes).forEach(([nodeId, node]) => {
      const schemaPorts: Array<[string, ObjectPortConfig]> = []

      Array.from(node.ports.values()).forEach((port) => {
        const config = port.getConfig()
        if (config.type === 'object') {
          const objectConfig = config as ObjectPortConfig
          if (objectConfig.ui?.nodeSchemaCapture?.enabled === true) {
            schemaPorts.push([port.id, objectConfig])
          }
        }
      })

      if (schemaPorts.length > 0) {
        result.push([nodeId, node, schemaPorts])
      }
    })

    return result
  }, [nodes])

  /**
   * Get all potential drop targets (groups and schema ports) with their priorities
   */
  const getAllDropTargets = useCallback((
    nodeDragStop: Node,
  ): DragDropTarget[] => {
    const targets: DragDropTarget[] = []

    // Add group targets (exclude the node being dragged to prevent self-parenting)
    validGroupNodes.forEach(([nodeId, node]) => {
      if (nodeId !== nodeDragStop.id && !wouldCreateCircularDependency(nodeDragStop.id, nodeId, nodes)) {
        // Calculate absolute position for nested groups
        const absolutePos = getAbsoluteNodePosition(nodeId)
        if (!absolutePos || !isValidPosition(absolutePos))
          return

        // Ensure dimensions exist (they should since validGroupNodes filters for this)
        const width = node.metadata.ui?.dimensions?.width
        const height = node.metadata.ui?.dimensions?.height
        if (!width || !height)
          return

        const depth = calculateNodeDepth(nodeId, nodes)
        const bounds = {
          x: absolutePos.x,
          y: absolutePos.y,
          width,
          height,
        }

        const target: DragDropTarget = {
          nodeId,
          depth,
          type: 'group',
          priority: calculateDropPriority({ depth, type: 'group' }),
          bounds,
        }
        targets.push(target)
      }
    })

    // Add schema drop targets
    nodesWithSchemaPorts.forEach(([nodeId, node, schemaPorts]) => {
      // Skip the node being dragged
      if (nodeId === nodeDragStop.id)
        return

      const nodeDimensions = node.metadata.ui?.dimensions
      if (!nodeDimensions)
        return

      // Calculate absolute position once for the node
      const absolutePos = getAbsoluteNodePosition(nodeId)
      if (!absolutePos || !isValidPosition(absolutePos))
        return

      const depth = calculateNodeDepth(nodeId, nodes)
      const bounds = {
        x: absolutePos.x,
        y: absolutePos.y,
        width: nodeDimensions.width,
        height: nodeDimensions.height,
      }

      // Check each schema port
      schemaPorts.forEach(([portId, objectConfig]) => {
        // Check if there's already a captured node AND it still exists
        const capturedNodeId = objectConfig.ui?.nodeSchemaCapture?.capturedNodeId
        if (capturedNodeId && nodes[capturedNodeId]) {
          // Node exists, don't accept new drops
          return
        }

        const target: DragDropTarget = {
          nodeId,
          depth,
          type: 'schema',
          priority: calculateDropPriority({ depth, type: 'schema' }),
          bounds,
          portId,
        }
        targets.push(target)
      })
    })

    return targets
  }, [validGroupNodes, nodesWithSchemaPorts, nodes, getAbsoluteNodePosition])

  /**
   * Handle group parenting logic
   */
  const handleGroupParenting = useCallback((
    nodeDragStop: Node,
    absoluteNodePosition: { x: number, y: number },
    flowNode: INode,
    targetGroupId: string,
    currentParentId?: string,
  ) => {
    if (!activeFlow?.id)
      return

    const targetGroupNode = nodes[targetGroupId]
    if (!targetGroupNode)
      return

    if (targetGroupId !== currentParentId && !wouldCreateCircularDependency(nodeDragStop.id, targetGroupId, nodes)) {
      // Get the absolute position of the target group for correct relative calculation
      const targetGroupAbsolutePos = getAbsoluteNodePosition(targetGroupId)
      if (!targetGroupAbsolutePos) {
        console.warn('Could not calculate absolute position for target group:', targetGroupId)
        return
      }

      const newPosition = getNodePositionInsideParent(
        absoluteNodePosition,
        targetGroupAbsolutePos,
      )

      if (!isValidPosition(newPosition)) {
        console.warn('Invalid position when moving into group:', {
          absolute: absoluteNodePosition,
          targetGroupAbsolute: targetGroupAbsolutePos,
          calculated: newPosition,
          targetGroup: targetGroupNode.id,
        })
        return
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
        parentNodeId: targetGroupId,
        position: roundPosition(newPosition as Position),
        version: flowNode.getVersion() + 1,
      })
    }
  }, [activeFlow?.id, nodes, getAbsoluteNodePosition])

  /**
   * Handle moving node out of group
   */
  const handleMoveOutOfGroup = useCallback((
    nodeDragStop: Node,
    absoluteNodePosition: { x: number, y: number },
    flowNode: INode,
    currentParentId?: string,
  ) => {
    if (!activeFlow?.id || !currentParentId)
      return

    if (!isValidPosition(absoluteNodePosition)) {
      console.warn('Invalid position when moving out of group')
      return
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
  }, [activeFlow?.id, nodes])

  /**
   * Handle drop with priority-based target selection
   * Schema drops get higher priority than group parenting
   * For groups: innermost (highest depth) group containing the mouse position is selected
   */
  const handlePrioritizedDrop = useCallback((
    nodeDragStop: Node,
    absoluteNodePosition: { x: number, y: number },
    flowNode: INode,
    currentParentId?: string,
  ) => {
    if (!activeFlow?.id)
      return

    // The drag/drop store already determined the target based on mouse position
    // We just need to check what was selected
    if (hoveredDropTarget) {
      if (hoveredDropTarget.type === 'schema') {
        // Handle schema drop
        checkForNodeSchemaDrop(nodeDragStop, absoluteNodePosition, nodes)
        return
      } else if (hoveredDropTarget.type === 'group') {
        // Handle group parenting
        handleGroupParenting(nodeDragStop, absoluteNodePosition, flowNode, hoveredDropTarget.nodeId, currentParentId)
        return
      }
    }

    // Handle moving out of group if no valid targets found
    handleMoveOutOfGroup(nodeDragStop, absoluteNodePosition, flowNode, currentParentId)
  }, [activeFlow?.id, nodes, checkForNodeSchemaDrop, handleGroupParenting, handleMoveOutOfGroup, hoveredDropTarget])

  // Handle node drag end
  const onNodeDragStop = useCallback((
    event: React.MouseEvent,
    nodesDrag: Node,
    nodesDragStop: Node[],
  ) => {
    // Update mouse position one last time with flow coordinates
    const finalMousePos = screenToFlowPosition
      ? screenToFlowPosition({ x: event.clientX, y: event.clientY })
      : { x: event.clientX, y: event.clientY }
    updateMousePosition(finalMousePos)

    // Filter valid nodes
    nodesDragStop = nodesDragStop.filter(node =>
      node.position && isValidPosition(node.position),
    )

    // Ensure dragged node is in the array
    if (!nodesDragStop.find(node => node.id === nodesDrag.id)
      && isValidPosition(nodesDrag.position)) {
      nodesDragStop.push(nodesDrag)
    }

    // Clear drag state for all stopped nodes (fixes pulse animation bug)
    nodesDragStop.forEach((node) => {
      nodeDragEnd(node.id)
    })

    // Prepare end drag events
    const endDragEvents: NodeDragEndEvent[] = []

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

      if (!flowNode)
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
      // For nodes with parents, we need to calculate the full absolute position
      let absoluteNodePosition: Position
      if (currentParentId) {
        // Use our helper to get the parent's absolute position
        const parentAbsolutePos = getAbsoluteNodePosition(currentParentId)
        if (!parentAbsolutePos) {
          console.warn('Could not calculate parent absolute position:', currentParentId)
          continue
        }
        absoluteNodePosition = getNodePositionInFlow(nodeDragStop.position, parentAbsolutePos)
      } else {
        absoluteNodePosition = { ...nodeDragStop.position } // Create new object to avoid mutations
      }

      // Validate absolute position
      if (!isValidPosition(absoluteNodePosition)) {
        console.warn('Invalid absolute position calculated:', {
          node: nodeDragStop.id,
          original: nodeDragStop.position,
          calculated: absoluteNodePosition,
        })
        continue
      }

      // Use prioritized drop handling instead of separate checks
      handlePrioritizedDrop(nodeDragStop, absoluteNodePosition, flowNode, currentParentId)

      // Add to end drag events
      endDragEvents.push({
        nodeId: nodeDragStop.id,
        position: nodeDragStop.position,
        absolutePosition: absoluteNodePosition,
        mousePosition: finalMousePos,
      })
    }

    // End drag tracking
    if (endDragEvents.length > 0) {
      endDrag(endDragEvents.length === 1 ? endDragEvents[0] : endDragEvents)
    }

    // Clear drop targets
    clearDropTargets()
  }, [activeFlow?.id, nodes, handlePrioritizedDrop, getAbsoluteNodePosition, updateMousePosition, endDrag, clearDropTargets, screenToFlowPosition])

  const onNodeDragStart = useCallback((
    event: React.MouseEvent,
    nodesDrag: Node,
    nodesDragStop: Node[],
  ) => {
    // Get all nodes being dragged
    const draggedNodes = nodesDragStop.length > 0 ? nodesDragStop : [nodesDrag]

    // Track drag start for all dragged nodes (fixes pulse animation bug)
    draggedNodes.forEach((node) => {
      nodeDragStart(node.id)
    })

    // Convert screen coordinates to flow coordinates
    const mousePos = screenToFlowPosition
      ? screenToFlowPosition({ x: event.clientX, y: event.clientY })
      : { x: event.clientX, y: event.clientY }

    // Start drag tracking
    const dragEvents = draggedNodes.map((node) => {
      const flowNode = nodes[node.id]
      if (!flowNode)
        return null

      const absolutePos = getAbsoluteNodePosition(node.id) || node.position

      return {
        nodeId: node.id,
        position: node.position,
        absolutePosition: absolutePos,
        width: node.width || 200,
        height: node.height || 100,
        mousePosition: mousePos,
      }
    }).filter(Boolean) as NodeDragStartEvent[]

    if (dragEvents.length > 0) {
      startDrag(dragEvents.length === 1 ? dragEvents[0] : dragEvents)

      // Calculate and update potential drop targets
      const targets = getAllDropTargets(nodesDrag)
      updateDropTargets(targets)
    }
  }, [nodes, startDrag, updateDropTargets, getAllDropTargets, getAbsoluteNodePosition, screenToFlowPosition])

  // Handle mouse move during drag (for updating drop targets)
  const onNodeDrag = useCallback((
    event: React.MouseEvent,
    node: Node,
    nodes: Node[],
  ) => {
    // Convert screen coordinates to flow coordinates
    const mousePos = screenToFlowPosition
      ? screenToFlowPosition({ x: event.clientX, y: event.clientY })
      : { x: event.clientX, y: event.clientY }

    // Update mouse position with flow coordinates (throttled)
    throttledUpdateMousePosition(mousePos)

    // Update drag positions
    const draggedNodes = nodes.length > 0 ? nodes : [node]
    const updates = draggedNodes.map((n) => {
      const absolutePos = getAbsoluteNodePosition(n.id) || n.position
      return {
        nodeId: n.id,
        position: n.position,
        absolutePosition: absolutePos,
        mousePosition: mousePos,
      }
    })

    if (updates.length > 0) {
      updateDragPosition(updates.length === 1 ? updates[0] : updates)
    }
  }, [throttledUpdateMousePosition, updateDragPosition, getAbsoluteNodePosition, screenToFlowPosition])

  return {
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  }
}
