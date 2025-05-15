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
import type { BooleanPortConfig, ExtractValue, INode, IPort } from '@badaitech/chaingraph-types'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { memo, useCallback, useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface BooleanPortProps {
  node: INode
  port: IPort<BooleanPortConfig>
  context: PortContextValue
}

function BooleanPortComponent(props: BooleanPortProps) {
  const executionID = useExecutionID()

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

  const handleChange = useCallback((value: ExtractValue<BooleanPortConfig> | undefined) => {
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
        'truncate',
      )}
      >
        <PortTitle>
          {title}
        </PortTitle>

        {needRenderEditor && (
          <Switch
            disabled={executionID ? true : ui?.disabled ?? false}
            checked={port.getValue()}
            onCheckedChange={checked => handleChange(checked)}
            className={cn('nodrag')}
          />
        )}
      </div>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}

// Export a memoized version of the component to prevent unnecessary re-renders
export const BooleanPort = memo(BooleanPortComponent)
