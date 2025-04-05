/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import type { PortContextValue } from './ports/context/PortContext'
import { cn } from '@/lib/utils'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { memo, useMemo } from 'react'

export interface NodeFlowPortsProps {
  node: INode
  context: PortContextValue
}

function NodeFlowPorts({
  node,
  context,
}: NodeFlowPortsProps) {
  const { getEdgesForPort } = context
  const { getZoom } = useReactFlow()

  // Filter out the flow ports from the default ports
  const flowPorts = useMemo(() => {
    return node.getDefaultPorts().filter((port) => {
      const metadata = port.getConfig().metadata
      return metadata?.isSystemPort === true && metadata?.portCategory === 'flow'
    })
  }, [node])

  // Separate into input and output ports
  const flowInPort = useMemo(() =>
    flowPorts.find(port => port.getConfig().key === '__execute'), [flowPorts])

  const flowOutPort = useMemo(() =>
    flowPorts.find(port => port.getConfig().key === '__success'), [flowPorts])

  // Helper to render port handles
  const renderPortHandle = (port: IPort, position: Position) => {
    const config = port.getConfig()
    const portId = port.id
    const edges = getEdgesForPort(portId)
    const isConnected = edges.length > 0

    // Determine color based on connection
    const portColor = config.ui?.bgColor || (
      position === Position.Left ? '#4a90e2' : '#4a90e2'
    )

    return (
      <Handle
        type={position === Position.Left ? 'target' : 'source'}
        position={position}
        id={portId}
        style={{
          background: portColor,
          // border: `2px solid ${isConnected ? '#ffffff' : portColor}`,
          top: 16, // Position at header level
          transform: position === Position.Left ? 'translateX(-100%)' : 'translateX(100%)',
          // width: 10,
          // height: 10,
          zIndex: 20,
        }}
        // className=
        className={cn(
          // 'absolute',
          'nodrag',
          'w-4 h-4 rounded-full',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          'z-50',
          // !bgColor && 'bg-flow-data',
          // className,
        )}
      />
    )
  }

  // Only render if we have flow ports
  if (!flowInPort && !flowOutPort) {
    return null
  }

  return (
    <>
      {/* Flow In Port (left side) */}
      {flowInPort && renderPortHandle(flowInPort, Position.Left)}

      {/* Flow Out Port (right side) */}
      {flowOutPort && renderPortHandle(flowOutPort, Position.Right)}
    </>
  )
}

export default memo(NodeFlowPorts)
