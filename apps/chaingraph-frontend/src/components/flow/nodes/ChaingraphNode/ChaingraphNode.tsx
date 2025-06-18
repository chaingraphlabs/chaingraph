/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import type { NodeProps } from '@xyflow/react'
import type { ChaingraphNode } from './types'
import { mergeNodePortsUi } from '@/components/flow/nodes/ChaingraphNode/utils/merge-nodes'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useNodeDropFeedback } from '@/store/drag-drop'
import { useEdgesForNode } from '@/store/edges/hooks/useEdges'
import {
  $executionState,
  $highlightedNodeId,
  addBreakpoint,
  removeBreakpoint,
} from '@/store/execution'
import { useBreakpoint } from '@/store/execution/hooks/useBreakpoint'
import { useNodeExecution } from '@/store/execution/hooks/useNodeExecution'
import { $activeFlowMetadata, $isFlowLoaded } from '@/store/flow'
import { removeNodeFromFlow, updateNodeUI } from '@/store/nodes'
import { useNode } from '@/store/nodes/hooks/useNode'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  requestUpdatePortUI,
  requestUpdatePortValue,
  updateItemConfigArrayPort,
} from '@/store/ports'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo } from 'react'
import { BreakpointButton } from '../debug/BreakpointButton'
import { useElementResize } from './hooks/useElementResize'
import NodeBody from './NodeBody'
import NodeErrorPorts from './NodeErrorPorts'
import { NodeHeader } from './NodeHeader'

const defaultCategoryMetadata = {
  id: 'other',
  label: 'Other',
  description: 'Other nodes',
  icon: 'Package',
  style: {
    light: {
      primary: '#F5F5F5', // Soft gray
      secondary: '#FAFAFA',
      background: '#FFFFFF',
      text: '#616161', // Darker gray
    },
    dark: {
      primary: '#2C2C2C',
      secondary: '#1F1F1F',
      background: '#1C1C1C',
      text: '#BDBDBD',
    },
  },
  order: 7,
} satisfies CategoryMetadata

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
    updateItemConfigArrayPort,
    appendElementArrayPort,
    removeElementArrayPort,
    addFieldObjectPort,
    removeFieldObjectPort,
  })
  const { theme } = useTheme()
  const node = useNode(id)
  const parentNode = useNode(node.metadata.parentNodeId || '')
  const nodeEdges = useEdgesForNode(id)
  const highlightedNodeId = useUnit($highlightedNodeId)
  const isFlowLoaded = useUnit($isFlowLoaded)
  const dropFeedback = useNodeDropFeedback(id)

  const categoryMetadata = data.categoryMetadata ?? defaultCategoryMetadata

  const style = useMemo(() => {
    return theme === 'dark' ? categoryMetadata.style.dark : categoryMetadata.style.light
  }, [categoryMetadata, theme])

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

  // Use throttled/memoized version of execution state style to reduce renders
  const executionStateStyle = useMemo(() => {
    // Calculate the style based on node state
    const calculateStyle = () => {
      if (selected) {
        return 'border-blue-500 shadow-[0_0_35px_rgba(34,94,197,0.6)]'
      }
      if (executionId && !nodeExecution) {
        return 'border-gray-500 opacity-30'
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
      updateItemConfigArrayPort: params => dispatch.updateItemConfigArrayPort({
        nodeId: params.nodeId,
        portId: params.portId,
        itemConfig: params.itemConfig,
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

  const nodeToRender = useMemo(() => {
    return nodeExecution?.node ? mergeNodePortsUi(nodeExecution.node, node) : node
  }, [node, nodeExecution])

  // Use a custom hook to handle element resize
  const { ref: cardRef } = useElementResize<HTMLDivElement>({
    debounceTime: 500,
    onResize: (size) => {
      if (!activeFlow || !activeFlow.id || !node || !isFlowLoaded)
        return

      // Check if element is visible and has reasonable dimensions
      // This prevents updates when tabs are hidden or during mounting
      const MIN_WIDTH = 100
      const MIN_HEIGHT = 40

      if (size.width < MIN_WIDTH || size.height < MIN_HEIGHT) {
        console.warn(`Node resize ignored: dimensions too small (${size.width}x${size.height})`)
        return
      }

      // Check if the element is actually visible
      const element = cardRef.current
      if (element) {
        const rect = element.getBoundingClientRect()
        const isVisible = rect.width > 0 && rect.height > 0
          && rect.top < window.innerHeight
          && rect.bottom > 0

        if (!isVisible) {
          console.warn('Node resize ignored: element not visible')
          return
        }
      }

      const actualDimensions = node.metadata.ui?.dimensions || {
        width: 200, // Use reasonable defaults instead of 0
        height: 50,
      }

      const isDimensionsChanged = size.width !== actualDimensions.width
        || size.height !== actualDimensions.height

      if (!isDimensionsChanged)
        return

      const diffWidth = size.width - actualDimensions.width
      const diffHeight = size.height - actualDimensions.height

      // threshold for minimum size
      const threshold = 5
      if (Math.abs(diffWidth) < threshold && Math.abs(diffHeight) < threshold)
        return

      updateNodeUI({
        flowId: activeFlow.id!,
        nodeId: id,
        ui: {
          // ...node.metadata.ui,
          dimensions: {
            width: size.width,
            height: size.height,
          },
        },
        version: node.getVersion(),
      })
    },
  })

  if (!activeFlow || !activeFlow.id || !nodeToRender)
    return null

  return (
    <Card
      ref={cardRef}
      className={cn(
        'shadow-none transition-all duration-200',
        'bg-card opacity-95',
        '',
        // Drop feedback styling for schema drops
        dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema' && [
          'shadow-[0_0_30px_rgba(34,197,94,0.8)]',
          'ring-4 ring-green-500/40',
        ],
        // Regular selection styling (only if not accepting drop)
        !dropFeedback?.canAcceptDrop && selected
          ? 'shadow-[0_0_25px_rgba(34,197,94,0.6)]'
          : !dropFeedback?.canAcceptDrop && 'shadow-[0_0_12px_rgba(0,0,0,0.3)]',
        executionStateStyle,

        isHighlighted && 'shadow-[0_0_35px_rgba(59,130,246,0.9)] opacity-90',
        highlightedNodeId !== null && !isHighlighted && 'opacity-40',
      )}
      style={{
        borderColor: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema'
          ? '#22c55e' // green-500
          : style.secondary,
        borderWidth: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema' ? 3 : 2,
      }}
    >
      {/* Breakpoint Strip */}
      {debugMode && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5
                      hover:w-2 transition-all duration-200"
        >
          <BreakpointButton
            nodeId={nodeToRender.id}
            enabled={isBreakpointSet}
            onToggle={handleBreakpointToggle}
          />
        </div>
      )}

      <NodeHeader
        node={nodeToRender}
        context={portContextValue}
        icon={categoryMetadata.icon}
        style={style}
        categoryMetadata={categoryMetadata}
        onDelete={() => removeNodeFromFlow({
          flowId: activeFlow.id!,
          nodeId: id,
        })}
        debugMode={debugMode}
        isBreakpointSet={isBreakpointSet}
        onBreakpointToggle={handleBreakpointToggle}
      />

      <NodeBody
        node={nodeToRender}
        context={portContextValue}
      />

      {(!parentNode || (parentNode.metadata.category === 'group')) && (
        <NodeErrorPorts
          node={nodeToRender}
          context={portContextValue}
        />
      )}

      {/* Resize control */}
      <NodeResizeControl
        variant={ResizeControlVariant.Handle}
        position="right"
        minWidth={200}
        style={{
          background: 'transparent',
          border: 'none',
          height: '100%',
          width: 12,
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
