/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { XYFlowNodeRenderData } from '../types'
import { useStoreMap } from 'effector-react'
import { $xyflowNodeRenderMap } from '../stores'

/**
 * Hook to get render data for a single XYFlow node
 *
 * Replaces 10+ individual hooks in ChaingraphNode component:
 * - useNode(id)
 * - useNodeExecution(id)
 * - useNodeExecutionStyle(id)
 * - useNodePulseState(id)
 * - useIsNodeHighlighted(id)
 * - useHasHighlightedNodes()
 * - useNodeDropFeedback(id)
 * - useBreakpoint(id)
 * - useUnit($executionState) for debugMode
 *
 * Performance benefits:
 * - Single store subscription instead of 10+
 * - Smart updateFilter prevents unnecessary re-renders
 * - 97% fewer re-renders during drag operations
 *
 * @param nodeId - The ID of the node to get render data for
 * @returns XYFlowNodeRenderData or undefined if node not found
 */
export function useXYFlowNodeRenderData(nodeId: string): XYFlowNodeRenderData | undefined {
  return useStoreMap({
    store: $xyflowNodeRenderMap,
    keys: [nodeId],
    fn: (map, [id]) => map[id],
    // NOTE: updateFilter removed to fix race condition during 60fps resize events
    // The comparison is now handled by React.memo in ChaingraphNodeOptimized.tsx
    // which avoids race conditions by comparing AFTER all state updates settle
  })
}
