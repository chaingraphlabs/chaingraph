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
  ExtractValue,
  INode,
  IPort,
} from '@badaitech/chaingraph-types'
import { PortHandle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortHandle'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { cn } from '@/lib/utils'
import { memo, useCallback, useMemo } from 'react'
import { PortTitle } from '../ui/PortTitle'

export interface AnyPortProps {
  node: INode
  port: IPort<AnyPortConfig>
  context: PortContextValue
}

function AnyPortComponent(props: AnyPortProps) {
  const { node, port, context } = props
  const { updatePortValue, getEdgesForPort } = context

  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key

  // Memoize the edges for this port
  const connectedEdges = useMemo(() => {
    return getEdgesForPort(port.id)
  }, [getEdgesForPort, port.id])

  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges)
  }, [config, connectedEdges])

  const handleChange = useCallback((value: ExtractValue<AnyPortConfig> | undefined) => {
    updatePortValue({
      nodeId: node.id,
      portId: port.id,
      value,
    })
  }, [node.id, port.id, updatePortValue])

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

        {config.underlyingType && (
          <div
            className={cn(
              'text-xs text-gray-500',
              config.direction === 'output' ? 'text-right' : 'text-left',
            )}
          >
            {config.underlyingType.type}
          </div>
        )}
      </div>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}

// Export a memoized version of the component to prevent unnecessary re-renders
export const AnyPort = memo(AnyPortComponent)
