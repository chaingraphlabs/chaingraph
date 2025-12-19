/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { memo, useCallback, useMemo } from 'react'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { usePortEdges } from '@/store/nodes/computed'
import { useExecutionID } from '@/store/execution'
import { useFocusTracking } from '@/store/focused-editors/hooks/useFocusTracking'
import { requestUpdatePortUI, requestUpdatePortValue } from '@/store/ports'
import { usePortConfig, usePortUI, usePortValue } from '@/store/ports-v2'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface BooleanPortProps {
  nodeId: string
  portId: string
}

function BooleanPortComponent(props: BooleanPortProps) {
  const executionID = useExecutionID()

  const { nodeId, portId } = props

  // Granular subscriptions - only re-renders when THIS port's data changes
  const config = usePortConfig(nodeId, portId)
  const ui = usePortUI(nodeId, portId)
  const value = usePortValue(nodeId, portId) as boolean | undefined

  const title = config?.title || config?.key || portId

  // Track focus/blur for global copy-paste functionality
  const { handleFocus: trackFocus, handleBlur: trackBlur } = useFocusTracking(nodeId, portId)

  // Granular edge subscription - only re-renders when THIS port's edges change
  const connectedEdges = usePortEdges(nodeId, portId)

  const needRenderEditor = useMemo(() => {
    if (!config) return false
    return !isHideEditor(config as any, connectedEdges)
  }, [config, connectedEdges])

  const handleChange = useCallback((value: boolean | undefined) => {
    requestUpdatePortValue({
      nodeId,
      portId,
      value,
    })
  }, [nodeId, portId])

  if (ui?.hidden)
    return null

  // Early return if config not loaded yet
  if (!config) return null

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
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
        'truncate',
      )}
      >
        <PortTitle
          className="cursor-pointer"
          onClick={() => {
            requestUpdatePortUI({
              nodeId,
              portId,
              ui: {
                hideEditor: (ui as { hideEditor?: boolean })?.hideEditor === undefined ? false : !(ui as { hideEditor?: boolean }).hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>

        {needRenderEditor && (
          <Switch
            disabled={executionID ? true : (ui as { disabled?: boolean })?.disabled ?? false}
            checked={value ?? false}
            onCheckedChange={checked => handleChange(checked)}
            onFocus={trackFocus}
            onBlur={trackBlur}
            className={cn('nodrag')}
          />
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

// Export a memoized version of the component to prevent unnecessary re-renders
export const BooleanPort = memo(BooleanPortComponent)
