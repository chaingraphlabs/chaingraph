import type { EnumPortConfig, EnumPortValue, IPort } from '@badaitech/chaingraph-types'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort'
import { useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface EnumPortProps {
  port: IPort<EnumPortConfig>
  value: EnumPortValue
  onChange: (param: { value: EnumPortValue }) => void
  errorMessage?: string
}

export function EnumPort(props: EnumPortProps) {
  const { port, onChange, value, errorMessage } = props
  const config = port.getConfig()
  const ui = config.ui
  const connectedEdges = useEdgesForPort(port.id)

  const needRenderEditor = useMemo(() => {
    return isHideEditor(config, connectedEdges)
  }, [config, connectedEdges])

  // If the port should be hidden, don't render it.
  if (ui?.hidePort)
    return null

  // Choose a title from config.title or config.key.
  const title = config.title || config.key

  // The configuration should include an "options" array.
  const options = config.options || []

  const handleValueChange = (newValue: string) => {
    onChange({ value: newValue })
  }

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
        'flex flex-col w-full',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle>
          {title}
        </PortTitle>
        {needRenderEditor && (
          <Select
            value={value}
            onValueChange={handleValueChange}
            disabled={ui?.disabled}
          >
            <SelectTrigger
              className={cn(
                'w-full text-xs p-1 h-8',
                errorMessage && 'border-red-500',
              )}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem
                  key={option.id}
                  value={option.id!}
                >
                  {option.name || option.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}
