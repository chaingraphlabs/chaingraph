/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import { Handle, Position } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { usePortEdges } from '@/store/nodes/computed'
import { $compatiblePortsToDraggingEdge } from '@/store/edges/stores'
import { PortDocTooltip } from './ports/doc'

export interface NodeFlowPortsProps {
  node: INode
}

// Separate component for port handle to use hooks properly
const FlowPortHandle = memo(function FlowPortHandle({
  nodeId,
  port,
  position,
  compatiblePorts,
}: {
  nodeId: string
  port: IPort
  position: Position
  compatiblePorts: string[] | null
}) {
  const config = port.getConfig()
  const portId = port.id

  // Use granular edge hook
  const edges = usePortEdges(nodeId, portId)
  const isConnected = edges.length > 0

  // Determine color based on connection
  const portColor = config.ui?.bgColor || '#4a90e2'
  const isDraggingCompatible = compatiblePorts !== null ? compatiblePorts.includes(portId) : true

  return (
    <PortDocTooltip nodeId={nodeId} portId={portId}>
      <Handle
        type={position === Position.Left ? 'target' : 'source'}
        position={position}
        id={portId}
        style={{
          background: isDraggingCompatible ? portColor : '#a1a1a1',
          opacity: isDraggingCompatible ? 1 : 0.1,
          boxShadow: compatiblePorts !== null && isDraggingCompatible ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
          top: 16,
          transform: position === Position.Left ? 'translateX(-100%)' : 'translateX(100%)',
          zIndex: 20,
        }}
        className={cn(
          'nodrag',
          'w-4 h-4 rounded-full',
          'border-2 border-background',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          'z-50',
        )}
      />
    </PortDocTooltip>
  )
})

function NodeFlowPorts({ node }: NodeFlowPortsProps) {
  // Filter out the flow ports from the default ports
  const flowPorts = useMemo(() => {
    return node.getDefaultPorts().filter((port) => {
      return port.isSystem() && !port.isSystemError()
    })
  }, [node])

  // Separate into input and output ports
  const flowInPort = useMemo(() =>
    flowPorts.find(
      port => port.isSystem() && port.getConfig().direction === 'input',
    ), [flowPorts])

  const flowOutPort = useMemo(() =>
    flowPorts.find(
      port => port.isSystem() && port.getConfig().direction === 'output',
    ), [flowPorts])

  const compatiblePorts = useUnit($compatiblePortsToDraggingEdge)

  // Only render if we have flow ports
  if (!flowInPort && !flowOutPort) {
    return null
  }

  return (
    <>
      {/* Flow In Port (left side) */}
      {flowInPort && (
        <FlowPortHandle
          nodeId={node.id}
          port={flowInPort}
          position={Position.Left}
          compatiblePorts={compatiblePorts}
        />
      )}

      {/* Flow Out Port (right side) */}
      {flowOutPort && (
        <FlowPortHandle
          nodeId={node.id}
          port={flowOutPort}
          position={Position.Right}
          compatiblePorts={compatiblePorts}
        />
      )}
    </>
  )
}

export default memo(NodeFlowPorts)
