/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes/categories/icons'
import type { CategoryStyle, INode } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes/categories/icons'
import { Cross1Icon } from '@radix-ui/react-icons'
import { useCallback } from 'react'

interface NodeHeaderProps {
  // title: string
  node: INode
  icon: CategoryIconName
  style: CategoryStyle['light'] | CategoryStyle['dark']
  onDelete?: () => void

  debugMode: boolean
  isBreakpointSet: boolean
  onBreakpointToggle: () => void
}

export function NodeHeader({
  node,
  icon,
  style,
  onDelete,
  debugMode,
  isBreakpointSet,
  onBreakpointToggle,
}: NodeHeaderProps) {
  const Icon = getCategoryIcon(icon)

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }, [onDelete])

  return (
    <div
      className={cn(
        'px-3 py-2 flex items-center justify-between',
        'border-b rounded-t-lg',
      )}
      style={{
        background: style.primary,
        borderBottom: `1px solid ${style.secondary}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{
            background: `${style.text}20`,
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: style.text }}
          />
        </div>

        <h3
          className="font-medium text-sm truncate"
          style={{ color: style.text }}
        >
          {node.metadata.title}
        </h3>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">

        <button
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          style={{ color: style.text }}
          onClick={handleDelete}
          title="Delete"
          type="button"
        >
          <Cross1Icon className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
