/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExtractValue, INode, IPort, NumberPortConfig } from '@badaitech/chaingraph-types'
import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
import { memo, useCallback, useMemo } from 'react'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { NumberInput } from '@/components/ui/number-input'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { useFocusTracking } from '@/store/focused-editors/hooks/useFocusTracking'
import { requestUpdatePortUI } from '@/store/ports'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface NumberPortProps {
  node: INode
  port: IPort<NumberPortConfig>
  context: PortContextValue
}

function NumberPortInner(props: NumberPortProps) {
  const { node, port, context } = props
  const { updatePortValue, getEdgesForPort } = context

  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key
  const executionID = useExecutionID()

  // Track focus/blur for global copy-paste functionality
  const { handleFocus: trackFocus, handleBlur: trackBlur } = useFocusTracking(node.id, port.id)

  // Memoize edges for this port
  const connectedEdges = useMemo(() => {
    return getEdgesForPort(port.id)
  }, [getEdgesForPort, port.id])

  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges)
  }, [config, connectedEdges])

  const handleChange = useCallback((value: ExtractValue<NumberPortConfig> | undefined) => {
    updatePortValue({
      nodeId: node.id,
      portId: port.id,
      value,
    })
  }, [node.id, port.id, updatePortValue])

  // Memoize slider value change handler
  const handleSliderChange = useCallback((values: number[]) => {
    handleChange(values[0])
  }, [handleChange])

  // Memoize number input value change handler
  const handleNumberInputChange = useCallback(({ floatValue }, sourceInfo: any) => {
    if (!sourceInfo.event?.isTrusted) {
      return
    }

    const val = floatValue ?? Number.NaN
    handleChange(Number.isNaN(val) ? undefined : val)
  }, [handleChange])

  if (ui?.hidden)
    return null

  return (
    <div
      key={config.id}
      className={cn(
        'w-full',
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
        // className,
      )}
    >
      {(config.direction === 'input' || config.direction === 'passthrough')
        && <PortHandle port={port} forceDirection="input" />}

      <div className={cn(
        'w-full',
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle
          className={cn(
            'cursor-pointer',
            'truncate',
            // if port required and the value is empty, add a red underline
            config.required
            && (port.getValue() === undefined || port.getValue() === null || !port.validate())
            && (config.direction === 'input' || config.direction === 'passthrough')
            && (config.connections?.length || 0) === 0
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId: node.id,
              portId: port.id,
              ui: {
                hideEditor: ui?.hideEditor === undefined ? !needRenderEditor : !ui.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>

        {needRenderEditor && (
          <div className={cn(
            'w-full',
          )}
          >
            <NumberInput
              disabled={executionID ? true : ui?.disabled ?? false}
              className={cn(
                // errorMessage && 'border-red-500',
                'w-full',
                'nodrag nopan',
              )}
              value={port.getValue()}
              min={config.min}
              max={config.max}
              step={config.step}
              onValueChange={handleNumberInputChange}
              onFocus={trackFocus}
              onBlur={trackBlur}
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
                  disabled={executionID ? true : ui?.disabled ?? false}
                  value={[port.getValue() ?? 0]}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  onValueChange={handleSliderChange}
                />
              </>
            )}
          </div>
        )}
      </div>

      {(config.direction === 'output' || config.direction === 'passthrough')
        && (
          <PortHandle
            port={port}
            forceDirection="output"
            className={cn(
              config.parentId !== undefined
              && config.direction === 'passthrough'
              && '-right-8',
            )}
          />
        )}
    </div>
  )
}

/**
 * Memoized NumberPort - only re-renders when port value, UI config, or context changes
 */
export const NumberPort = memo(NumberPortInner, (prev, next) => {
  return prev.port.getValue() === next.port.getValue()
    && prev.context === next.context
    && prev.port.getConfig().ui?.hidden === next.port.getConfig().ui?.hidden
    && prev.port.getConfig().ui?.hideEditor === next.port.getConfig().ui?.hideEditor
    && prev.port.getConfig().ui?.disabled === next.port.getConfig().ui?.disabled
    && prev.node.id === next.node.id
    && prev.port.id === next.port.id
})
