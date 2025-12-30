/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useCallback, useEffect, useState } from 'react'
import { $isBoxSelectionMode } from '@/store/hotkeys'

interface CursorPosition {
  x: number
  y: number
}

/**
 * Renders dashed crosshair lines from cursor position to all 4 edges
 * when box selection mode is active (B key pressed)
 */
export function SelectionCrosshair() {
  const isBoxSelectionMode = useUnit($isBoxSelectionMode)
  const [cursorPos, setCursorPos] = useState<CursorPosition | null>(null)

  // Track cursor position
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    if (!isBoxSelectionMode) {
      setCursorPos(null)
      return
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isBoxSelectionMode, handleMouseMove])

  if (!isBoxSelectionMode || !cursorPos) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{ cursor: 'crosshair' }}
    >
      {/* Horizontal line - left side */}
      <div
        className="absolute h-px bg-transparent"
        style={{
          left: 0,
          top: cursorPos.y,
          width: cursorPos.x,
          borderTop: '1px dashed rgba(99, 102, 241, 0.6)', // indigo-500 with opacity
        }}
      />

      {/* Horizontal line - right side */}
      <div
        className="absolute h-px bg-transparent"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          right: 0,
          borderTop: '1px dashed rgba(99, 102, 241, 0.6)',
        }}
      />

      {/* Vertical line - top side */}
      <div
        className="absolute w-px bg-transparent"
        style={{
          left: cursorPos.x,
          top: 0,
          height: cursorPos.y,
          borderLeft: '1px dashed rgba(99, 102, 241, 0.6)',
        }}
      />

      {/* Vertical line - bottom side */}
      <div
        className="absolute w-px bg-transparent"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          bottom: 0,
          borderLeft: '1px dashed rgba(99, 102, 241, 0.6)',
        }}
      />

      {/* Center dot */}
      <div
        className="absolute w-2 h-2 rounded-full bg-indigo-500"
        style={{
          left: cursorPos.x - 4,
          top: cursorPos.y - 4,
        }}
      />
    </div>
  )
}
