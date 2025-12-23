/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Handle, Position } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import { $compatiblePortsToDraggingEdge } from '@/store/edges/stores'
import { usePortEdges } from '@/store/nodes/computed'
import { usePortConfig } from '@/store/ports-v2'
import { useXYFlowNodeFlowPorts } from '@/store/xyflow'
import { PortDocTooltip } from './ports/doc'

export interface NodeFlowPortsProps {
  nodeId: string
}

// Separate component for port handle to use hooks properly
const FlowPortHandle = memo(({
  nodeId,
  portId,
  position,
  compatiblePorts,
}: {
  nodeId: string
  portId: string
  position: Position
  compatiblePorts: string[] | null
}) => {
  // Fetch port config from granular store
  const config = usePortConfig(nodeId, portId)

  // Use granular edge hook
  const edges = usePortEdges(nodeId, portId)
  const isConnected = edges.length > 0

  // Early return if config not loaded
  if (!config) return null

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

function NodeFlowPorts({ nodeId }: NodeFlowPortsProps) {
  // Granular subscription - only 2 fields (flowInputPortId, flowOutputPortId)
  // Component only re-renders when these specific fields change
  const portData = useXYFlowNodeFlowPorts(nodeId)

  const compatiblePorts = useUnit($compatiblePortsToDraggingEdge)

  // Early return if no data or no flow ports
  if (!portData || (!portData.flowInputPortId && !portData.flowOutputPortId)) {
    return null
  }

  const { flowInputPortId, flowOutputPortId } = portData

  return (
    <>
      {/* Flow In Port (left side) */}
      {flowInputPortId && (
        <FlowPortHandle
          nodeId={nodeId}
          portId={flowInputPortId}
          position={Position.Left}
          compatiblePorts={compatiblePorts}
        />
      )}

      {/* Flow Out Port (right side) */}
      {flowOutputPortId && (
        <FlowPortHandle
          nodeId={nodeId}
          portId={flowOutputPortId}
          position={Position.Right}
          compatiblePorts={compatiblePorts}
        />
      )}
    </>
  )
}

export default memo(NodeFlowPorts)
