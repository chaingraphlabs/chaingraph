/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type {
  AnyPortConfig,
  INode,
  IPort,
} from '@badaitech/chaingraph-types'
import { PortHandle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortHandle'
import { cn } from '@/lib/utils'
import { memo } from 'react'
import { PortTitle } from '../ui/PortTitle'

export interface AnyPortProps {
  node: INode
  port: IPort<AnyPortConfig>
  context: PortContextValue
}

function AnyPortComponent(props: AnyPortProps) {
  const { port, node, context } = props

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
      {config.direction === 'input' && <PortHandle port={port} />}

      <div className={cn(
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle>
          {title}
        </PortTitle>

      </div>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}

// Export a memoized version of the component to prevent unnecessary re-renders
export const AnyPort = memo(AnyPortComponent)
