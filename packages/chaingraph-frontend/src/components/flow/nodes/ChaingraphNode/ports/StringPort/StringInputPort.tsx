import type { StringPortConfig } from '@chaingraph/types'
import type { PropsWithChildren } from 'react'
import { cn } from '@chaingraph/frontend/lib/utils'
import { Handle, Position } from '@xyflow/react'

interface StringInputPortProps {
  config: StringPortConfig
}

export function StringInputPort(props: PropsWithChildren<StringInputPortProps>) {
  const { config } = props
  return (
    <div
      key={config.id}
      className="relative flex items-center gap-2 group/port"
    >
      <Handle
        id={config.id}
        type="target"
        position={Position.Left}
        className={cn(
          'w-3 h-3 rounded-full -ml-4',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          'bg-flow-data',
        )}
      />
      <span className="text-xs truncate text-foreground">
        {config.title || config.key}
      </span>
    </div>
  )
}
