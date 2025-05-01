/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { IPort, IPortConfig } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils'
import { Handle, Position } from '@xyflow/react'
import { PortDocTooltip } from '../doc'

interface Props<C extends IPortConfig> {
  className?: string
  port: IPort<C>
}

export function PortHandle<C extends IPortConfig>({ port, className }: Props<C>) {
  const config = port.getConfig()
  const bgColor = config.ui?.bgColor

  return (
    <PortDocTooltip port={port}>
      <Handle
        id={config.id}
        hidden={config.ui?.hidePort === true}
        type={config.direction === 'input' ? 'target' : 'source'}
        position={config.direction === 'input' ? Position.Left : Position.Right}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className={cn(
          'absolute',
          'w-2 h-2 rounded-full top-2',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          'z-50',
          config.direction === 'input' ? '-left-4' : '-right-4',
          !bgColor && 'bg-flow-data',
          className,
        )}
      />
    </PortDocTooltip>
  )
}
