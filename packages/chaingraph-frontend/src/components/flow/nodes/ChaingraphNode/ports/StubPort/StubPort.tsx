import type { IPortConfig } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils.ts'
import { Handle, Position } from '@xyflow/react'
import React from 'react'

export function StubPort(props: { config: IPortConfig }) {
  const { config } = props
  const bgColor = config.ui?.bgColor || null

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex items-center gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {config.direction === 'output' && (
        <span className="text-xs truncate text-foreground">
          {config.title || config.key}
        </span>
      )}

      <Handle
        id={config.id}
        type={config.direction === 'input' ? 'target' : 'source'}
        position={config.direction === 'input' ? Position.Left : Position.Right}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className={cn(
          'w-2 h-2 rounded-full',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          config.direction === 'input' ? '-ml-4' : '-mr-4',
          !bgColor && 'bg-flow-data',
        )}
      />

      {config.direction === 'input' && (
        <span className="text-xs truncate text-foreground">
          {config.title || config.key}
        </span>
      )}
    </div>
  )
}
