import type { ExtractValue, IPort, StringPortConfig } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils.ts'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort.ts'
import { Input } from '@badaitech/chaingraph-frontend/components/ui/input'
import { Textarea } from '@badaitech/chaingraph-frontend/components/ui/textarea'
import { type ChangeEvent, type PropsWithChildren, useMemo } from 'react'
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
  const connectedEdges = useEdgesForPort(port.id)

  const handleChange = <Element extends HTMLInputElement | HTMLTextAreaElement>(e: ChangeEvent<Element>) => {
    if (!e.nativeEvent.isTrusted) {
      return
    }

    const value = e.target.value
    onChange({ value })
  }

  const needRenderEditor = useMemo(() => {
    return !ui?.hideEditor && connectedEdges.length === 0
  }, [ui, connectedEdges])

  if (ui?.hidePort)
    return null

  const title = config.title || config.key

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {config.direction === 'output' && <PortTitle>{title}</PortTitle>}

      <PortHandle port={port} />

      {config.direction === 'input' && (
        <div className="flex flex-col">
          <PortTitle>{title}</PortTitle>

          {!ui?.isTextArea && needRenderEditor && (
            <Input
              value={value}
              onChange={handleChange}
              className={cn(
                'resize-none shadow-none text-xs p-1',
                'w-full',
                errorMessage && 'border-red-500',
              )}
              placeholder={port.getConfig().title ?? 'Text'}
              type={ui?.isPassword ? 'password' : undefined}
              data-1p-ignore
              disabled={ui?.disabled ?? false}
            />
          )}
          {ui?.isTextArea && needRenderEditor && (
            <Textarea
              value={value}
              onChange={handleChange}
              className="shadow-none text-xs p-1 resize"
              placeholder="String"
            />
          )}
        </div>
      )}

    </div>
  )
}
