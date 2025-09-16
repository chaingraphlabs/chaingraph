/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { IPort, IPortConfig } from '@badaitech/chaingraph-types'
import { Handle, Position } from '@xyflow/react'
import { useUnit } from 'effector-react/effector-react.umd'
import { cn } from '@/lib/utils'
import { $compatiblePortsToDraggingEdge } from '@/store/edges/stores'
import { PortDocTooltip } from '../doc'

interface Props<C extends IPortConfig> {
  className?: string
  port: IPort<C>
  isConnectable?: boolean
  forceDirection?: 'input' | 'output'
}

export function PortHandle<C extends IPortConfig>({ port, forceDirection, className, isConnectable }: Props<C>) {
  const config = port.getConfig()

  const compatiblePorts = useUnit($compatiblePortsToDraggingEdge)
  const isDraggingCompatible = compatiblePorts && compatiblePorts.includes(port.id)

  const isCompatible = compatiblePorts === null ? true : isDraggingCompatible

  const bgColor = isCompatible
    ? config.ui?.bgColor
    : '#a1a1a1'

  const direction = forceDirection ?? config.direction
  const position = direction === 'input'
    ? Position.Left
    : Position.Right

  return (
    <PortDocTooltip port={port}>
      <Handle
        id={config.id}
        hidden={config.ui?.hidePort === true}
        isConnectable={isConnectable === undefined || isConnectable}
        type={direction === 'input' ? 'target' : 'source'}
        position={position}
        style={
          isDraggingCompatible
            ? {
                backgroundColor: bgColor,
                boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5)',
              }
            : {
                backgroundColor: bgColor,
              }
        }
        className={cn(
          'absolute',
          'w-2 h-2 rounded-full top-2',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          'z-50',
          direction === 'input' ? '-left-4' : '-right-4',
          !bgColor && 'bg-flow-data',
          className,
          !isCompatible && 'opacity-10 cursor-not-allowed',
          isCompatible && 'cursor-pointer',
        )}
      />
    </PortDocTooltip>
  )
}
