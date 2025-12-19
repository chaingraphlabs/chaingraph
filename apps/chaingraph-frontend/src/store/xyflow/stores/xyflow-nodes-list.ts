/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Node } from '@xyflow/react'
import type { XYFlowNodeRenderData } from '../types'
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
  const nodes = Object.values(renderMap)
    .filter(r => !r.isHidden)
    .sort((a, b) => {
      // Group nodes first
      if (a.nodeType === 'groupNode' && b.nodeType !== 'groupNode') return -1
      if (a.nodeType !== 'groupNode' && b.nodeType === 'groupNode') return 1
      return 0
    })

  return nodes.map(renderData => ({
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
    zIndex: renderData.zIndex,
    data: {
      node: renderData.node,
      categoryMetadata: renderData.categoryMetadata,
    },
    parentId: renderData.parentNodeId,
    extent: renderData.parentNodeId ? 'parent' : undefined,
    selected: renderData.isSelected,
    hidden: renderData.isHidden,
  }))
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
    return buildXYFlowNodesArray(newRenderMap)
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
      if (changes.length === 0) return currentList

      const changedIds = new Set(changes.map(c => c.nodeId))

      // Check if any visibility changed - requires full rebuild
      const hasVisibilityChange = changes.some(
        c => c.changes.isHidden !== undefined,
      )

      if (hasVisibilityChange) {
        return buildXYFlowNodesArray(renderMap)
      }

      // Surgical update - preserve unchanged node references
      return currentList.map((xyflowNode) => {
        if (!changedIds.has(xyflowNode.id)) {
          return xyflowNode // Preserve reference - React skips re-render
        }

        const renderData = renderMap[xyflowNode.id]
        if (!renderData) return xyflowNode

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
          zIndex: renderData.zIndex,
          data: {
            node: renderData.node,
            categoryMetadata: renderData.categoryMetadata,
          },
        }
      })
    })
  },
  target: $xyflowNodesList,
})
