/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export {
  $activeOverlays,
  $canvasFlowPosition,
  $grabModeState,
  $hasActiveOverlay,
  $isBoxSelectionMode,
  $isDeleteDialogOpen,
  $isGrabMode,
  $isOverCanvas,
  cancelGrabMode,
  confirmDelete,
  confirmGrabMode,
  // Box selection mode
  enterBoxSelectionMode,
  // Grab mode
  enterGrabMode,
  exitBoxSelectionMode,
  hideDeleteConfirmation,
  // Domain
  hotkeysDomain,
  // Overlay tracking
  registerOverlay,
  // Canvas hover
  setIsOverCanvas,
  // Delete confirmation
  showDeleteConfirmation,
  unregisterOverlay,
  // Canvas mouse position
  updateCanvasFlowPosition,
} from './stores'

export type { FlowPosition, GrabModeState, GrabPosition } from './stores'

/**
 * Check if an element is an input-like element that should capture keyboard input.
 * This includes:
 * - Standard input/textarea elements
 * - Contenteditable elements
 * - Elements with cmdk-input attribute (shadcn/ui Command component)
 * - Elements with role="combobox" or role="textbox"
 */
function isEditableElement(element: Element | null): boolean {
  if (!element)
    return false

  // Standard form inputs
  if (element instanceof HTMLInputElement)
    return true
  if (element instanceof HTMLTextAreaElement)
    return true

  // Contenteditable
  if (element.getAttribute('contenteditable') === 'true')
    return true

  // ARIA roles for editable content
  const role = element.getAttribute('role')
  if (role === 'textbox' || role === 'combobox' || role === 'searchbox')
    return true

  // cmdk library specific (used by shadcn/ui Command component)
  if (element.hasAttribute('cmdk-input'))
    return true

  return false
}

/**
 * Check if an element or any of its ancestors is an input-like element.
 * Walks up the DOM tree to catch cases where the event target is inside an input wrapper.
 */
function hasEditableAncestor(element: Element | null, maxDepth = 5): boolean {
  let current = element
  let depth = 0

  while (current && depth < maxDepth) {
    if (isEditableElement(current))
      return true
    current = current.parentElement
    depth++
  }

  return false
}

/**
 * Check if a keyboard event should be ignored because it occurred in an input context.
 *
 * This is the main guard function for all hotkey handlers. It checks:
 * 1. The event target (where the key was actually pressed)
 * 2. The currently focused element (document.activeElement)
 * 3. Ancestor elements (in case target is inside an input wrapper)
 *
 * @param event - The keyboard event to check (optional, falls back to activeElement check)
 * @returns true if hotkeys should be disabled, false if they should be processed
 *
 * @example
 * ```typescript
 * const handleKeyDown = (e: KeyboardEvent) => {
 *   if (shouldIgnoreHotkey(e)) return
 *   // Process hotkey...
 * }
 * ```
 */
export function shouldIgnoreHotkey(event?: KeyboardEvent): boolean {
  // Check event target first (most reliable for keyboard events)
  if (event?.target instanceof Element) {
    if (isEditableElement(event.target))
      return true
    if (hasEditableAncestor(event.target))
      return true
  }

  // Also check activeElement as fallback
  const activeElement = document.activeElement
  if (isEditableElement(activeElement))
    return true

  return false
}

/**
 * @deprecated Use shouldIgnoreHotkey(event) instead for more robust detection
 */
export function isInputFocused(): boolean {
  return shouldIgnoreHotkey()
}
