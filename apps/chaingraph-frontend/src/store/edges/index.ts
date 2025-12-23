/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Hooks
export { useEdgesForNode, useEdgesForPort } from './hooks/useEdges'
export { useEdgeRenderDataForNode, useEdgeRenderDataForPort, useXYFlowEdges } from './hooks/useXYFlowEdges'

// Stores
export {
  // Core edge data
  $edges,
  // Granular edge render data (new)
  $edgeRenderMap,
  $xyflowEdgesList,
  // Backward compatibility alias
  $xyflowEdges,
  // Events
  edgeDataChanged,
  removeEdge,
  requestAddEdge,
  requestRemoveEdge,
  resetEdges,
  setEdge,
  setEdges,
} from './stores'

// Utilities
export { computeExecutionStyle, computeHighlightStyle, extractEdgeColor } from './utils'

// Types
export * from './types'
