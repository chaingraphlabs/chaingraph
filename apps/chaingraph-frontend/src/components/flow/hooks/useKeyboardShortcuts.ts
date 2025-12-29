/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback, useEffect } from 'react'
import { copySelection, duplicate, paste } from '@/store/clipboard'
import { $activeFlowId } from '@/store/flow'
import { $hasAnyFocusedEditor } from '@/store/focused-editors'
import {
  $hasActiveOverlay,
  $isGrabMode,
  $isOverCanvas,
  shouldIgnoreHotkey,
  showDeleteConfirmation,
  updateCanvasFlowPosition,
} from '@/store/hotkeys'
import {
  $nodes,
  $selectedNodeIds,
  removeNodeFromFlow,
  updateNodeUILocal,
} from '@/store/nodes'

/**
 * Unified keyboard shortcuts for the flow editor.
 *
 * Combines all keyboard functionality into a single hook with one event listener:
 * - Ctrl/Cmd+C: Copy selected nodes/edges/anchors
 * - Ctrl/Cmd+V: Paste from clipboard
 * - Shift+D: Duplicate (Blender-style copy+paste with offset)
 * - A: Select all / Deselect all (toggle)
 * - F: Frame selection (zoom to fit)
 * - X: Delete selected with confirmation
 *
 * This replaces useFlowCopyPaste + useSelectionHotkeys to avoid duplicate listeners.
 */
export function useKeyboardShortcuts() {
  const selectedNodeIds = useUnit($selectedNodeIds)
  const nodes = useUnit($nodes)
  const isOverCanvas = useUnit($isOverCanvas)
  const hasAnyFocusedEditor = useUnit($hasAnyFocusedEditor)
  const hasActiveOverlay = useUnit($hasActiveOverlay)
  const activeFlowId = useUnit($activeFlowId)
  const isGrabMode = useUnit($isGrabMode)
  const { fitView, screenToFlowPosition } = useReactFlow()

  // Track mouse position in flow coordinates for paste operations
  useEffect(() => {
    if (!isOverCanvas)
      return

    const handleMouseMove = (e: MouseEvent) => {
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      updateCanvasFlowPosition(flowPos)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isOverCanvas, screenToFlowPosition])

  // Handle A key - Select All / Deselect All
  const handleSelectAll = useCallback(() => {
    if (!activeFlowId)
      return

    const allNodeIds = Object.keys(nodes)
    const hasSelection = selectedNodeIds.length > 0

    allNodeIds.forEach((nodeId) => {
      const node = nodes[nodeId]
      if (!node)
        return

      updateNodeUILocal({
        flowId: activeFlowId,
        nodeId,
        version: 0,
        ui: {
          ...node.metadata.ui,
          state: {
            ...node.metadata.ui?.state,
            isSelected: !hasSelection,
          },
        },
      })
    })
  }, [activeFlowId, nodes, selectedNodeIds.length])

  // Handle F key - Frame Selection
  const handleFrameSelection = useCallback(() => {
    if (selectedNodeIds.length === 0)
      return

    fitView({
      nodes: selectedNodeIds.map(id => ({ id })),
      padding: 0.2,
      duration: 300,
    })
  }, [selectedNodeIds, fitView])

  // Handle X key - Delete with confirmation
  const handleDelete = useCallback(() => {
    if (selectedNodeIds.length === 0)
      return
    showDeleteConfirmation()
  }, [selectedNodeIds.length])

  // Main keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if not over canvas, editor is focused, overlay is active, or in grab mode
      if (!isOverCanvas || hasAnyFocusedEditor || hasActiveOverlay || isGrabMode)
        return

      // Skip if typing in an input element
      if (shouldIgnoreHotkey(e))
        return

      const key = e.key.toLowerCase()
      const isMod = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey

      // Ctrl/Cmd+C - Copy
      if (key === 'c' && isMod && !isShift) {
        e.preventDefault()
        e.stopPropagation()
        copySelection()
        return
      }

      // Ctrl/Cmd+V - Paste
      if (key === 'v' && isMod && !isShift) {
        e.preventDefault()
        e.stopPropagation()
        paste()
        return
      }

      // Shift+D - Duplicate (Blender-style)
      if (key === 'd' && isShift && !isMod) {
        e.preventDefault()
        e.stopPropagation()
        duplicate()
        return
      }

      // A - Select All / Deselect All
      if (key === 'a' && !isMod && !isShift) {
        e.preventDefault()
        e.stopPropagation()
        handleSelectAll()
        return
      }

      // F - Frame Selection
      if (key === 'f' && !isMod && !isShift) {
        if (selectedNodeIds.length > 0) {
          e.preventDefault()
          e.stopPropagation()
          handleFrameSelection()
        }
        return
      }

      // X - Delete
      if (key === 'x' && !isMod && !isShift) {
        if (selectedNodeIds.length > 0) {
          e.preventDefault()
          e.stopPropagation()
          handleDelete()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [
    isOverCanvas,
    hasAnyFocusedEditor,
    hasActiveOverlay,
    isGrabMode,
    selectedNodeIds.length,
    handleSelectAll,
    handleFrameSelection,
    handleDelete,
  ])

  // Export delete confirmation handler for dialog
  const confirmDeleteSelectedNodes = useCallback(() => {
    if (!activeFlowId)
      return

    selectedNodeIds.forEach((nodeId) => {
      removeNodeFromFlow({
        flowId: activeFlowId,
        nodeId,
      })
    })
  }, [activeFlowId, selectedNodeIds])

  return {
    confirmDeleteSelectedNodes,
  }
}
