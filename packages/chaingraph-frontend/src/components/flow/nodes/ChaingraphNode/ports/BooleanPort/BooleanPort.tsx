import type { BooleanPortConfig, IPort } from '@badaitech/chaingraph-types'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort'
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
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {config.direction === 'input' && <PortHandle port={port} />}

      <div className={cn(
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle>{title}</PortTitle>

        {needRenderEditor && (
          <Switch
            disabled={ui?.disabled}
            checked={value}
            onCheckedChange={checked => onChange({ value: checked })}
          />
        )}
      </div>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}
