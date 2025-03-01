/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext.tsx'
import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode/types'
import type { NodeProps } from '@xyflow/react'
import { NodeHeader } from '@/components/flow/nodes/ChaingraphNode/NodeHeader.tsx'
import { BreakpointButton } from '@/components/flow/nodes/debug/BreakpointButton.tsx'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils'
import { $activeFlowMetadata, removeNodeFromFlow } from '@/store'
import { useEdgesForNode } from '@/store/edges/hooks/useEdges.ts'
import { $executionState, addBreakpoint, removeBreakpoint } from '@/store/execution'
import { useBreakpoint } from '@/store/execution/hooks/useBreakpoint'
import { useNodeExecution } from '@/store/execution/hooks/useNodeExecution'
import { useNode } from '@/store/nodes/hooks/useNode.ts'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  requestUpdatePortUI,
  requestUpdatePortValue,
} from '@/store/ports'
import { NodeResizeControl, ResizeControlVariant, useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import NodeBody from './NodeBody'

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

  const [style, setStyle] = useState(
    theme === 'dark' ? data.categoryMetadata.style.dark : data.categoryMetadata.style.light,
  )

  const { debugMode } = useUnit($executionState)
  const isBreakpointSet = useBreakpoint(id)
  const { getZoom } = useReactFlow()

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

  const executionStateStyle = useMemo(() => {
    if (nodeExecution.isExecuting) {
      return 'animate-pulse border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
    }
    if (nodeExecution.isCompleted) {
      return 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
    }
    if (nodeExecution.isFailed) {
      return 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
    }
    if (nodeExecution.isSkipped) {
      return 'border-gray-500 opacity-50'
    }
    return ''
  }, [nodeExecution])

  // Memoize the entire context value to prevent unnecessary renders
  const portContextValue = useMemo(() => {
    const portContextValue: PortContextValue = {
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
    return portContextValue
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
        node={node}
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

      {/* <PortContextProvider value={portContextValue}> */}
      <NodeBody node={node} context={portContextValue} />
      {/* </PortContextProvider> */}

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

      {nodeExecution.executionTime !== undefined && (
        <div className="absolute -top-2 -right-2 px-1 py-0.5 text-xs bg-background rounded border shadow-sm">
          {nodeExecution.executionTime}
          ms
        </div>
      )}
    </Card>
  )
}

export default memo(ChaingraphNodeComponent)
