/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { requestRemoveEdge } from '@/store/edges'
import { $selectedEdgeId, deselectEdge } from '@/store/edges/selection'
import { $activeFlowId } from '@/store/flow'

/**
 * Hook for handling keyboard shortcuts when edges are selected
 * Supports Delete/Backspace to remove edges
 */
export function useEdgeKeyboardShortcuts() {
  const selectedEdgeId = useUnit($selectedEdgeId)
  const activeFlowId = useUnit($activeFlowId)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if edge is selected (but not if anchor is selected)
      if (!selectedEdgeId || !activeFlowId)
        return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent default behavior
        e.preventDefault()
        e.stopPropagation()

        // Remove the selected edge
        requestRemoveEdge({
          flowId: activeFlowId,
          edgeId: selectedEdgeId,
        })
        deselectEdge()
      }

      if (e.key === 'Escape') {
        deselectEdge()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [selectedEdgeId, activeFlowId])
}
