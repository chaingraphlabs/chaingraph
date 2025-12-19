/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { memo } from 'react'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'
import { usePortConfig, usePortUI } from '@/store/ports-v2'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface AnyPortProps {
  nodeId: string
  portId: string
}

function AnyPortComponent(props: AnyPortProps) {
  const { nodeId, portId } = props

  // Granular subscriptions
  const config = usePortConfig(nodeId, portId)
  const ui = usePortUI(nodeId, portId)

  // Early return if config not loaded yet
  if (!config) return null

  const title = config.title || config.key

  // Check if there's an underlying type (stored in config)
  const underlyingType = (config as any).underlyingType

  // If there's an underlying type that's not 'any', render that port component
  if (underlyingType && underlyingType.type !== 'any') {
    return (
      <PortComponent nodeId={nodeId} portId={portId} />
    )
  }

  if (ui?.hidden)
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
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle
          className={cn(
            'cursor-pointer',
            // if port required and the value is empty, add a red underline
            config.required
            && (config.direction === 'input' || config.direction === 'passthrough')
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId,
              portId,
              ui: {
                hideEditor: ui?.hideEditor === undefined ? true : !ui.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>

      </div>

      {
        (config.direction === 'output' || config.direction === 'passthrough')
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
        )
      }
    </div>
  )
}

// Export a memoized version of the component to prevent unnecessary re-renders
export const AnyPort = memo(AnyPortComponent)
