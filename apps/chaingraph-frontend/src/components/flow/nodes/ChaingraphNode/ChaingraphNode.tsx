/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeProps } from '@xyflow/react'
import type { ChaingraphNode } from './types'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useEdgesForNode } from '@/store/edges/hooks/useEdges'
import {
  $executionState,
  $highlightedNodeId,
  addBreakpoint,
  removeBreakpoint,
} from '@/store/execution'
import { useBreakpoint } from '@/store/execution/hooks/useBreakpoint'
import { useNodeExecution } from '@/store/execution/hooks/useNodeExecution'
import { $activeFlowMetadata } from '@/store/flow'
import { removeNodeFromFlow } from '@/store/nodes'
import { useNode } from '@/store/nodes/hooks/useNode'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  requestUpdatePortUI,
  requestUpdatePortValue,
} from '@/store/ports'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { BreakpointButton } from '../debug/BreakpointButton'
import NodeBody from './NodeBody'
import NodeErrorPorts from './NodeErrorPorts'
import { NodeHeader } from './NodeHeader'

function ChaingraphNodeComponent({
  data,
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  const activeFlow = useUnit($activeFlowMetadata)
  const nodeExecution = useNodeExecution(id)
  const dispatch = useUnit({
    addBreakpoint,
    removeBreakpoint,
    requestUpdatePortValue,
    requestUpdatePortUI,
    appendElementArrayPort,
    removeElementArrayPort,
    addFieldObjectPort,
    removeFieldObjectPort,
  })
  const { theme } = useTheme()
  const node = useNode(id)
  const nodeEdges = useEdgesForNode(id)
  const highlightedNodeId = useUnit($highlightedNodeId)

  const [style, setStyle] = useState(
    theme === 'dark' ? data.categoryMetadata.style.dark : data.categoryMetadata.style.light,
  )

  const isHighlighted = useMemo(
    () => highlightedNodeId && highlightedNodeId.includes(id),
    [highlightedNodeId, id],
  )

  const { debugMode, executionId } = useUnit($executionState)
  const isBreakpointSet = useBreakpoint(id)
  // const { getZoom } = useReactFlow()

  // Get edges for each port - needs to be defined here so the hook works properly
  const edgesMapByPortId = useMemo(() => {
    // Create a map to avoid recalculating filters on every access
    const portEdgesMap = new Map()
    if (node) {
      // Pre-compute edges for each port
      node.ports.forEach((port) => {
        const portId = port.id
        const filteredEdges = nodeEdges.filter(
          edge => edge.sourcePortId === portId || edge.targetPortId === portId,
        )
        portEdgesMap.set(portId, filteredEdges)
      })
    }
    return portEdgesMap
  }, [node, nodeEdges])

  const getEdgesForPortFunction = useCallback((portId: string) => {
    return edgesMapByPortId.get(portId) || []
  }, [edgesMapByPortId])

  // Get current zoom level for port components that need it
  const handleBreakpointToggle = useCallback(() => {
    if (isBreakpointSet) {
      dispatch.removeBreakpoint({ nodeId: id })
    } else {
      dispatch.addBreakpoint({ nodeId: id })
    }
  }, [isBreakpointSet, dispatch, id])

  useEffect(() => {
    setStyle(
      theme === 'dark' ? data.categoryMetadata.style.dark : data.categoryMetadata.style.light,
    )
  }, [theme, data.categoryMetadata, id])

  // Use throttled/memoized version of execution state style to reduce renders
  const executionStateStyle = useMemo(() => {
    // Calculate the style based on node state
    const calculateStyle = () => {
      if (selected) {
        return 'border-blue-500 shadow-[0_0_35px_rgba(34,94,197,0.6)]'
      }
      if (nodeExecution) {
        if (nodeExecution.isExecuting) {
          return `border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-[1.02] animate-[glow_3s_ease-in-out_infinite]`
        }
        if (nodeExecution.isCompleted) {
          return 'border-green-500 shadow-[0_0_20px_rgba(34,207,94,0.5)]'
        }
        if (nodeExecution.isFailed) {
          return 'border-red-500 shadow-[0_0_20px_rgba(249,68,68,0.5)] opacity-80'
        }
        if (nodeExecution.isSkipped) {
          return 'border-gray-500 opacity-50'
        }

        if (executionId) {
          if (nodeExecution.status === 'idle') {
            return 'border-gray-500 opacity-30'
          }
        }
      }

      return ''
    }

    // Only the execution status matters for styling, not all nodeExecution properties
    return calculateStyle()
  }, [
    selected,
    nodeExecution,
    executionId,
  ])

  // Memoize the entire context value to prevent unnecessary renders
  const portContextValue = useMemo(() => {
    return {
      updatePortValue: params => dispatch.requestUpdatePortValue(params),
      updatePortUI: params => dispatch.requestUpdatePortUI(params),
      addFieldObjectPort: params => dispatch.addFieldObjectPort({
        nodeId: params.nodeId,
        portId: params.portId,
        config: params.config,
        key: params.key,
      }),
      removeFieldObjectPort: params => dispatch.removeFieldObjectPort({
        nodeId: params.nodeId,
        portId: params.portId,
        key: params.key,
      }),
      appendElementArrayPort: params => dispatch.appendElementArrayPort({
        nodeId: params.nodeId,
        portId: params.portId,
        value: params.value,
      }),
      removeElementArrayPort: params => dispatch.removeElementArrayPort({
        nodeId: params.nodeId,
        portId: params.portId,
        index: params.index,
      }),
      getEdgesForPort: getEdgesForPortFunction,
    }
  }, [dispatch, getEdgesForPortFunction])

  if (!activeFlow || !activeFlow.id || !node)
    return null

  return (
    <Card
      className={cn(
        'shadow-none transition-all duration-200',
        'bg-card opacity-95',
        '',
        selected
          ? 'shadow-[0_0_25px_rgba(34,197,94,0.6)]'
          : 'shadow-[0_0_12px_rgba(0,0,0,0.3)]',
        executionStateStyle,

        isHighlighted && 'shadow-[0_0_35px_rgba(59,130,246,0.9)] opacity-90',
        highlightedNodeId !== null && !isHighlighted && 'opacity-40',
      )}
      style={{
        borderColor: style.secondary,
        borderWidth: 2,
      }}
    >
      {/* Breakpoint Strip */}
      {debugMode && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5
                      hover:w-2 transition-all duration-200"
        >
          <BreakpointButton
            nodeId={node.id}
            enabled={isBreakpointSet}
            onToggle={handleBreakpointToggle}
          />
        </div>
      )}

      <NodeHeader
        node={nodeExecution?.node ?? node}
        context={portContextValue}
        icon={data.categoryMetadata.icon}
        style={style}
        onDelete={() => removeNodeFromFlow({
          flowId: activeFlow.id!,
          nodeId: id,
        })}
        debugMode={debugMode}
        isBreakpointSet={isBreakpointSet}
        onBreakpointToggle={handleBreakpointToggle}
      />

      <NodeBody node={nodeExecution?.node ?? node} context={portContextValue} />

      <NodeErrorPorts node={nodeExecution?.node ?? node} context={portContextValue} />

      <NodeResizeControl
        variant={ResizeControlVariant.Handle}
        position="right"
        minWidth={100}
        style={{
          background: 'transparent',
          border: 'none',
          height: '100%',
          width: 10,
        }}
      />

      {nodeExecution?.executionTime !== undefined && (
        <div className="absolute -top-2 -right-2 px-1 py-0.5 text-xs bg-background rounded border shadow-sm">
          {nodeExecution?.executionTime}
          ms
        </div>
      )}
    </Card>
  )
}

export default memo(ChaingraphNodeComponent)
