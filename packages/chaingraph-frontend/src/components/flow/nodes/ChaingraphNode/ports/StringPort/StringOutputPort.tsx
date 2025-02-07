import type { StringPortConfig } from '@chaingraph/types'
import { cn } from '@chaingraph/frontend/lib/utils'
import { Handle, Position } from '@xyflow/react'

interface Props {
  config: StringPortConfig
}

export function StringOutputPort(props: Props) {
  const { config } = props
  return (
    <div
      key={config.id}
      className="relative flex items-center justify-end gap-2 group/port"
    >
      <span className="text-xs truncate text-foreground">
        {config.title || config.key}
      </span>
      <Handle
        id={config.id}
        type="source"
        position={Position.Right}
        className={cn(
          'w-3 h-3 rounded-full -mr-4',
          'border-2 border-background dark:border-[#1E1E1E]',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          'bg-flow-data',
        )}
      />
    </div>
  )
}
