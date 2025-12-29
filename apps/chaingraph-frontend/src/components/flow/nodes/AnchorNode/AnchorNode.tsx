/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeProps } from '@xyflow/react'
import type { AnchorNode } from './types'
import { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { removeAnchorNode } from '@/store/edges/anchor-nodes'

/**
 * AnchorNode - Edge waypoint as a first-class XYFlow node
 *
 * Benefits of using XYFlow nodes for anchors:
 * - Native selection (shift+drag box, shift+click)
 * - Native multi-selection drag
 * - Native parenting to groups
 * - No custom coordinate transformation
 * - Participates in XYFlow's undo/redo
 *
 * Visual appearance matches PortHandle (manual port handles):
 * - Circle shape, 8x8 px
 * - Edge color fill (always colored)
 * - Background color border
 * - Always visible
 */
function AnchorNodeComponent({ data, selected, id }: NodeProps<AnchorNode>) {
  // Handle 'currentColor' fallback - use a default blue if stroke was currentColor
  const rawColor = data.color
  const color = (!rawColor || rawColor === 'currentColor') ? '#3b82f6' : rawColor

  // Double-click to delete anchor
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    removeAnchorNode({ anchorNodeId: id, edgeId: data.edgeId })
  }, [id, data.edgeId])

  return (
    <div
      className={cn(
        'w-4 h-4 rounded-full',
        'border-2 border-background',
        'cursor-grab active:cursor-grabbing',
        'transition-shadow duration-200',
        'hover:scale-110',
        'z-50',
      )}
      style={{
        backgroundColor: color,
        boxShadow: selected ? `0 0 0 2px ${color}50` : undefined,
      }}
      onDoubleClick={handleDoubleClick}
    />
  )
}

// Custom memo equality - ensure re-render when selection, color, or version changes
export default memo(AnchorNodeComponent, (prev, next) => {
  return prev.id === next.id
    && prev.selected === next.selected
    && prev.data.color === next.data.color
    && prev.data.edgeId === next.data.edgeId
    && prev.data.version === next.data.version
})
