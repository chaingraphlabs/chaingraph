/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'
import type { NodeChange } from '@xyflow/react'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, removeNodeFromFlow, updateNodePosition, updateNodeUI } from '@/store/nodes'
import { positionInterpolator } from '@/store/nodes/position-interpolation-advanced'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'
import { roundPosition } from './useFlowUtils'

/**
 * Hook for handling node changes (position, dimensions, selection, removal)
 */
export function useNodeChanges() {
  const activeFlow = useUnit($activeFlowMetadata)
  const nodes = useUnit($nodes)

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

          if (node.metadata.category === 'group') {
            // ignore group node dimension changes, is is handled by the group node itself
            return
          }

          if (!change.dimensions || !change.dimensions.width || !change.dimensions.height) {
            console.warn(`[useNodeChanges] Invalid dimensions change:`, change)
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

            updateNodeUI({
              flowId: activeFlow.id!,
              nodeId: change.id,
              version: node.getVersion() + 1,
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
          // console.warn(`[useNodeChanges] Unhandled node change:`, change)
          break
      }
    })
  }, [activeFlow, nodes])

  return {
    onNodesChange,
  }
}
