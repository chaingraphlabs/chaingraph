import type { ExtractValue, IPort, StringPortConfig } from '@badaitech/chaingraph-types'
import type { ChangeEvent, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils.ts'
import { Input } from '@badaitech/chaingraph-frontend/components/ui/input'
import { Textarea } from '@badaitech/chaingraph-frontend/components/ui/textarea'
import { Handle, Position } from '@xyflow/react'

interface ChangeParam {
  value: ExtractValue<StringPortConfig>
}

export interface StringInputPortProps {
  value: ExtractValue<StringPortConfig>
  onChange: (param: ChangeParam) => void
  port: IPort<StringPortConfig>
  errorMessage?: string
}

export function StringInputPort(props: PropsWithChildren<StringInputPortProps>) {
  const { port, onChange, value, errorMessage } = props
  const config = port.getConfig()
  const bgColor = config.ui?.bgColor || null
  const { ui } = config

  const handleChange = <Element extends HTMLInputElement | HTMLTextAreaElement>(e: ChangeEvent<Element>) => {
    const value = e.target.value
    onChange({ value })
  }

  if (ui?.hidePort)
    return null

  return (
    <div
      key={config.id}
      className="relative flex gap-2 group/port justify-start"
    >
      <Handle
        id={config.id}
        type="target"
        position={Position.Left}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className={cn(
          'w-2 h-2 rounded-full -ml-4 top-2',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          !bgColor && 'bg-flow-data',
        )}
      />
      <div className="flex flex-col">
        <span className="text-xs truncate text-foreground font-medium">
          {config.title || config.key}
        </span>
        {!ui?.isTextArea && !ui?.hideEditor && (
          <Input value={value} onChange={handleChange} className={cn('resize-none mt-1 shadow-none text-xs p-1', errorMessage && 'border-red-500')} placeholder="String" type={ui?.isPassword ? 'password' : undefined} />
        )}
        {ui?.isTextArea && !ui?.hideEditor && (
          <Textarea value={value} onChange={handleChange} className="resize-none mt-1 shadow-none text-xs p-1" placeholder="String" />
        )}

      </div>
    </div>
  )
}
