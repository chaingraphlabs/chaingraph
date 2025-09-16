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
import { useStore } from '@xyflow/react'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo } from 'react'
import { useElementResize } from '@/components/flow/nodes/ChaingraphNode/hooks/useElementResize'
import { mergeNodePortsUi } from '@/components/flow/nodes/ChaingraphNode/utils/merge-nodes'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Skeleton } from '@/components/ui'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useNodeDropFeedback } from '@/store/drag-drop'
import {
  $executionState,
  addBreakpoint,
  removeBreakpoint,
} from '@/store/execution'
import { useBreakpoint } from '@/store/execution/hooks/useBreakpoint'
import { useNodeExecution } from '@/store/execution/hooks/useNodeExecution'
import { $activeFlowMetadata, $isFlowLoaded } from '@/store/flow'
import { removeNodeFromFlow, updateNodeUI } from '@/store/nodes'
import {
  useHasHighlightedNodes,
  useIsNodeHighlighted,
  useNodeExecutionStyle,
  useNodePortContextValue,
} from '@/store/nodes/computed'
import { useNode } from '@/store/nodes/hooks/useNode'
import { useNodePulseState } from '@/store/updates'
import { BreakpointButton } from '../debug/BreakpointButton'
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

const zoomSelector = s => s.transform[2] >= 0.2

function ChaingraphNodeComponent({
  data,
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  const showContent = useStore(zoomSelector)

  // Optimized granular hooks - only subscribe to what we need
  const node = useNode(id)
  const parentNode = useNode(node?.metadata.parentNodeId || '')
  const nodeExecution = useNodeExecution(id)
  const executionStyle = useNodeExecutionStyle(id)
  const portContext = useNodePortContextValue(id) // Now returns PortContextValue, not undefined
  const nodePulseState = useNodePulseState(id)
  const isHighlighted = useIsNodeHighlighted(id)
  const hasHighlights = useHasHighlightedNodes()
  const dropFeedback = useNodeDropFeedback(id)
  const isBreakpointSet = useBreakpoint(id)

  // Only these need useUnit (minimal subscriptions)
  const activeFlow = useUnit($activeFlowMetadata)
  const { debugMode } = useUnit($executionState)
  const isFlowLoaded = useUnit($isFlowLoaded)

  // Debug: Track changes in hook values
  // useWhyDidYouUpdate(`Node-${id}-hooks`, {
  //   nodeVersion: node?.getVersion(),
  //   executionStyle: executionStyle?.className,
  //   pulseState: nodePulseState,
  //   isHighlighted,
  //   hasHighlights,
  //   dropFeedback: dropFeedback?.canAcceptDrop,
  //   isBreakpointSet,
  //   debugMode,
  // })

  // Theme and metadata
  const { theme } = useTheme()

  const categoryMetadata = data.categoryMetadata ?? defaultCategoryMetadata
  const style = useMemo(() => {
    return theme === 'dark' ? categoryMetadata.style.dark : categoryMetadata.style.light
  }, [categoryMetadata, theme])

  // Breakpoint handling
  const handleBreakpointToggle = useCallback(() => {
    if (isBreakpointSet) {
      removeBreakpoint({ nodeId: id })
    } else {
      addBreakpoint({ nodeId: id })
    }
  }, [isBreakpointSet, id])

  // Compute final execution style (combine selected + execution state)
  const finalExecutionStyle = useMemo(() => {
    if (selected) {
      return 'border-blue-500 shadow-[0_0_35px_rgba(34,94,197,0.6)]'
    }
    return executionStyle?.className || ''
  }, [selected, executionStyle])

  // Merged node for rendering (execution node or regular node)
  const nodeToRender = useMemo(() => {
    return nodeExecution?.node ? mergeNodePortsUi(nodeExecution.node, node!) : node
  }, [node, nodeExecution])

  // Use a custom hook to handle element resize
  const { ref: cardRef } = useElementResize<HTMLDivElement>({
    debounceTime: 500,
    onResize: (size) => {
      if (!activeFlow || !activeFlow.id || !node || !isFlowLoaded || !showContent)
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
          // console.warn('Node resize ignored: element not visible')
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
        // Execution state styling
        finalExecutionStyle,
        // Pulse animations
        nodePulseState === 'pulse' && 'animate-update-pulse',
        nodePulseState === 'fade' && 'animate-update-fade',
        // Highlighting
        isHighlighted && 'shadow-[0_0_35px_rgba(59,130,246,0.9)] opacity-90',
        hasHighlights && !isHighlighted && 'opacity-40',
      )}
      style={{
        borderColor: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema'
          ? '#22c55e' // green-500
          : style.secondary,
        borderWidth: dropFeedback?.canAcceptDrop && dropFeedback?.dropType === 'schema' ? 3 : 2,

        // width: `${node.metadata.ui.dimensions?.width || 200}px`,
        // height: `${node.metadata.ui.dimensions?.height || 50}px`,
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
        context={portContext}
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

      {showContent
        ? (
            <NodeBody
              node={nodeToRender}
              context={portContext}
            />
          )
        : (
            <div
              className="p-4 text-center text-muted-foreground"
              style={{
                width: `${node!.metadata.ui?.dimensions?.width || 200}px`,
                height: `${node!.metadata.ui?.dimensions?.height ? node!.metadata.ui?.dimensions?.height - 85 : 50}px`,
              }}
            >
              {/* <div>Zoom in to see node details</div> */}
              {/* <Skeleton className="w-24 h-4 mx-auto mt-2" /> */}
              <Skeleton className="h-4 w-[95%]" />
            </div>
          )}

      {/* Node ports */}

      {(!parentNode || (parentNode.metadata.category === 'group')) && (
        <div className="mt-2">
          <NodeErrorPorts
            node={nodeToRender}
            context={portContext}
          />
        </div>
      )}

      {/* Resize control */}
      <NodeResizeControl
        variant={ResizeControlVariant.Handle}
        position="right"
        minWidth={200}
        autoScale={false}
        style={{
          background: 'transparent',
          border: 'none',
          height: '100%',
          width: 12,
        }}
        shouldResize={() => {
          return showContent
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
