/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Node } from '@xyflow/react'
import type { XYFlowNodeRenderData } from '../types'
import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode/types'
import { sample } from 'effector'
import { trace } from '@/lib/perf-trace'
import { globalReset } from '@/store/common'
import { clearNodes } from '@/store/nodes/stores'
import { xyflowDomain } from '../domain'
import { setXYFlowNodeRenderMap, xyflowNodesDataChanged } from '../events'
import { $xyflowNodeRenderMap } from './node-render-data'

/**
 * Builds the XYFlow nodes array from the render map
 * Groups are sorted first, then regular nodes
 */
function buildXYFlowNodesArray(renderMap: Record<string, XYFlowNodeRenderData>): Node[] {
  // Build depth map for hierarchy-based sorting
  const depthMap = new Map<string, number>()
  const visiting = new Set<string>() // Track nodes being visited to detect cycles
  const MAX_DEPTH = 50 // Safety limit

  function getDepth(nodeId: string, chainDepth: number = 0): number {
    if (depthMap.has(nodeId))
      return depthMap.get(nodeId)!

    // CYCLE DETECTION: Check if we're currently visiting this node
    if (visiting.has(nodeId)) {
      console.warn(`[XYFlow] Cycle detected in node hierarchy at ${nodeId}`)
      depthMap.set(nodeId, 0) // Break cycle, treat as root
      return 0
    }

    // MAX DEPTH PROTECTION: Prevent stack overflow
    if (chainDepth >= MAX_DEPTH) {
      console.warn(`[XYFlow] Max depth ${MAX_DEPTH} reached for node ${nodeId}`)
      depthMap.set(nodeId, MAX_DEPTH)
      return MAX_DEPTH
    }

    visiting.add(nodeId) // Mark as visiting BEFORE recursion

    const renderData = renderMap[nodeId]
    if (!renderData || !renderData.parentNodeId) {
      depthMap.set(nodeId, 0)
      visiting.delete(nodeId)
      return 0
    }

    const depth = getDepth(renderData.parentNodeId, chainDepth + 1) + 1
    depthMap.set(nodeId, depth)
    visiting.delete(nodeId) // Remove after recursion completes
    return depth
  }

  const nodes = Object.values(renderMap)
    .filter(r => !r.isHidden)
    .sort((a, b) => {
      const depthA = getDepth(a.nodeId)
      const depthB = getDepth(b.nodeId)
      return depthA - depthB
    })

  return nodes.map((renderData) => {
    return {
      id: renderData.nodeId,
      type: renderData.nodeType,
      position: {
        x: Math.round(renderData.position.x),
        y: Math.round(renderData.position.y),
      },
      width: renderData.dimensions.width,
      height: renderData.dimensions.height,
      // Provide measured dimensions to prevent XYFlow error #015
      // "trying to drag a node that is not initialized"
      measured: {
        width: renderData.dimensions.width,
        height: renderData.dimensions.height,
      },
      draggable: renderData.isDraggable,
      // zIndex: renderData.zIndex, // TEMP: Let XYFlow handle z-index natively
      data: {
        categoryMetadata: renderData.categoryMetadata,
        version: renderData.version, // For edge memoization
      },
      parentId: renderData.parentNodeId,
      // extent: renderData.parentNodeId ? 'parent' : undefined,
      selected: renderData.isSelected,
      hidden: renderData.isHidden,
    }
  })
}

/**
 * $xyflowNodesList - Final array for XYFlow
 *
 * Converts render map to array with structural sharing.
 * Preserves unchanged node references to prevent unnecessary React re-renders.
 */
export const $xyflowNodesList = xyflowDomain
  .createStore<Node[]>([])

  // Full rebuild on structure change (via setXYFlowNodeRenderMap)
  .on(setXYFlowNodeRenderMap, (_, newRenderMap) => {
    const spanId = trace.start('store.xyflowNodesList.fullRebuild', {
      category: 'store',
      tags: { nodeCount: Object.keys(newRenderMap).length },
    })
    const result = buildXYFlowNodesArray(newRenderMap)
    trace.end(spanId)
    return result
  })

  .reset(clearNodes)
  .reset(globalReset)

// ============================================================================
// FORK-SAFE SURGICAL UPDATE
// ============================================================================
// CRITICAL: Use sample() with combined source instead of .getState() in handler
// to ensure fork compatibility
sample({
  clock: xyflowNodesDataChanged,
  source: {
    currentList: $xyflowNodesList,
    renderMap: $xyflowNodeRenderMap,
  },
  fn: ({ currentList, renderMap }, { changes }) => {
    return trace.wrap('sample.nodesList.surgical', { category: 'sample' }, () => {
      if (changes.length === 0)
        return currentList

      // Trace incoming changes to understand cascade
      const changeTypes = new Set<string>()
      changes.forEach((c) => {
        Object.keys(c.changes).forEach(k => changeTypes.add(k))
      })
      trace.wrap('surgical.incomingChanges', {
        category: 'sample',
        tags: {
          changedCount: changes.length,
          changeTypes: Array.from(changeTypes).join(','),
        },
      }, () => { })

      const changedIds = new Set(changes.map(c => c.nodeId))

      // Check if any visibility changed - requires full rebuild
      const hasVisibilityChange = changes.some(
        c => c.changes.isHidden !== undefined,
      )

      if (hasVisibilityChange) {
        const rebuildSpan = trace.start('surgical.fullRebuild', {
          category: 'sample',
          tags: {
            reason: 'visibility-change',
            nodeCount: Object.keys(renderMap).length,
            changedNodes: changes
              .filter(c => c.changes.isHidden !== undefined)
              .map(c => `${c.nodeId}:${c.changes.isHidden}`)
              .join(','),
          },
        })
        const result = buildXYFlowNodesArray(renderMap)
        trace.end(rebuildSpan)
        return result
      }

      // Surgical update - preserve unchanged node references
      const mapSpan = trace.start('surgical.map', {
        category: 'sample',
        tags: { nodeCount: currentList.length, changedCount: changedIds.size },
      })
      const result = currentList.map((xyflowNode) => {
        if (!changedIds.has(xyflowNode.id)) {
          return xyflowNode // Preserve reference - React skips re-render
        }

        const renderData = renderMap[xyflowNode.id]
        if (!renderData)
          return xyflowNode

        // Update XYFlow node properties
        return {
          ...xyflowNode,
          position: {
            x: Math.round(renderData.position.x),
            y: Math.round(renderData.position.y),
          },
          width: renderData.dimensions.width,
          height: renderData.dimensions.height,
          // Sync measured dimensions with width/height to prevent error #015
          measured: {
            width: renderData.dimensions.width,
            height: renderData.dimensions.height,
          },
          selected: renderData.isSelected,
          hidden: renderData.isHidden,
          draggable: renderData.isDraggable,
          // zIndex: renderData.zIndex, // TEMP: Let XYFlow handle z-index natively
          data: {
            categoryMetadata: renderData.categoryMetadata,
            version: renderData.version, // For edge memoization
          } as ChaingraphNode['data'],
        }
      })
      trace.end(mapSpan)
      return result
    })
  },
  target: $xyflowNodesList,
})
