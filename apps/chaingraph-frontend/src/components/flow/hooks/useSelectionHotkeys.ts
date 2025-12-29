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
import { $activeFlowId } from '@/store/flow'
import { $hasAnyFocusedEditor } from '@/store/focused-editors'
import {
  $hasActiveOverlay,
  $isGrabMode,
  $isOverCanvas,
  shouldIgnoreHotkey,
  showDeleteConfirmation,
} from '@/store/hotkeys'
import {
  $nodes,
  $selectedNodeIds,
  removeNodeFromFlow,
  updateNodeUILocal,
} from '@/store/nodes'
import { useFlowCopyPaste } from './useFlowCopyPaste'

/**
 * Hook for implementing selection-related hotkeys:
 * - A: Select all / Deselect all (toggle)
 * - Shift+D: Duplicate selected nodes
 * - F: Frame selection (zoom to fit selected nodes)
 * - X: Delete selected with confirmation
 */
export function useSelectionHotkeys() {
  const selectedNodeIds = useUnit($selectedNodeIds)
  const nodes = useUnit($nodes)
  const isOverCanvas = useUnit($isOverCanvas)
  const hasAnyFocusedEditor = useUnit($hasAnyFocusedEditor)
  const hasActiveOverlay = useUnit($hasActiveOverlay)
  const activeFlowId = useUnit($activeFlowId)
  const isGrabMode = useUnit($isGrabMode)
  const { fitView } = useReactFlow()

  // Get copy/paste utilities for duplicate functionality
  const { copySelectedNodes, pasteNodes } = useFlowCopyPaste()

  // Handle A key - Select All / Deselect All
  const handleSelectAll = useCallback(() => {
    if (!activeFlowId)
      return

    const allNodeIds = Object.keys(nodes)
    const hasSelection = selectedNodeIds.length > 0

    // Toggle: if any selected, deselect all; otherwise select all
    allNodeIds.forEach((nodeId) => {
      const node = nodes[nodeId]
      if (!node)
        return

      updateNodeUILocal({
        flowId: activeFlowId,
        nodeId,
        version: 0, // Version is calculated on server sync
        ui: {
          ...node.metadata.ui,
          state: {
            ...node.metadata.ui?.state,
            isSelected: !hasSelection, // Select if nothing selected, deselect if something selected
          },
        },
      })
    })
  }, [activeFlowId, nodes, selectedNodeIds.length])

  // Handle Shift+D - Duplicate
  const handleDuplicate = useCallback(async () => {
    if (selectedNodeIds.length === 0)
      return

    // Copy selected nodes
    const copyResult = await copySelectedNodes()
    if (!copyResult.success)
      return

    // Paste with offset
    await pasteNodes({
      positionOffset: { x: 50, y: 50 },
    })
  }, [selectedNodeIds.length, copySelectedNodes, pasteNodes])

  // Handle F key - Frame Selection
  const handleFrameSelection = useCallback(() => {
    if (selectedNodeIds.length === 0)
      return

    // Fit view to selected nodes
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

      // Skip if typing in an input element (e.g., search box, text fields)
      if (shouldIgnoreHotkey(e))
        return

      const key = e.key.toLowerCase()

      // A - Select All / Deselect All
      if (key === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        handleSelectAll()
        return
      }

      // Shift+D - Duplicate
      if (key === 'd' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        e.stopPropagation()
        handleDuplicate()
        return
      }

      // F - Frame Selection
      if (key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Only if we have selected nodes
        if (selectedNodeIds.length > 0) {
          e.preventDefault()
          e.stopPropagation()
          handleFrameSelection()
        }
        return
      }

      // X - Delete with confirmation
      if (key === 'x' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Only if we have selected nodes
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
    handleDuplicate,
    handleFrameSelection,
    handleDelete,
  ])

  // Export the delete handler for use by the confirmation dialog
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
