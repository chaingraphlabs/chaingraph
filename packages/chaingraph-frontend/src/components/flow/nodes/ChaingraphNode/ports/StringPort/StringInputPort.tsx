import type { StringPortConfig } from '@badaitech/chaingraph-types'
import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils.ts'
import { Handle, Position } from '@xyflow/react'

interface StringInputPortProps {
  config: StringPortConfig
}

export function StringInputPort(props: PropsWithChildren<StringInputPortProps>) {
  const { config } = props
  const bgColor = config.ui?.bgColor || null

  return (
    <div
      key={config.id}
      className="relative flex items-center gap-2 group/port"
    >
      <Handle
        id={config.id}
        type="target"
        position={Position.Left}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className={cn(
          'w-2 h-2 rounded-full -ml-4',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          !bgColor && 'bg-flow-data',
        )}
      />
      <span className="text-xs truncate text-foreground">
        {config.title || config.key}
      </span>
    </div>
  )
}
