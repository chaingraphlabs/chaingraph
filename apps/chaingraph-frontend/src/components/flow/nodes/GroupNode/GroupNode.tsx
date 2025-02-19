/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeProps } from '@xyflow/react'
import type { GroupNode } from './types'
import { cn } from '@/lib/utils'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { memo } from 'react'

function GroupNodeComponent({
  data,
  selected,
}: NodeProps<GroupNode>) {
  return (
    <>
      <div
        className={cn(
          'w-full h-full',
          'min-w-[100px] min-h-[100px]',
          // Choose one of these background variations:

          // Variation 1: Subtle blue
          // 'bg-blue-50/80 dark:bg-blue-950/50',

          // Variation 2: Neutral gray
          // 'bg-gray-50/90 dark:bg-gray-900/50',

          // Variation 3: Gentle purple
          'bg-purple-200/20 dark:bg-purple-950/30',

          // Variation 4: Soft green
          // 'bg-green-50/80 dark:bg-green-950/50',

          'rounded-xl border-2',
          'transition-all duration-200',
          selected
            ? 'border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
            : 'border-border/40 hover:border-border/60 shadow-[0_0_12px_rgba(0,0,0,0.1)]',
        )}
      >
        {/* Header */}
        <div className="absolute top-2 left-3 flex items-center gap-2">
          <DotsHorizontalIcon className="w-4 h-4 text-muted-foreground/60" />
          <span className="text-sm font-medium text-muted-foreground select-none">
            {data.node.metadata.title || 'Group'}
          </span>
        </div>

        {/* Resize handle */}
        <NodeResizeControl
          variant={ResizeControlVariant.Handle}
          position="bottom-right"
          className="absolute -bottom-1 -right-1 w-10 h-10 border-1 bg-transparent"
        />
      </div>
    </>
  )
}

export default memo(GroupNodeComponent)
