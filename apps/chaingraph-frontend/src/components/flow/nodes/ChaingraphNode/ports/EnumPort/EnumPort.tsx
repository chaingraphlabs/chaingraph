/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { memo, useCallback, useMemo } from 'react'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useExecutionID, usePortConfigWithExecution, usePortUIWithExecution, usePortValueWithExecution } from '@/store/execution'
import { useFocusTracking } from '@/store/focused-editors/hooks/useFocusTracking'
import { usePortEdges } from '@/store/nodes/computed'
import { requestUpdatePortUI, requestUpdatePortValue } from '@/store/ports'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface EnumPortProps {
  nodeId: string
  portId: string
}

function EnumPortInner(props: EnumPortProps) {
  const executionID = useExecutionID()

  const { nodeId, portId } = props

  // Granular subscriptions - only re-renders when THIS port's data changes
  const config = usePortConfigWithExecution(nodeId, portId)
  const ui = usePortUIWithExecution(nodeId, portId)
  const value = usePortValueWithExecution(nodeId, portId) as string | undefined

  // Track focus/blur for global copy-paste functionality
  const { handleFocus: trackFocus, handleBlur: trackBlur } = useFocusTracking(nodeId, portId)

  // Granular edge subscription - only re-renders when THIS port's edges change
  const connectedEdges = usePortEdges(nodeId, portId)

  const needRenderEditor = useMemo(() => {
    if (!config)
      return false
    return !isHideEditor(config as any, connectedEdges)
  }, [config, connectedEdges])

  // Choose a title from config.title or config.key.
  const title = config?.title || config?.key || portId

  // The configuration should include an "options" array.
  const options = (config as any)?.options || []

  // Memoize value change handler
  const handleValueChange = useCallback((value: string) => {
    requestUpdatePortValue({
      nodeId,
      portId,
      value,
    })
  }, [nodeId, portId])

  // Cast UI for type-safe property access
  const enumUI = ui as { hidden?: boolean, hideEditor?: boolean, disabled?: boolean }

  // If the port should be hidden, don't render it.
  if (enumUI.hidden)
    return null

  // Early return if config not loaded yet
  if (!config)
    return null

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {(config.direction === 'input' || config.direction === 'passthrough')
        && <PortHandle nodeId={nodeId} portId={portId} forceDirection="input" />}

      <div className={cn(
        'flex flex-col w-full',
        config.direction === 'output' ? 'items-end' : 'items-start',
        'truncate',
      )}
      >
        <PortTitle
          className={cn(
            'cursor-pointer',
            // if port required and the value is empty, add a red underline
            config.required
            && !value
            && (config.direction === 'input' || config.direction === 'passthrough')
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId,
              portId,
              ui: {
                hideEditor: enumUI.hideEditor === undefined ? true : !enumUI.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>
        {needRenderEditor && (
          <Select
            value={value}
            onValueChange={handleValueChange}
            disabled={executionID ? true : enumUI.disabled ?? false}
          >
            <SelectTrigger
              className={cn(
                'w-full text-xs p-1 h-8',
                // errorMessage && 'border-red-500',
                'nodrag',
              )}
              onFocus={trackFocus}
              onBlur={trackBlur}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any) => (
                <SelectItem
                  key={option.id}
                  value={option.id!}
                >
                  {option.title || option.name || option.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {(config.direction === 'output' || config.direction === 'passthrough')
        && (
          <PortHandle
            nodeId={nodeId}
            portId={portId}
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
 * Memoized EnumPort - only re-renders when port value, UI config, or context changes
 */
export const EnumPort = memo(EnumPortInner)
