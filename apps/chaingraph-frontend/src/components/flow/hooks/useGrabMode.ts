/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { GrabPosition } from '@/store/hotkeys'
import { useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback, useEffect, useRef } from 'react'
import { $activeFlowId } from '@/store/flow'
import { $hasAnyFocusedEditor } from '@/store/focused-editors'
import {
  $grabModeState,
  $hasActiveOverlay,
  $isGrabMode,
  $isOverCanvas,
  cancelGrabMode,
  confirmGrabMode,
  enterGrabMode,
  shouldIgnoreHotkey,
} from '@/store/hotkeys'
import { $nodes, $selectedNodeIds, updateNodePosition, updateNodePositionOnly } from '@/store/nodes'

/**
 * Hook for implementing Blender-style grab mode with G key.
 *
 * Behavior:
 * 1. Press G while nodes are selected -> nodes follow cursor
 * 2. Click to confirm new positions
 * 3. Press Escape to cancel and restore original positions
 *
 * This creates a smooth, Blender-like experience where nodes are
 * "attached" to the cursor until placement is confirmed.
 */
export function useGrabMode() {
  const isGrabMode = useUnit($isGrabMode)
  const grabModeState = useUnit($grabModeState)
  const selectedNodeIds = useUnit($selectedNodeIds)
  const nodes = useUnit($nodes)
  const isOverCanvas = useUnit($isOverCanvas)
  const hasAnyFocusedEditor = useUnit($hasAnyFocusedEditor)
  const hasActiveOverlay = useUnit($hasActiveOverlay)
  const activeFlowId = useUnit($activeFlowId)
  const { screenToFlowPosition } = useReactFlow()

  // Track the last mouse position for delta calculation
  const lastMousePosRef = useRef<GrabPosition | null>(null)

  // Handle G key to enter grab mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if not over canvas, editor is focused, overlay is active, or already in grab mode
      if (!isOverCanvas || hasAnyFocusedEditor || hasActiveOverlay || isGrabMode)
        return

      // Skip if typing in an input element (e.g., search box, text fields)
      if (shouldIgnoreHotkey(e))
        return

      // Skip if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)
        return

      // Skip if no nodes are selected
      if (selectedNodeIds.length === 0)
        return

      if (e.key.toLowerCase() === 'g') {
        e.preventDefault()
        e.stopPropagation()

        // Capture current positions of selected nodes
        const originalPositions: Record<string, GrabPosition> = {}
        selectedNodeIds.forEach((nodeId) => {
          const node = nodes[nodeId]
          if (node?.metadata.ui?.position) {
            originalPositions[nodeId] = {
              x: node.metadata.ui.position.x,
              y: node.metadata.ui.position.y,
            }
          }
        })

        // Enter grab mode with the captured positions
        enterGrabMode({
          originalPositions,
          initialMousePosition: { x: 0, y: 0 }, // Will be set on first mouse move
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [isOverCanvas, hasAnyFocusedEditor, hasActiveOverlay, isGrabMode, selectedNodeIds, nodes])

  // Handle mouse move during grab mode
  useEffect(() => {
    if (!isGrabMode) {
      lastMousePosRef.current = null
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })

      if (lastMousePosRef.current === null) {
        // First mouse move - initialize position
        lastMousePosRef.current = flowPos
        return
      }

      // Calculate delta from last position
      const deltaX = flowPos.x - lastMousePosRef.current.x
      const deltaY = flowPos.y - lastMousePosRef.current.y

      // Update last position
      lastMousePosRef.current = flowPos

      // Move all selected nodes by the delta
      Object.keys(grabModeState.originalPositions).forEach((nodeId) => {
        const node = nodes[nodeId]
        if (node?.metadata.ui?.position && activeFlowId) {
          const currentPos = node.metadata.ui.position
          const newPosition = {
            x: currentPos.x + deltaX,
            y: currentPos.y + deltaY,
          }

          // Immediate visual update
          updateNodePositionOnly({
            nodeId,
            position: newPosition,
          })

          // Trigger throttled sync to $nodes and server (same as normal drag)
          updateNodePosition({
            flowId: activeFlowId,
            nodeId,
            position: newPosition,
            version: 0, // Version calculated on server sync
          })
        }
      })
    }

    // Throttle mouse move for performance (60fps = ~16ms)
    let rafId: number | null = null
    const throttledMouseMove = (e: MouseEvent) => {
      if (rafId !== null)
        return
      rafId = requestAnimationFrame(() => {
        handleMouseMove(e)
        rafId = null
      })
    }

    window.addEventListener('mousemove', throttledMouseMove)
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isGrabMode, grabModeState.originalPositions, nodes, screenToFlowPosition, activeFlowId])

  // Handle click to confirm grab mode
  const handleConfirm = useCallback(() => {
    if (!isGrabMode)
      return
    confirmGrabMode()
  }, [isGrabMode])

  // Handle Escape to cancel grab mode
  const handleCancel = useCallback(() => {
    if (!isGrabMode || !activeFlowId)
      return

    // Restore original positions
    Object.entries(grabModeState.originalPositions).forEach(([nodeId, position]) => {
      // Immediate visual update
      updateNodePositionOnly({
        nodeId,
        position,
      })

      // Sync to $nodes and server
      updateNodePosition({
        flowId: activeFlowId,
        nodeId,
        position,
        version: 0,
      })
    })

    cancelGrabMode()
  }, [isGrabMode, grabModeState.originalPositions, activeFlowId])

  // Set up click and escape handlers during grab mode
  useEffect(() => {
    if (!isGrabMode)
      return

    const handleClick = (e: MouseEvent) => {
      // Prevent the click from selecting/deselecting nodes
      e.preventDefault()
      e.stopPropagation()
      handleConfirm()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleCancel()
      }
    }

    // Use capture phase to intercept before other handlers
    window.addEventListener('click', handleClick, { capture: true })
    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener('click', handleClick, { capture: true })
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [isGrabMode, handleConfirm, handleCancel])

  return {
    isGrabMode,
  }
}
