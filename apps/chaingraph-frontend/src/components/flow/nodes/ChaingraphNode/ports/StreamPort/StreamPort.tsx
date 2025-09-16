/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, StreamPortConfig } from '@badaitech/chaingraph-types'
import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface StreamPortProps {
  node: INode
  port: IPort<StreamPortConfig>
  context: PortContextValue
}

function StreamPortComponent(props: StreamPortProps) {
  const { port, context } = props

  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key

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
        && <PortHandle port={port} forceDirection="input" />}

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

// Export a memoized version of the component to prevent unnecessary re-renders
export const StreamPort = memo(StreamPortComponent)
