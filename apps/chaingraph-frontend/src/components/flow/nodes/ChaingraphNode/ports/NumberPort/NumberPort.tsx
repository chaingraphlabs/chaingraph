/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { ExtractValue, INode, IPort, NumberPortConfig } from '@badaitech/chaingraph-types'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { NumberInput } from '@/components/ui/number-input.tsx'
import { Slider } from '@/components/ui/slider.tsx'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { usePortContext } from '../context/PortContext'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface NumberPortProps {
  node: INode
  port: IPort<NumberPortConfig>
}

export function NumberPort(props: NumberPortProps) {
  const { node, port } = props
  const { updatePortValue, getEdgesForPort } = usePortContext()

  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key

  const connectedEdges = getEdgesForPort(port.id)

  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges)
  }, [config, connectedEdges])

  const handleChange = (value: ExtractValue<NumberPortConfig> | undefined) => {
    updatePortValue({
      nodeId: node.id,
      portId: port.id,
      value,
    })
  }

  if (ui?.hidden)
    return null

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
        // className,
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
          <>
            <NumberInput
              disabled={ui?.disabled}
              className={cn(
                // errorMessage && 'border-red-500',
                'w-full',
                'nodrag nopan',
              )}
              value={port.getValue()}
              min={config.min}
              max={config.max}
              step={config.step}
              onValueChange={({ floatValue }, sourceInfo) => {
                if (!sourceInfo.event?.isTrusted) {
                  return
                }

                const val = floatValue ?? Number.NaN
                handleChange(Number.isNaN(val) ? undefined : val)
              }}
            />

            {config.ui?.isSlider && (
              <>
                {(config.ui?.leftSliderLabel || config.ui?.rightSliderLabel) && (
                  <div className="flex justify-between w-full text-xs text-gray-500">
                    <span>{config.ui.leftSliderLabel}</span>
                    <span>{config.ui.rightSliderLabel}</span>
                  </div>
                )}
                <Slider
                  className={cn('mt-2 w-full')}
                  disabled={ui?.disabled}
                  value={[port.getValue() ?? 0]}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  onValueChange={(values) => {
                    handleChange(values[0])
                  }}
                />
              </>
            )}
          </>
        )}
      </div>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}
