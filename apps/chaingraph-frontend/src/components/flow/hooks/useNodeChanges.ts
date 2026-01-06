/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, Position } from '@badaitech/chaingraph-types'
import type { NodeChange } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'
import { trace } from '@/lib/perf-trace'
import { $anchorNodes, removeAnchorNode, updateAnchorNodeParent, updateAnchorNodePosition, updateAnchorNodeSelection } from '@/store/edges/anchor-nodes'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, removeNodeFromFlow, updateNodeDimensionsLocal, updateNodePosition, updateNodePositionOnly, updateNodeUI } from '@/store/nodes'
import { positionInterpolator } from '@/store/nodes/position-interpolation-advanced'
import { getNodePositionInFlow, getNodePositionInsideParent } from '../utils/node-position'
import { calculateNodeDepth, roundPosition } from './useFlowUtils'

/**
 * Find the deepest group node that contains the given absolute position
 * Returns the group node ID or undefined if not inside any group
 */
function findGroupAtPosition(
  absolutePosition: { x: number, y: number },
  nodes: Record<string, INode>,
): string | undefined {
  let bestMatch: { id: string, depth: number } | undefined

  for (const [nodeId, node] of Object.entries(nodes)) {
    // Only check group nodes with valid dimensions
    if (node.metadata.category !== 'group')
      continue
    const ui = node.metadata.ui
    if (!ui?.position || !ui?.dimensions)
      continue

    // Calculate absolute position of the group (considering nested groups)
    let groupAbsolutePos = { ...ui.position }
    let currentNode = node
    while (currentNode.metadata.parentNodeId) {
      const parentNode = nodes[currentNode.metadata.parentNodeId]
      if (!parentNode?.metadata.ui?.position)
        break
      groupAbsolutePos = getNodePositionInFlow(groupAbsolutePos, parentNode.metadata.ui.position)
      currentNode = parentNode
    }

    const bounds = {
      x: groupAbsolutePos.x,
      y: groupAbsolutePos.y,
      width: ui.dimensions.width,
      height: ui.dimensions.height,
    }

    // Check if position is inside this group
    if (
      absolutePosition.x >= bounds.x
      && absolutePosition.x <= bounds.x + bounds.width
      && absolutePosition.y >= bounds.y
      && absolutePosition.y <= bounds.y + bounds.height
    ) {
      // Calculate depth to find innermost group
      const depth = calculateNodeDepth(nodeId, nodes)
      if (!bestMatch || depth > bestMatch.depth) {
        bestMatch = { id: nodeId, depth }
      }
    }
  }

  return bestMatch?.id
}

/**
 * Hook for handling node changes (position, dimensions, selection, removal)
 */
export function useNodeChanges() {
  const activeFlow = useUnit($activeFlowMetadata)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const spanId = trace.start('drag.onNodesChange', {
      category: 'event',
      tags: { changeCount: changes?.length ?? 0 },
    })

    try {
      if (!activeFlow || !changes || activeFlow.id === undefined)
        return

      // Get current nodes state inside callback to avoid dependency
      const getStateSpan = trace.start('drag.getState', { category: 'event' })
      const currentNodes = $nodes.getState()
      trace.end(getStateSpan)

      if (!currentNodes)
        return

      // Handle node changes (position, selection, etc)
      changes.forEach((change) => {
        // Skip changes that don't have an ID (like 'add' changes)
        if (!('id' in change)) {
          return
        }

        // Check if this is an anchor node (IDs start with 'anchor-')
        const isAnchorNode = change.id.startsWith('anchor-')

        switch (change.type) {
          case 'position':
            {
              if (!change.position || !change.position.x || !change.position.y) {
                return
              }

              // Handle anchor node position changes
              if (isAnchorNode) {
                if (change.dragging) {
                // During drag: just update position
                  updateAnchorNodePosition({
                    anchorNodeId: change.id,
                    x: Math.round(change.position.x),
                    y: Math.round(change.position.y),
                  })
                } else {
                // On drag end: check for group drop and update parent
                  const anchorNodes = $anchorNodes.getState()
                  const currentAnchor = anchorNodes.get(change.id)
                  if (currentAnchor) {
                  // Preserve selection state - will be reapplied after position/parent updates
                    const wasSelected = currentAnchor.selected
                    // Calculate absolute position for group detection
                    // Anchor position is relative to parent if it has one
                    let absolutePosition = {
                      x: Math.round(change.position.x),
                      y: Math.round(change.position.y),
                    }

                    if (currentAnchor.parentNodeId) {
                    // Get parent node's absolute position
                      const parentNode = currentNodes[currentAnchor.parentNodeId]
                      if (parentNode?.metadata.ui?.position) {
                        let parentAbsPos = { ...parentNode.metadata.ui.position }
                        // Traverse parent chain for nested groups
                        let current = parentNode
                        while (current.metadata.parentNodeId) {
                          const grandParent = currentNodes[current.metadata.parentNodeId]
                          if (!grandParent?.metadata.ui?.position)
                            break
                          parentAbsPos = getNodePositionInFlow(parentAbsPos, grandParent.metadata.ui.position)
                          current = grandParent
                        }
                        absolutePosition = getNodePositionInFlow(absolutePosition, parentAbsPos)
                      }
                    }

                    // Find target group at this position
                    const targetGroupId = findGroupAtPosition(absolutePosition, currentNodes)

                    // Update parent if changed
                    if (targetGroupId !== currentAnchor.parentNodeId) {
                      if (targetGroupId) {
                      // Moving into a group - calculate position relative to group
                        const targetGroup = currentNodes[targetGroupId]
                        if (targetGroup?.metadata.ui?.position) {
                        // Get target group's absolute position
                          let targetAbsPos = { ...targetGroup.metadata.ui.position }
                          let current = targetGroup
                          while (current.metadata.parentNodeId) {
                            const parent = currentNodes[current.metadata.parentNodeId]
                            if (!parent?.metadata.ui?.position)
                              break
                            targetAbsPos = getNodePositionInFlow(targetAbsPos, parent.metadata.ui.position)
                            current = parent
                          }

                          // Calculate relative position inside target group
                          const relativePosition = getNodePositionInsideParent(absolutePosition, targetAbsPos)
                          updateAnchorNodePosition({
                            anchorNodeId: change.id,
                            x: Math.round(relativePosition.x),
                            y: Math.round(relativePosition.y),
                          })
                        }
                      } else {
                      // Moving out of group to root - use absolute position
                        updateAnchorNodePosition({
                          anchorNodeId: change.id,
                          x: Math.round(absolutePosition.x),
                          y: Math.round(absolutePosition.y),
                        })
                      }

                      updateAnchorNodeParent({
                        anchorNodeId: change.id,
                        parentNodeId: targetGroupId,
                      })
                    }
                  }

                  // ALWAYS reapply selection state after drag ends
                  // This is OUTSIDE the currentAnchor check above because XYFlow
                  // sends the position change event regardless of anchor state
                  // Must use setTimeout to ensure it runs after XYFlow's internal state updates
                  if (change.position) {
                    setTimeout(() => {
                      updateAnchorNodeSelection({
                        anchorNodeId: change.id,
                        selected: true,
                      })
                    }, 0)
                  }
                }
                return
              }

              // Regular nodes only update during drag
              if (!change.dragging)
                return

              // Handle regular node position changes
              const node = currentNodes[change.id]
              if (!node) {
                return
              }

              if (node.metadata.ui?.state?.isMovingDisabled === true) {
                console.warn(`[useNodeChanges] Node ${node.id} is moving disabled, skipping position update`)
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

              // Use position-only update during drag to avoid $nodes cascade
              const updateSpan = trace.start('drag.updatePositionOnly', {
                category: 'event',
                tags: { nodeId: change.id },
              })
              updateNodePositionOnly({
                nodeId: change.id,
                position: roundPosition(change.position as Position),
              })
              trace.end(updateSpan)

              // Also trigger server sync (throttled separately at 500ms)
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
            // Sync XYFlow's dimension changes to our Effector stores
            // This prevents XYFlow from being reset to old dimensions on re-render
            if (!change.dimensions)
              break

            const node = currentNodes[change.id]
            if (!node)
              break

            // Only update if dimensions actually changed
            const currentDims = node.metadata.ui?.dimensions
            const newWidth = change.dimensions.width
            const newHeight = change.dimensions.height

            if (currentDims?.width !== newWidth || currentDims?.height !== newHeight) {
              updateNodeDimensionsLocal({
                flowId: activeFlow.id!,
                nodeId: change.id,
                dimensions: {
                  width: newWidth,
                  height: newHeight,
                },
                version: node.getVersion(),
              })
            }
            break
          }

          case 'select':
            {
            // Handle anchor node selection changes
              if (isAnchorNode) {
                updateAnchorNodeSelection({
                  anchorNodeId: change.id,
                  selected: change.selected,
                })
                return
              }

              // Handle regular node selection changes
              const node = currentNodes[change.id]
              if (!node)
                return

              updateNodeUI({
                flowId: activeFlow.id!,
                nodeId: change.id,
                version: 0,
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
            // Handle anchor node removal
              if (isAnchorNode) {
                removeAnchorNode({
                  anchorNodeId: change.id,
                })
                return
              }

              // Handle regular node removal
              const node = currentNodes[change.id]
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
          // console.warn(`[useNodeChanges] Unhandled node change:`, change)
            break
        }
      })
    } finally {
      trace.end(spanId)
    }
  }, [activeFlow])

  return {
    onNodesChange,
  }
}
