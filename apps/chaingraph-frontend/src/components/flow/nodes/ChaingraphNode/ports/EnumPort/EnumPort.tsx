/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
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
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface EnumPortProps {
  className?: string
  portClassName?: string
  port: IPort<EnumPortConfig>
  value: EnumPortValue
  onChange: (param: { value: EnumPortValue }) => void
  onDelete?: (port: IPort<EnumPortConfig>) => void
  hideEditor?: boolean
  errorMessage?: string
}

export function EnumPort(props: EnumPortProps) {
  const { className, port, onChange, hideEditor, value, errorMessage, onDelete } = props
  const config = port.getConfig()
  const ui = config.ui
  const connectedEdges = useEdgesForPort(port.id)

  const needRenderEditor = useMemo(() => {
    return isHideEditor(config, connectedEdges) && !hideEditor
  }, [config, connectedEdges, hideEditor])

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
        className,
      )}
    >
      {onDelete && (
        <X
          onClick={() => onDelete(port)}
          className={cn('absolute top-1 size-3 cursor-pointer hover:brightness-125', config.direction === 'output' ? 'left-1' : 'right-1')}
        />
      )}
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
