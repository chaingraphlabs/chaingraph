/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createDomain } from 'effector'
import { globalReset } from '../common'

/**
 * Hotkeys domain for managing keyboard shortcuts state
 */
export const hotkeysDomain = createDomain('hotkeys')

// =============================================================================
// CURSOR OVER CANVAS TRACKING
// =============================================================================

/** Event to set whether cursor is over the flow canvas */
export const setIsOverCanvas = hotkeysDomain.createEvent<boolean>()

/** Store tracking if cursor is currently over the flow canvas */
export const $isOverCanvas = hotkeysDomain.createStore<boolean>(false)
  .on(setIsOverCanvas, (_, value) => value)
  .reset(globalReset)

// =============================================================================
// BOX SELECTION MODE
// =============================================================================

/** Event to enter box selection mode (B key) */
export const enterBoxSelectionMode = hotkeysDomain.createEvent()

/** Event to exit box selection mode */
export const exitBoxSelectionMode = hotkeysDomain.createEvent()

/** Store tracking if box selection mode is active */
export const $isBoxSelectionMode = hotkeysDomain.createStore<boolean>(false)
  .on(enterBoxSelectionMode, () => true)
  .on(exitBoxSelectionMode, () => false)
  .reset(globalReset)

// =============================================================================
// GRAB MODE (G KEY - BLENDER STYLE)
// =============================================================================

/** Position type for grab mode */
export interface GrabPosition {
  x: number
  y: number
}

/** State for grab mode including original positions for cancel */
export interface GrabModeState {
  /** Whether grab mode is currently active */
  isActive: boolean
  /** Original positions of selected nodes before grab (for cancel/restore) */
  originalPositions: Record<string, GrabPosition>
  /** Initial mouse position when grab mode started */
  initialMousePosition: GrabPosition | null
}

const initialGrabModeState: GrabModeState = {
  isActive: false,
  originalPositions: {},
  initialMousePosition: null,
}

/** Event to enter grab mode with original positions */
export const enterGrabMode = hotkeysDomain.createEvent<{
  originalPositions: Record<string, GrabPosition>
  initialMousePosition: GrabPosition
}>()

/** Event to confirm grab mode (click to place) */
export const confirmGrabMode = hotkeysDomain.createEvent()

/** Event to cancel grab mode (Escape to restore original positions) */
export const cancelGrabMode = hotkeysDomain.createEvent()

/** Store for grab mode state */
export const $grabModeState = hotkeysDomain.createStore<GrabModeState>(initialGrabModeState)
  .on(enterGrabMode, (_, { originalPositions, initialMousePosition }) => ({
    isActive: true,
    originalPositions,
    initialMousePosition,
  }))
  .on(confirmGrabMode, () => initialGrabModeState)
  .on(cancelGrabMode, () => initialGrabModeState)
  .reset(globalReset)

/** Derived store for checking if grab mode is active */
export const $isGrabMode = $grabModeState.map(state => state.isActive)

// =============================================================================
// DELETE CONFIRMATION DIALOG
// =============================================================================

/** Event to show delete confirmation dialog */
export const showDeleteConfirmation = hotkeysDomain.createEvent()

/** Event to hide delete confirmation dialog */
export const hideDeleteConfirmation = hotkeysDomain.createEvent()

/** Event fired when user confirms deletion */
export const confirmDelete = hotkeysDomain.createEvent()

/** Store tracking if delete confirmation dialog is open */
export const $isDeleteDialogOpen = hotkeysDomain.createStore<boolean>(false)
  .on(showDeleteConfirmation, () => true)
  .on(hideDeleteConfirmation, () => false)
  .on(confirmDelete, () => false)
  .reset(globalReset)

// =============================================================================
// CANVAS MOUSE POSITION (for paste, grab, etc.)
// =============================================================================

/** Flow coordinates of mouse cursor when over canvas */
export interface FlowPosition {
  x: number
  y: number
}

/** Event to update canvas mouse position in flow coordinates */
export const updateCanvasFlowPosition = hotkeysDomain.createEvent<FlowPosition>()

/**
 * Store for mouse position in flow coordinates when cursor is over canvas.
 * Used by copy-paste, grab mode, and other features that need cursor position.
 * Updated by useKeyboardShortcuts hook via screenToFlowPosition conversion.
 */
export const $canvasFlowPosition = hotkeysDomain.createStore<FlowPosition>({ x: 0, y: 0 })
  .on(updateCanvasFlowPosition, (_, pos) => pos)
  .reset(globalReset)

// =============================================================================
// OVERLAY TRACKING (context menus, modals, etc.)
// =============================================================================

/** Register an overlay that should block hotkeys */
export const registerOverlay = hotkeysDomain.createEvent<string>()

/** Unregister an overlay when it closes */
export const unregisterOverlay = hotkeysDomain.createEvent<string>()

/** Set of active overlay IDs */
export const $activeOverlays = hotkeysDomain.createStore<Set<string>>(new Set())
  .on(registerOverlay, (set, id) => new Set([...set, id]))
  .on(unregisterOverlay, (set, id) => {
    const next = new Set(set)
    next.delete(id)
    return next
  })
  .reset(globalReset)

/** Whether any overlay is currently active (blocks hotkeys) */
export const $hasActiveOverlay = $activeOverlays.map(set => set.size > 0)
