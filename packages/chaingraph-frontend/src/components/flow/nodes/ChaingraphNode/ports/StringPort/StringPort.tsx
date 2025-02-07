import type { ExtractValue, IPort, StringPortConfig } from '@badaitech/chaingraph-types'
import type { ChangeEvent, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils.ts'
import { Input } from '@badaitech/chaingraph-frontend/components/ui/input'
import { Textarea } from '@badaitech/chaingraph-frontend/components/ui/textarea'
import { Handle, Position } from '@xyflow/react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

interface ChangeParam {
  value: ExtractValue<StringPortConfig>
}

export interface StringPortProps {
  value: ExtractValue<StringPortConfig>
  onChange: (param: ChangeParam) => void
  port: IPort<StringPortConfig>
  errorMessage?: string
}

export function StringPort(props: PropsWithChildren<StringPortProps>) {
  const { port, onChange, value, errorMessage } = props
  const config = port.getConfig()
  const { ui } = config

  const handleChange = <Element extends HTMLInputElement | HTMLTextAreaElement>(e: ChangeEvent<Element>) => {
    const value = e.target.value
    onChange({ value })
  }

  if (ui?.hidePort)
    return null

  const title = config.title || config.key

  return (
    <div
      key={config.id}
      className="relative flex gap-2 group/port justify-start"
    >
      {config.direction === 'output' && <PortTitle>{title}</PortTitle>}

      <PortHandle port={port} />

      {config.direction === 'input' && (
        <div className="flex flex-col">
          <PortTitle>{title}</PortTitle>

          {!ui?.isTextArea && !ui?.hideEditor && (
            <Input value={value} onChange={handleChange} className={cn('resize-none shadow-none text-xs p-1', errorMessage && 'border-red-500')} placeholder="String" type={ui?.isPassword ? 'password' : undefined} />
          )}
          {ui?.isTextArea && !ui?.hideEditor && (
            <Textarea value={value} onChange={handleChange} className="resize-none shadow-none text-xs p-1" placeholder="String" />
          )}
        </div>
      )}

    </div>
  )
}
