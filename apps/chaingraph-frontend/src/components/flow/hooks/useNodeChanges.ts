/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'
import type { NodeChange } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'
import { trace } from '@/lib/perf-trace'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, removeNodeFromFlow, updateNodePosition, updateNodePositionOnly, updateNodeUI } from '@/store/nodes'
import { positionInterpolator } from '@/store/nodes/position-interpolation-advanced'
import { roundPosition } from './useFlowUtils'

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
      const currentNodes = $nodes.getState()
      if (!currentNodes)
        return

      // Handle node changes (position, selection, etc)
      changes.forEach((change) => {
      switch (change.type) {
        case 'position':
          {
            if (!change.dragging)
              return

            const node = currentNodes[change.id]
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

            // Use position-only update during drag to avoid $nodes cascade
            updateNodePositionOnly({
              nodeId: change.id,
              position: roundPosition(change.position as Position),
            })

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
          // SKIP all dimension changes from XYFlow's onNodesChange
          // XYFlow reports measured DOM sizes which conflict with resize handle positions
          //
          // Dimension sources are now:
          // - Width: NodeResizeControl onResize handler (user intent)
          // - Height: useElementResize content detection (for regular nodes)
          // - Both: NodeResizer onResize handler (for GroupNode)
          //
          // GroupNode is also skipped here as it handles dimensions in its own component
          break
        }

        case 'select':
          {
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
    }
    finally {
      trace.end(spanId)
    }
  }, [activeFlow])

  return {
    onNodesChange,
  }
}
