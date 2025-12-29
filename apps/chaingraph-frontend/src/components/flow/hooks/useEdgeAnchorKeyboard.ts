/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useEffect } from 'react'
import { $selectedAnchorId, deselectAnchor } from '@/store/edges/anchor-selection'
import { removeAnchorLocal } from '@/store/edges/anchors'
import { $selectedEdgeId } from '@/store/edges/selection'
import { shouldIgnoreHotkey } from '@/store/hotkeys'

/**
 * Hook for handling keyboard shortcuts when anchors are selected
 * Supports Delete/Backspace to remove anchors and Escape to deselect
 */
export function useEdgeAnchorKeyboard() {
  const selectedEdgeId = useUnit($selectedEdgeId)
  const selectedAnchorId = useUnit($selectedAnchorId)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if anchor is selected
      if (!selectedAnchorId || !selectedEdgeId)
        return

      // Skip if typing in an input element (e.g., search box, text fields)
      if (shouldIgnoreHotkey(e))
        return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent default behavior (ReactFlow might try to delete edge)
        e.preventDefault()
        e.stopPropagation()

        // Remove the selected anchor
        removeAnchorLocal({
          edgeId: selectedEdgeId,
          anchorId: selectedAnchorId,
        })
        deselectAnchor()
      }

      if (e.key === 'Escape') {
        deselectAnchor()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [selectedAnchorId, selectedEdgeId])
}
