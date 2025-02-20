/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { BooleanPortConfig, IPort } from '@badaitech/chaingraph-types'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface BooleanPortProps {
  className?: string
  portClassName?: string
  port: IPort<BooleanPortConfig>
  value: boolean
  onChange: (param: { value: boolean }) => void
  onDelete?: (port: IPort<BooleanPortConfig>) => void
  hideEditor?: boolean
  errorMessage?: string
}

export function BooleanPort(props: BooleanPortProps) {
  const { className, port, onChange, onDelete, value, hideEditor } = props
  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key

  const connectedEdges = useEdgesForPort(port.id)
  const needRenderEditor = useMemo(() => {
    return !ui?.hideEditor && connectedEdges.length === 0 && !hideEditor
  }, [ui, connectedEdges, hideEditor])

  if (ui?.hidePort)
    return null

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
