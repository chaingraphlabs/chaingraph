/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { SelectionMode } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback, useEffect } from 'react'
import { $hasAnyFocusedEditor } from '@/store/focused-editors'
import {
  $hasActiveOverlay,
  $isBoxSelectionMode,
  $isOverCanvas,
  enterBoxSelectionMode,
  exitBoxSelectionMode,
  shouldIgnoreHotkey,
} from '@/store/hotkeys'

/**
 * Return type for useBoxSelection hook
 */
export interface UseBoxSelectionReturn {
  /** Whether selection on drag is enabled */
  selectionOnDrag: boolean
  /** The selection mode (Partial for box select, Full for normal) */
  selectionMode: SelectionMode
  /** Whether pan on drag is enabled (disabled during box selection) */
  panOnDrag: boolean
  /** Handler to call when selection ends (mouseup after drag selection) */
  onSelectionEnd: () => void
}

/**
 * Hook for implementing Blender-style box selection with B key.
 *
 * Behavior:
 * 1. Press B while cursor is over canvas -> enables box selection mode
 * 2. Drag to create selection box
 * 3. After selection drag ends -> automatically exits box selection mode
 *
 * @returns Props to pass to ReactFlow component
 */
export function useBoxSelection(): UseBoxSelectionReturn {
  const isBoxSelectionMode = useUnit($isBoxSelectionMode)
  const isOverCanvas = useUnit($isOverCanvas)
  const hasAnyFocusedEditor = useUnit($hasAnyFocusedEditor)
  const hasActiveOverlay = useUnit($hasActiveOverlay)

  // Handle B key to enter box selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if not over canvas, editor is focused, or overlay is active
      if (!isOverCanvas || hasAnyFocusedEditor || hasActiveOverlay)
        return

      // Skip if typing in an input element (e.g., search box, text fields)
      if (shouldIgnoreHotkey(e))
        return

      // Skip if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)
        return

      if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        e.stopPropagation()
        enterBoxSelectionMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [isOverCanvas, hasAnyFocusedEditor, hasActiveOverlay])

  // Handler to exit box selection mode after selection ends
  const onSelectionEnd = useCallback(() => {
    if (isBoxSelectionMode) {
      exitBoxSelectionMode()
    }
  }, [isBoxSelectionMode])

  // Also exit on Escape key
  useEffect(() => {
    if (!isBoxSelectionMode)
      return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        exitBoxSelectionMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [isBoxSelectionMode])

  return {
    selectionOnDrag: isBoxSelectionMode,
    selectionMode: isBoxSelectionMode ? SelectionMode.Partial : SelectionMode.Full,
    panOnDrag: !isBoxSelectionMode,
    onSelectionEnd,
  }
}
