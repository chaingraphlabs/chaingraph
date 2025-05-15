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
import type { EnumPortConfig, INode, IPort } from '@badaitech/chaingraph-types'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { useCallback, useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface EnumPortProps {
  node: INode
  port: IPort<EnumPortConfig>
  context: PortContextValue
}

export function EnumPort(props: EnumPortProps) {
  const executionID = useExecutionID()

  const { node, port, context } = props
  const { updatePortValue, getEdgesForPort } = context

  const config = port.getConfig()
  const ui = config.ui

  // Memoize edges for this port
  const connectedEdges = useMemo(() => {
    return getEdgesForPort(port.id)
  }, [getEdgesForPort, port.id])

  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges)
  }, [config, connectedEdges])

  // Choose a title from config.title or config.key.
  const title = config.title || config.key

  // The configuration should include an "options" array.
  const options = config.options || []

  // Memoize value change handler
  const handleValueChange = useCallback((value: string) => {
    updatePortValue({
      nodeId: node.id,
      portId: port.id,
      value,
    })
  }, [node.id, port.id, updatePortValue])

  // If the port should be hidden, don't render it.
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
        'flex flex-col w-full',
        config.direction === 'output' ? 'items-end' : 'items-start',
        'truncate',
      )}
      >
        <PortTitle>
          {title}
        </PortTitle>
        {needRenderEditor && (
          <Select
            value={port.getValue()}
            onValueChange={handleValueChange}
            disabled={executionID ? true : ui?.disabled ?? false}
          >
            <SelectTrigger
              className={cn(
                'w-full text-xs p-1 h-8',
                // errorMessage && 'border-red-500',
                'nodrag',
              )}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
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

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}
