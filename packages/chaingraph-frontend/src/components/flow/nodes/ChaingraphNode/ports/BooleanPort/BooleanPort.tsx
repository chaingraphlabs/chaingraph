import type { BooleanPortConfig, IPort } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils.ts'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort.ts'
import { Switch } from '@badaitech/chaingraph-frontend/components/ui/switch'
import { useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface BooleanPortProps {
  port: IPort<BooleanPortConfig>
  value: boolean
  onChange: (param: { value: boolean }) => void
  errorMessage?: string
}

export function BooleanPort(props: BooleanPortProps) {
  const { port, onChange, value } = props
  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key

  const connectedEdges = useEdgesForPort(port.id)
  const needRenderEditor = useMemo(() => {
    return !ui?.hideEditor && connectedEdges.length === 0
  }, [ui, connectedEdges])

  if (ui?.hidePort)
    return null

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex items-center gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {config.direction === 'output' && (
        <PortTitle>{title}</PortTitle>
      )}
      <PortHandle port={port} />

      {config.direction === 'input' && (
        <div className="flex flex-col">
          <PortTitle>{title}</PortTitle>

          {needRenderEditor && (
            <Switch
              disabled={ui?.disabled}
              checked={value}
              onCheckedChange={checked => onChange({ value: checked })}
            />
          )}

        </div>
      )}
    </div>
  )
}
