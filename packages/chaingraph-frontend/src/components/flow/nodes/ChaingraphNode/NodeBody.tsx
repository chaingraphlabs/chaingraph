import type { IPort } from '@chaingraph/types/port/base'
import { cn } from '@/lib/utils'
import { Handle, Position } from '@xyflow/react'

interface NodeBodyProps {
  inputs: IPort[]
  outputs: IPort[]
}

export function NodeBody({ inputs, outputs }: NodeBodyProps) {
  return (
    <div className="px-3 py-2 space-y-4">
      <div className="space-y-3">
        {/* Input Ports */}
        {inputs.map(port => (
          <div
            key={port.id}
            className="relative flex items-center gap-2 group/port"
          >
            <Handle
              id={port.id}
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
              {port.getConfig().title || port.getConfig().key}
            </span>
          </div>
        ))}

        {/* Output Ports */}
        {outputs.map(port => (
          <div
            key={port.id}
            className="relative flex items-center justify-end gap-2 group/port"
          >
            <span className="text-xs truncate text-foreground">
              {port.getConfig().title || port.getConfig().key}
            </span>
            <Handle
              id={port.id}
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
        ))}
      </div>
    </div>
  )
}
