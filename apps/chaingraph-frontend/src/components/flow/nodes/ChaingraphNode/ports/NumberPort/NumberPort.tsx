/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { ExtractValue, IPort, NumberPortConfig } from '@badaitech/chaingraph-types'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { NumberInput } from '@/components/ui/number-input.tsx'
import { Slider } from '@/components/ui/slider.tsx'
import { cn } from '@/lib/utils'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

interface NumberOnChangeParam { value: ExtractValue<NumberPortConfig> | '' }

export interface NumberPortProps {
  className?: string
  portClassName?: string
  port: IPort<NumberPortConfig>
  value?: ExtractValue<NumberPortConfig>
  onChange?: (param: NumberOnChangeParam) => void
  onDelete?: (port: IPort<NumberPortConfig>) => void
  hideEditor?: boolean
  errorMessage?: string
}

export function NumberPort(props: NumberPortProps) {
  const { className, port, value, onDelete, onChange, errorMessage, hideEditor } = props
  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key

  const connectedEdges = useEdgesForPort(port.id)

  const needRenderEditor = useMemo(() => {
    return isHideEditor(config, connectedEdges) && !hideEditor
  }, [config, connectedEdges, hideEditor])

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
          <>
            <NumberInput
              disabled={ui?.disabled}
              className={cn(
                errorMessage && 'border-red-500',
                'nodrag nopan',
              )}
              value={value}
              min={config.min}
              max={config.max}
              step={config.step}
              onValueChange={({ floatValue }, sourceInfo) => {
                if (!sourceInfo.event?.isTrusted) {
                  return
                }

                const val = floatValue ?? Number.NaN
                onChange?.({ value: Number.isNaN(val) ? '' : val })
              }}
            />

            {config.ui?.isSlider && (
              <Slider
                className="mt-0.5"
                disabled={ui?.disabled}
                value={[value ?? 0]}
                min={config.min}
                max={config.max}
                step={config.step}
                onValueChange={(values) => {
                  onChange?.({ value: values[0] })
                }}
              />
            )}
          </>
        )}
      </div>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}
