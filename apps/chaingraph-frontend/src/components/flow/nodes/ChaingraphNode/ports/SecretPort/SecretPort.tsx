/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, SecretPortConfig } from '@badaitech/chaingraph-types'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import { usePortConfigWithExecution, usePortUIWithExecution } from '@/store/execution/hooks/usePortValueWithExecution'
import { usePortConfig, usePortUI } from '@/store/ports-v2'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface SecretPortProps {
  readonly nodeId: string
  readonly portId: string
}

function SecretPortComponent(props: SecretPortProps) {
  const { nodeId, portId } = props

  // Granular subscriptions - only re-renders when THIS port's data changes
  const config = usePortConfigWithExecution(nodeId, portId)
  const ui = usePortUIWithExecution(nodeId, portId)

  const title = config?.title || config?.key || portId

  if (ui?.hidden)
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
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
        'truncate',
      )}
      >
        <PortTitle>
          {title}
        </PortTitle>
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
export const SecretPort = memo(SecretPortComponent)
