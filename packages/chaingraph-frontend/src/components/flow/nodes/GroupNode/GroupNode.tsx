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
          // Choose one of these background variations:

          // Variation 1: Subtle blue
          // 'bg-blue-50/80 dark:bg-blue-950/50',

          // Variation 2: Neutral gray
          // 'bg-gray-50/90 dark:bg-gray-900/50',

          // Variation 3: Gentle purple
          'bg-purple-200/60 dark:bg-purple-950/50',

          // Variation 4: Soft green
          // 'bg-green-50/80 dark:bg-green-950/50',

          'rounded-xl border-2',
          'transition-all duration-200',
          selected
            ? 'border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
            : 'border-border/40 hover:border-border/60',
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
          className="absolute -bottom-1 -right-1 w-3 h-3 border-0 bg-transparent"
        >
          <div className={cn(
            'w-2 h-2 rounded-sm rotate-45',
            'bg-border/60 hover:bg-border',
            'transition-colors duration-200',
            selected && 'bg-primary/60 hover:bg-primary',
          )}
          />
        </NodeResizeControl>
      </div>
    </>
  )
}

export default memo(GroupNodeComponent)
